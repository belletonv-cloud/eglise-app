import { CORS, json, badRequest, notFound, getBody, requireId, dbFirst, dbAll } from '../lib.js';
import { hasPermission, getMemberFromRequest, requirePermission } from '../auth.js';
import { route } from '../routes.js';
import { triggerWebhooks } from '../webhooks.js';
import { validate, validationError } from '../validate.js'

export const portalRoutes = [
  // ========================================
  // MEMBER PORTAL (self-service)
  // ========================================
  route("GET", "/api/me", async (request, env) => {
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: "Not authenticated" }, 401);
    const teams = await env.DB.prepare(
      `
        SELECT t.*, tm.position FROM team_members tm
        JOIN teams t ON t.id = tm.team_id
        WHERE tm.member_id = ?
      `,
    )
      .bind(member.id)
      .all();
    return json({ ...member, teams: teams.results });
  }),

  route("PUT", "/api/me", async (request, env) => {
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: "Not authenticated" }, 401);
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON");
    const meErr = validate({ phone: { type: 'string', maxLength: 30 }, notes: { type: 'string', maxLength: 1000 } }, body)
    if (meErr) return validationError(meErr)
    // Only allow updating safe fields
    const allowed = ["phone", "notes", "birth_date"];
    const updates = [];
    const values = [];
    for (const field of allowed) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }
    if (updates.length === 0) return json(member);
    values.push(member.id);
    await env.DB.prepare(
      `UPDATE members SET ${updates.join(", ")} WHERE id = ?`,
    )
      .bind(...values)
      .run();
    const updated = await env.DB.prepare("SELECT * FROM members WHERE id = ?")
      .bind(member.id)
      .first();
    return json(updated);
  }),

  route("GET", "/api/me/schedule", async (request, env) => {
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: "Not authenticated" }, 401);
    const rows = await env.DB.prepare(
      `
        SELECT sp.*, p.date, p.time, p.theme, p.status as plan_status,
               st.name as service_type_name
        FROM scheduled_people sp
        JOIN plans p ON p.id = sp.plan_id
        LEFT JOIN service_types st ON st.id = p.service_type_id
        WHERE sp.member_id = ? AND p.date >= date('now')
        ORDER BY p.date ASC, p.time ASC
      `,
    )
      .bind(member.id)
      .all();
    return json(rows.results);
  }),

  // ========================================
  // VOLUNTEER PREFERENCES
  // ========================================
  route(
    "GET",
    "/api/volunteer-preferences/:memberId",
    async (request, env, params) => {
      // Auth required — preferences include unavailable dates and personal notes
      const caller = await getMemberFromRequest(request, env);
      if (!caller) return json({ error: "Not authenticated" }, 401);
      const memberId = parseInt(params.memberId, 10);
      if (!memberId) return badRequest("Invalid member ID");
      // Members can only read their own preferences unless admin/scheduler
      const canViewOthers =
        caller.role === "admin" ||
        (await hasPermission(request, env, "schedule"));
      if (!canViewOthers && caller.id !== memberId) {
        return json({ error: "Forbidden" }, 403);
      }
      const prefs = await env.DB.prepare(
        "SELECT * FROM volunteer_preferences WHERE member_id = ?",
      )
        .bind(memberId)
        .first();
      return json(
        prefs || {
          member_id: memberId,
          unavailable_dates: "[]",
          max_services_per_month: 4,
          notes: "",
        },
      );
    },
  ),

  route(
    "PUT",
    "/api/volunteer-preferences/:memberId",
    async (request, env, params) => {
      const memberId = parseInt(params.memberId, 10);
      if (!memberId) return badRequest("Invalid member ID");
      const member = await getMemberFromRequest(request, env);
      // Allow self-service (member editing own preferences) or users with edit_members permission
      if (!member) return unauthorized();
      if (member.id !== memberId) {
        const guard = await requirePermission(request, env, "edit_members");
        if (guard) return guard;
      }
      const body = await getBody(request);
      if (!body) return badRequest("Invalid JSON");
      const vpErr = validate({ unavailable_dates: { type: 'array' }, max_services_per_month: { type: 'integer', min: 0, max: 31 }, notes: { type: 'string', maxLength: 500 } }, body)
      if (vpErr) return validationError(vpErr)
      const existing = await env.DB.prepare(
        "SELECT id FROM volunteer_preferences WHERE member_id = ?",
      )
        .bind(memberId)
        .first();
      const dates = JSON.stringify(body.unavailable_dates || []);
      const max = body.max_services_per_month ?? 4;
      const notes = body.notes || "";
      if (existing) {
        await env.DB.prepare(
          "UPDATE volunteer_preferences SET unavailable_dates = ?, max_services_per_month = ?, notes = ? WHERE member_id = ?",
        )
          .bind(dates, max, notes, memberId)
          .run();
      } else {
        await env.DB.prepare(
          "INSERT INTO volunteer_preferences (member_id, unavailable_dates, max_services_per_month, notes) VALUES (?, ?, ?, ?)",
        )
          .bind(memberId, dates, max, notes)
          .run();
      }
      const updated = await env.DB.prepare(
        "SELECT * FROM volunteer_preferences WHERE member_id = ?",
      )
        .bind(memberId)
        .first();
      return json(updated);
    },
  ),
];
