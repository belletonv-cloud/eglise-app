import { CORS, json, badRequest, getBody, requireId, dbFirst } from '../lib.js';
import { hasPermission, getMemberFromRequest, requirePermission } from '../auth.js';
import { route } from '../routes.js';
import { validate, validationError } from '../validate.js'

export const emailRoutes = [
  // ========================================
  // BULK EMAIL
  // ========================================
  route("POST", "/api/send-bulk-email", async (request, env) => {
    const body = await getBody(request);
    const beErr = validate({ subject: { required: true, type: 'string', maxLength: 200 }, body: { required: true, type: 'string', maxLength: 50000 } }, body)
    if (beErr) return validationError(beErr)
    if (!body.team_id && !body.plan_id && !body.member_ids)
      return badRequest("team_id, plan_id, or member_ids required");

    const apiKey = env.RESEND_API_KEY;
    const from = env.EMAIL_FROM || "no-reply@example.com";
    if (!apiKey) return badRequest("RESEND_API_KEY not configured");

    let recipients = [];

    if (body.team_id) {
      const rows = await env.DB.prepare(
        `
          SELECT DISTINCT m.email, m.id as member_id FROM members m
          JOIN team_members tm ON tm.member_id = m.id
          WHERE tm.team_id = ? AND m.email IS NOT NULL AND m.email != ''
        `,
      )
        .bind(body.team_id)
        .all();
      recipients = rows.results;
    } else if (body.plan_id) {
      const rows = await env.DB.prepare(
        `
          SELECT DISTINCT m.email, m.id as member_id FROM members m
          JOIN scheduled_people sp ON sp.member_id = m.id
          WHERE sp.plan_id = ? AND m.email IS NOT NULL AND m.email != ''
        `,
      )
        .bind(body.plan_id)
        .all();
      recipients = rows.results;
    } else if (body.member_ids) {
      const placeholders = body.member_ids.map(() => "?").join(",");
      const rows = await env.DB.prepare(
        `
          SELECT email, id as member_id FROM members WHERE id IN (${placeholders}) AND email IS NOT NULL AND email != ''
        `,
      )
        .bind(...body.member_ids)
        .all();
      recipients = rows.results;
    }

    if (recipients.length === 0)
      return json({ error: "No recipients found" }, 400);

    const results = { sent: 0, failed: 0, errors: [] };

    for (const r of recipients) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from,
            to: r.email,
            subject: body.subject,
            html: body.body,
          }),
        });
        if (res.ok) {
          results.sent++;
          await env.DB.prepare(
            "INSERT INTO email_logs (subject, body, recipient_email, recipient_member_id, status) VALUES (?, ?, ?, ?, ?)",
          )
            .bind(body.subject, body.body, r.email, r.member_id || null, "sent")
            .run();
        } else {
          results.failed++;
          const err = await res.text();
          results.errors.push(`${r.email}: ${err}`);
        }
      } catch (e) {
        results.failed++;
        results.errors.push(`${r.email}: ${e.message}`);
      }
    }

    return json(results);
  }),
];
