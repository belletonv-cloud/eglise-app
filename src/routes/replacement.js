import { route } from "../routes.js";
import { requireId, badRequest, notFound, getBody, json } from "../lib.js";
import { validate, validationError } from '../validate.js'

// ========================================
// REPLACEMENT SUGGESTION (quand un bénévole refuse)
// ========================================
export const replacementRoutes = [
  route(
    "GET",
    "/api/plans/:id/replacements/:scheduledId",
    async (request, env, params) => {
      const planId = requireId({ id: params.id });
      const scheduledId = requireId({ id: params.scheduledId });
      if (!planId || !scheduledId) return badRequest("ID invalide");
      const sp = await env.DB.prepare(
        "SELECT * FROM scheduled_people WHERE id = ? AND plan_id = ?",
      )
        .bind(scheduledId, planId)
        .first();
      if (!sp) return notFound();

      // Find same team members not already scheduled for this plan, with email
      const candidates = await env.DB.prepare(
        `
      SELECT DISTINCT m.id, m.first_name, m.last_name, m.email, m.phone,
        tm.position as member_position
      FROM members m
      JOIN team_members tm ON tm.member_id = m.id
      WHERE tm.team_id = ?
        AND m.id != ?
        AND m.id NOT IN (SELECT member_id FROM scheduled_people WHERE plan_id = ?)
        AND m.email IS NOT NULL AND m.email != ''
      ORDER BY m.last_name ASC
    `,
      )
        .bind(sp.team_id, sp.member_id, planId)
        .all();
      return json(candidates.results);
    },
  ),

  route(
    "POST",
    "/api/plans/:id/replacements/:scheduledId",
    async (request, env, params) => {
      const planId = requireId({ id: params.id });
      const scheduledId = requireId({ id: params.scheduledId });
      if (!planId || !scheduledId) return badRequest("ID invalide");
      const body = await getBody(request);
      const repErr = validate({ new_member_id: { required: true, type: 'integer' }, plan_id: { required: true, type: 'integer' }, reason: { type: 'string', maxLength: 500 } }, body)
      if (repErr) return validationError(repErr)

      const sp = await env.DB.prepare(
        "SELECT * FROM scheduled_people WHERE id = ? AND plan_id = ?",
      )
        .bind(scheduledId, planId)
        .first();
      if (!sp) return notFound();

      // Update the scheduled person to the new member
      await env.DB.prepare(
        "UPDATE scheduled_people SET member_id = ?, status = ? WHERE id = ?",
      )
        .bind(body.new_member_id, "pending", scheduledId)
        .run();

      // Notify the new member via email
      try {
        const plan = await env.DB.prepare(
          "SELECT date, time, theme FROM plans WHERE id = ?",
        )
          .bind(planId)
          .first();
        const newMember = await env.DB.prepare(
          "SELECT first_name, last_name, email FROM members WHERE id = ?",
        )
          .bind(body.new_member_id)
          .first();
        const apiKey = env.RESEND_API_KEY;
        const from = env.EMAIL_FROM || "no-reply@example.com";
        if (apiKey && newMember && newMember.email) {
          const frontend = env.FRONTEND_URL || "https://eglise-app.pages.dev";
          const html = `<p>Bonjour ${newMember.first_name},</p>
          <p>Tu as été ajouté(e) comme remplaçant(e) pour le service du <strong>${plan.date} ${plan.time || ""}</strong>.</p>
          <p>Merci de confirmer ta disponibilité: <a href="${frontend}/mon-compte">Mon compte</a></p>`;
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              from,
              to: newMember.email,
              subject: `Remplacement — Service ${plan.date}`,
              html,
            }),
          });
        }
      } catch (e) {
        console.error("replacement notification send failed", e);
      }

      const updated = await env.DB.prepare(
        `
      SELECT sp.*, m.first_name, m.last_name, m.email, t.name as team_name
      FROM scheduled_people sp
      JOIN members m ON m.id = sp.member_id
      LEFT JOIN teams t ON t.id = sp.team_id
      WHERE sp.id = ?
    `,
      )
        .bind(scheduledId)
        .first();
      return json(updated);
    },
  ),
  // Attendance stats
  route("GET", "/api/attendance-stats", async (request, env, params, url) => {
    const year =
      url.searchParams.get("year") || String(new Date().getFullYear());
    const memberId = url.searchParams.get("member_id");

    let where = "strftime('%Y', a.check_in_time) = ?";
    const binds = [year];
    if (memberId) {
      where += " AND a.member_id = ?";
      binds.push(Number(memberId));
    }

    // Total attendances
    const total = await env.DB.prepare(
      `SELECT COUNT(*) as c FROM attendances a WHERE ${where}`,
    )
      .bind(...binds)
      .first();

    // Per member stats
    const perMember = await env.DB.prepare(
      `
      SELECT a.member_id, m.first_name, m.last_name, COUNT(*) as count
      FROM attendances a JOIN members m ON m.id = a.member_id
      WHERE ${where} GROUP BY a.member_id ORDER BY count DESC
    `,
    )
      .bind(...binds)
      .all();

    // Per month breakdown
    const perMonth = await env.DB.prepare(
      `
      SELECT strftime('%m', a.check_in_time) as month, COUNT(*) as count
      FROM attendances a WHERE ${where}
      GROUP BY month ORDER BY month ASC
    `,
    )
      .bind(...binds)
      .all();

    // Top recent
    const recent = await env.DB.prepare(
      `
      SELECT a.*, m.first_name, m.last_name, p.date as plan_date
      FROM attendances a JOIN members m ON m.id = a.member_id JOIN plans p ON p.id = a.plan_id
      WHERE ${where} ORDER BY a.check_in_time DESC LIMIT 20
    `,
    )
      .bind(...binds)
      .all();

    return json({
      total: total.c,
      perMember: perMember.results,
      perMonth: perMonth.results,
      recent: recent.results,
    });
  }),
];
