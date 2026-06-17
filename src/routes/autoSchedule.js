import { json, badRequest, notFound, requireId } from "../lib.js";
import { validate, validationError } from "../validate.js";
import { hasPermission } from "../auth.js";
import { route } from "../routes.js";

export const autoScheduleRoutes = [
  route("POST", "/api/plans/:id/auto-schedule", async (request, env, params) => {
    const planId = requireId(params)
    if (!planId) return badRequest("Invalid plan ID")

    if (!(await hasPermission(request, env, "schedule")))
      return json({ error: "Forbidden" }, 403)

    const plan = await env.DB.prepare(
      "SELECT id, date, service_type_id FROM plans WHERE id = ?",
    ).bind(planId).first()
    if (!plan) return notFound("Plan not found")

    const body = await request.json().catch(() => null)
    if (body) {
      const err = validate({
        team_ids: { type: 'array' },
        positions: { type: 'array' },
        max_per_position: { type: 'integer', min: 1, max: 10 },
      }, body)
      if (err) return validationError(err)
    }

    const teamIds = body?.team_ids
    const positions = body?.positions
    const maxPerPosition = body?.max_per_position || 1

    const planDate = plan.date
    const planMonth = planDate?.slice(0, 7)

    // Step 1: Identify target teams
    let teams = []
    if (teamIds && teamIds.length > 0) {
      const placeholders = teamIds.map(() => '?').join(',')
      teams = (await env.DB.prepare(
        `SELECT id, name, service_type FROM teams WHERE id IN (${placeholders})`,
      ).bind(...teamIds).all()).results
    } else {
      teams = (await env.DB.prepare(
        `SELECT id, name, service_type FROM teams WHERE service_type = ? OR service_type IS NULL`,
      ).bind(plan.service_type_id || 0).all()).results
    }

    if (!teams.length) return json({ message: "No teams found to schedule", assignments: [] })

    // Step 2: Get all team members with their positions
    const teamIdsList = teams.map(t => t.id)
    const teamPlaceholders = teamIdsList.map(() => '?').join(',')
    const teamMembers = (await env.DB.prepare(`
      SELECT tm.member_id, tm.team_id, tm.position, m.first_name, m.last_name
      FROM team_members tm
      JOIN members m ON m.id = tm.member_id
      WHERE tm.team_id IN (${teamPlaceholders})
    `).bind(...teamIdsList).all()).results

    if (!teamMembers.length) return json({ message: "No team members found", assignments: [] })

    // Step 3: Get volunteer preferences for all relevant members
    const memberIds = [...new Set(teamMembers.map(tm => tm.member_id))]
    const memberPlaceholders = memberIds.map(() => '?').join(',')
    const preferences = (await env.DB.prepare(`
      SELECT * FROM volunteer_preferences WHERE member_id IN (${memberPlaceholders})
    `).bind(...memberIds).all()).results

    const prefMap = {}
    for (const p of preferences) {
      prefMap[p.member_id] = p
    }

    // Step 4: Get members already scheduled for this plan
    const alreadyScheduled = (await env.DB.prepare(
      "SELECT member_id FROM scheduled_people WHERE plan_id = ?",
    ).bind(planId).all()).results
    const scheduledMemberIds = new Set(alreadyScheduled.map(s => s.member_id))

    // Step 5: Get monthly service counts for each member
    let monthlyCounts = {}
    if (planMonth) {
      const monthly = (await env.DB.prepare(`
        SELECT sp.member_id, COUNT(*) as count
        FROM scheduled_people sp
        JOIN plans p ON p.id = sp.plan_id
        WHERE sp.member_id IN (${memberPlaceholders})
          AND p.date LIKE ?
          AND sp.status IN ('confirmed', 'pending')
        GROUP BY sp.member_id
      `).bind(...memberIds, `${planMonth}%`).all()).results
      for (const m of monthly) {
        monthlyCounts[m.member_id] = m.count
      }
    }

    // Step 6: Get last scheduled date for each member
    const lastScheduled = (await env.DB.prepare(`
      SELECT sp.member_id, MAX(p.date) as last_date
      FROM scheduled_people sp
      JOIN plans p ON p.id = sp.plan_id
      WHERE sp.member_id IN (${memberPlaceholders})
        AND sp.status IN ('confirmed', 'pending')
      GROUP BY sp.member_id
    `).bind(...memberIds).all()).results
    const lastDateMap = {}
    for (const ls of lastScheduled) {
      lastDateMap[ls.member_id] = ls.last_date
    }

    // Step 7: For each team, determine positions to fill
    const assignments = []
    const unavailabilityWarnings = []

    for (const team of teams) {
      const membersInTeam = teamMembers.filter(tm => tm.team_id === team.id)

      if (positions && positions.length > 0) {
        // Only schedule for requested positions
        for (const pos of positions) {
          const eligible = findEligibleMembers(
            membersInTeam, pos, planDate, planMonth,
            scheduledMemberIds, prefMap, monthlyCounts, lastDateMap, maxPerPosition,
          )
          for (const member of eligible) {
            assignments.push({ plan_id: planId, member_id: member.member_id, team_id: team.id, position: pos, status: 'pending' })
            scheduledMemberIds.add(member.member_id)
          }
          if (eligible.length === 0) {
            unavailabilityWarnings.push({ team: team.name, position: pos, message: "No eligible members found" })
          }
        }
      } else {
        const availablePositions = [...new Set(membersInTeam.map(m => m.position).filter(Boolean))]
        for (const pos of availablePositions) {
          const eligible = findEligibleMembers(
            membersInTeam, pos, planDate, planMonth,
            scheduledMemberIds, prefMap, monthlyCounts, lastDateMap, maxPerPosition,
          )
          for (const member of eligible) {
            assignments.push({ plan_id: planId, member_id: member.member_id, team_id: team.id, position: pos, status: 'pending' })
            scheduledMemberIds.add(member.member_id)
          }
        }
      }
    }

    if (assignments.length === 0) {
      return json({
        message: "No eligible volunteers found for auto-scheduling",
        assignments: [],
        warnings: unavailabilityWarnings,
      })
    }

    // Step 8: Insert assignments
    const insertStmt = env.DB.prepare(
      "INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES (?, ?, ?, ?, 'pending')",
    )
    const results = []
    for (const a of assignments) {
      const r = await insertStmt.bind(a.plan_id, a.member_id, a.team_id, a.position).run()
      if (r.meta.last_row_id) {
        results.push(a)
      }
    }

    return json({
      message: `Auto-scheduled ${results.length} volunteer(s) for plan ${planId}`,
      total_requested: assignments.length,
      assignments: results,
      warnings: unavailabilityWarnings,
    })
  }),
]

function findEligibleMembers(membersInTeam, position, planDate, planMonth, scheduledMemberIds, prefMap, monthlyCounts, lastDateMap, maxPerPosition) {
  const eligible = membersInTeam
    .filter(m => m.position === position)
    .filter(m => !scheduledMemberIds.has(m.member_id))
    .filter(m => {
      const prefs = prefMap[m.member_id]
      if (!prefs) return true
      if (prefs.unavailable_dates) {
        try {
          const dates = typeof prefs.unavailable_dates === 'string'
            ? JSON.parse(prefs.unavailable_dates)
            : prefs.unavailable_dates
          if (Array.isArray(dates) && dates.includes(planDate)) return false
        } catch {}
      }
      return true
    })
    .filter(m => {
      const prefs = prefMap[m.member_id]
      const maxServices = prefs?.max_services_per_month ?? 4
      const count = monthlyCounts[m.member_id] || 0
      return count < maxServices
    })

  // Sort by least-recently-scheduled (oldest last_date first, or never scheduled)
  eligible.sort((a, b) => {
    const aDate = lastDateMap[a.member_id] || '1970-01-01'
    const bDate = lastDateMap[b.member_id] || '1970-01-01'
    return aDate.localeCompare(bDate)
  })

  // Return up to maxPerPosition members
  return eligible.slice(0, maxPerPosition)
}
