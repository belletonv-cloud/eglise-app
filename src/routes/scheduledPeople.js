import {
  CORS,
  json,
  badRequest,
  notFound,
  getBody,
  requireId,
  generateSecureToken,
} from "../lib.js";
import { validate, validationError } from '../validate.js'
import {
  hasPermission,
} from "../auth.js";
import { route } from "../routes.js";
import { sendFcmV1FireAndForget } from "../fcm.js";

export const scheduledPeopleRoutes = [
  // ========================================
  // SCHEDULED PEOPLE (Bénévoles planifiés)
  // ========================================
  route(
    "GET",
    "/api/plans/:id/scheduled-people",
    async (request, env, params) => {
      const planId = requireId(params);
      if (!planId) return badRequest("ID plan invalide");
      const plan = await env.DB.prepare("SELECT id FROM plans WHERE id = ?")
        .bind(planId)
        .first();
      if (!plan) return notFound("Plan non trouvé");
      const people = await env.DB.prepare(
        `
      SELECT sp.*, m.first_name, m.last_name, m.email, m.phone,
        t.name as team_name
      FROM scheduled_people sp
      JOIN members m ON m.id = sp.member_id
      LEFT JOIN teams t ON t.id = sp.team_id
      WHERE sp.plan_id = ?
      ORDER BY sp.position ASC, m.last_name ASC
    `,
      )
        .bind(planId)
        .all();
      return json(people.results);
    },
  ),

  route(
    "POST",
    "/api/plans/:id/scheduled-people",
    async (request, env, params) => {
      const planId = requireId(params);
      if (!planId) return badRequest("ID plan invalide");
      const plan = await env.DB.prepare(
        "SELECT id, date FROM plans WHERE id = ?",
      )
        .bind(planId)
        .first();
      if (!plan) return notFound("Plan non trouvé");
      const body = await getBody(request);
      if (!body) return badRequest("Corps JSON invalide");
      const err = validate(
        {
          member_id: { required: true, type: 'integer' },
          team_id: { required: true, type: 'integer' },
          service_type_id: { required: true, type: 'integer' },
        },
        body,
      );
      // authorization: need scheduling permission
      if (!(await hasPermission(request, env, "schedule")))
        return json({ error: "Forbidden" }, 403);
      // if forcing, require force_schedule permission
      if (body.force && !(await hasPermission(request, env, "force_schedule")))
        return json({ error: "Forbidden to force" }, 403);
      if (err) return validationError(err);

      // Check if the member has marked this plan's date as unavailable
      if (!body.force) {
        const prefs = await env.DB.prepare(
          "SELECT unavailable_dates FROM volunteer_preferences WHERE member_id = ?",
        )
          .bind(body.member_id)
          .first();
        if (prefs?.unavailable_dates) {
          const unavailable = JSON.parse(prefs.unavailable_dates || "[]");
          if (unavailable.includes(plan.date)) {
            return json(
              {
                error: "Member is unavailable on this date",
                date: plan.date,
                unavailable: true,
              },
              409,
            );
          }
        }
      }
      // Prevent scheduling the same member twice for the same plan (even on another team)
      const conflict = await env.DB.prepare(
        "SELECT id, team_id, position FROM scheduled_people WHERE plan_id = ? AND member_id = ?",
      )
        .bind(planId, body.member_id)
        .first();
      if (conflict && !body.force) {
        return json(
          { error: "Member already scheduled for this plan", conflict },
          409,
        );
      }

      // If forcing, log the conflict for audit
      if (conflict && body.force) {
        await env.DB.prepare(
          `
        INSERT INTO scheduled_conflict_logs (plan_id, member_id, existing_scheduled_id, forced_by, note)
        VALUES (?, ?, ?, ?, ?)
      `,
        )
          .bind(
            planId,
            body.member_id,
            conflict.id,
            body.forced_by || "system",
            body.note || null,
          )
          .run();
      }

      const result = await env.DB.prepare(
        "INSERT INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES (?, ?, ?, ?, ?)",
      )
        .bind(
          planId,
          body.member_id,
          body.team_id || null,
          body.position || null,
          body.status || "pending",
        )
        .run();
      const newEntry = await env.DB.prepare(
        `
      SELECT sp.*, m.first_name, m.last_name
      FROM scheduled_people sp
      JOIN members m ON m.id = sp.member_id
      WHERE sp.id = ?
    `,
      )
        .bind(result.meta.last_row_id)
        .first();

      // If we logged a conflict above we may want to notify admin by email
      try {
        if (conflict && body.force) {
          const admin = env.ADMIN_EMAIL || env.EMAIL_FROM || null;
          if (admin && env.RESEND_API_KEY) {
            const plan = await env.DB.prepare(
              "SELECT date, time FROM plans WHERE id = ?",
            )
              .bind(planId)
              .first();
            const member = await env.DB.prepare(
              "SELECT first_name, last_name, email FROM members WHERE id = ?",
            )
              .bind(body.member_id)
              .first();
            const existingTeam = await env.DB.prepare(
              "SELECT t.name FROM teams t WHERE t.id = ?",
            )
              .bind(conflict.team_id)
              .first();
            const subject = `Conflit planifié forcé pour ${member.first_name} ${member.last_name}`;
            const frontend = env.FRONTEND_URL || "https://eglise-app.pages.dev";
            const planLink = `${frontend}/plans/${planId}`;
            const conflictsLink = `${frontend}/conflicts`;

            // Prefer to create a one-time DB token if possible; otherwise fallback to HMAC
            let oneclickLinkHtml = "";
            try {
              // email_oneclicks table created by migrations

              const payload = {
                action: "revert_assignment",
                existing_scheduled_id: conflict.id,
                plan_id: planId,
                member_id: body.member_id,
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
              };
              const payloadJson = JSON.stringify(payload);
              const dbToken = generateSecureToken(32);
              await env.DB.prepare(
                "INSERT INTO email_oneclicks (token, payload_json, used) VALUES (?, ?, 0)",
              )
                .bind(dbToken, payloadJson)
                .run();
              const oneclickFrontend = `${frontend}/admin/oneclick?token=${encodeURIComponent(dbToken)}`;
              oneclickLinkHtml = `<p><a href="${oneclickFrontend}">Annuler l'assignation existante (un clic)</a></p>`;
            } catch (e) {
              // fallback to HMAC token
              if (env.ONECLICK_SECRET) {
                try {
                  const payload = {
                    action: "revert_assignment",
                    existing_scheduled_id: conflict.id,
                    plan_id: planId,
                    member_id: body.member_id,
                    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
                  };
                  const token = await signOneClickToken(
                    JSON.stringify(payload),
                    env.ONECLICK_SECRET,
                  );
                  const oneclickFrontend = `${frontend}/admin/oneclick?token=${encodeURIComponent(token)}`;
                  oneclickLinkHtml = `<p><a href="${oneclickFrontend}">Annuler l'assignation existante (un clic)</a></p>`;
                } catch (err) {
                  console.error('HMAC oneclick fallback failed:', err);
                }
              }
            }

            const html = `<p>Un ajout forcé a été effectué.</p>
            <ul>
              <li>Service: <a href="${planLink}">${plan.date} ${plan.time || ""}</a></li>
              <li>Membre: ${member.first_name} ${member.last_name} (${member.email || "no email"})</li>
              <li>Assignation existante: ${existingTeam ? existingTeam.name : "#" + conflict.team_id} — ${conflict.position || "-"} (scheduled id ${conflict.id})</li>
              <li>Forcé par: ${body.forced_by || "system"}</li>
              <li>Note: ${body.note || ""}</li>
            </ul>
            <p><a href="${conflictsLink}">Voir les logs</a></p>
            ${oneclickLinkHtml}`;

            // send via Resend
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: env.EMAIL_FROM || admin,
                to: admin,
                subject,
                html,
              }),
            });
            const text = await res.text();
            let remote = null;
            try {
              remote = JSON.parse(text);
            } catch (e) {
              console.error("parse remote resend response failed", e);
              remote = text;
            }
            const status = res.ok ? "sent" : "failed";
            await env.DB.prepare(
              "INSERT INTO email_logs (template_id, subject, body, recipient_email, recipient_member_id, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)",
            )
              .bind(
                null,
                subject,
                html,
                admin,
                null,
                status,
                res.ok ? null : JSON.stringify(remote),
              )
              .run();
          }
        }
      } catch (e) {
        console.error(
          "notification error while forcing assignment emails/push",
          e,
        );
      }
      // Send push notification to the scheduled member
      try {
        const planForNotif = await env.DB.prepare(
          "SELECT date, time, theme FROM plans WHERE id = ?",
        )
          .bind(planId)
          .first();
        const memberTokens = await env.DB.prepare(
          "SELECT token FROM notification_tokens WHERE member_id = ?",
        )
          .bind(body.member_id)
          .all();
        if (memberTokens.results.length > 0 && env.FCM_SERVICE_ACCOUNT) {
          let fcmSa;
          try { fcmSa = JSON.parse(env.FCM_SERVICE_ACCOUNT); } catch { fcmSa = null; console.warn('scheduledPeople: invalid FCM_SERVICE_ACCOUNT JSON'); }
          if (fcmSa) {
            const title = "Nouvelle assignation";
            const msg = `Tu es planifié(e) pour le ${planForNotif.date}${planForNotif.time ? " à " + planForNotif.time.slice(0, 5) : ""}`;
            for (const t of memberTokens.results) {
              sendFcmV1FireAndForget(
                fcmSa, t.token, title, msg,
                { plan_id: String(planId), action: "view_plan" },
              );
            }
          }
        }
      } catch (e) {
        console.error("push notification error", e);
      }

      triggerWebhooks(env, "schedule.created", newEntry).catch((err) => {
        console.error("triggerWebhooks schedule.created failed", err, {
          event: "schedule.created",
          payload: newEntry,
        });
      });
      return json(newEntry, 201);
    },
  ),

  route(
    "PUT",
    "/api/plans/:pid/scheduled-people/:sid",
    async (request, env, params) => {
      const planId = requireId({ id: params.pid });
      const scheduledId = requireId({ id: params.sid });
      if (!planId || !scheduledId) return badRequest("ID invalide");
      const existing = await env.DB.prepare(
        "SELECT * FROM scheduled_people WHERE id = ? AND plan_id = ?",
      )
        .bind(scheduledId, planId)
        .first();
      if (!existing) return notFound();
      const body = await getBody(request);
      if (!body) return badRequest("Corps JSON invalide");
      const spStatusErr = validate({ status: { type: 'string', enum: ['confirmed', 'pending', 'declined'] } }, body)
      if (spStatusErr) return validationError(spStatusErr)
      await env.DB.prepare(
        "UPDATE scheduled_people SET position=?, status=? WHERE id=? AND plan_id=?",
      )
        .bind(
          body.position !== undefined ? body.position : existing.position,
          body.status || existing.status,
          scheduledId,
          planId,
        )
        .run();
      const updated = await env.DB.prepare(
        `
      SELECT sp.*, m.first_name, m.last_name, m.email, m.phone, t.name as team_name
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

  route(
    "DELETE",
    "/api/plans/:pid/scheduled-people/:sid",
    async (request, env, params) => {
      const planId = requireId({ id: params.pid });
      const scheduledId = requireId({ id: params.sid });
      if (!planId || !scheduledId) return badRequest("ID invalide");
      await env.DB.prepare(
        "DELETE FROM scheduled_people WHERE id = ? AND plan_id = ?",
      )
        .bind(scheduledId, planId)
        .run();
      return new Response(null, { status: 204, headers: CORS });
    },
  ),

];
