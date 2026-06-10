import { json, badRequest, unauthorized, getBody } from '../lib.js'
import { getMemberFromRequest, requirePermission } from '../auth.js'
import { route } from '../routes.js'

// ========================================
// FCM NOTIFICATIONS (Push)
// ========================================
export const fcmRoutes = [

  // Register a push notification token
  route("POST", "/api/fcm/register", async (request, env) => {
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");
    if (!body.member_id || !body.token)
      return badRequest("member_id and token are required");
    // Only allow members to register their own push token
    const member = await getMemberFromRequest(request, env);
    if (!member) return unauthorized();
    if (member.id !== body.member_id && member.role !== "admin")
      return unauthorized();

    await env.DB.prepare(
      `
      INSERT OR REPLACE INTO notification_tokens (member_id, token, device_type, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `,
    )
      .bind(body.member_id, body.token, body.device_type || "web")
      .run();

    return json({ success: true });
  }),

  // Send push notification to a member (or to a plan's scheduled people)
  route("POST", "/api/fcm/send", async (request, env) => {
    const guard = await requirePermission(request, env, "manage_members");
    if (guard) return guard;
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");

    const serverKey = env.FCM_SERVER_KEY;
    if (!serverKey) return badRequest("FCM not configured (FCM_SERVER_KEY)");

    let tokens = [];
    if (body.member_id) {
      const result = await env.DB.prepare(
        "SELECT token FROM notification_tokens WHERE member_id = ?",
      )
        .bind(body.member_id)
        .all();
      tokens = result.results.map((r) => r.token);
    } else if (body.plan_id) {
      const result = await env.DB.prepare(
        `
        SELECT DISTINCT nt.token FROM notification_tokens nt
        JOIN scheduled_people sp ON sp.member_id = nt.member_id
        WHERE sp.plan_id = ?
      `,
      )
        .bind(body.plan_id)
        .all();
      tokens = result.results.map((r) => r.token);
    } else if (body.tokens) {
      tokens = body.tokens;
    }

    if (!tokens.length)
      return json({ success: true, sent: 0, error: "No tokens" });

    const title = body.title || "Église App";
    const message = body.message || "";

    let sent = 0;
    let failed = 0;
    const errors = [];

    for (const token of tokens) {
      try {
        const payload = {
          to: token,
          notification: { title, body: message },
          data: body.data || {},
        };

        const res = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `key=${serverKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) sent++;
        else {
          failed++;
          errors.push({
            token: token.slice(0, 20) + "...",
            status: res.status,
          });
        }
      } catch (e) {
        failed++;
        errors.push({ token: token.slice(0, 20) + "...", error: e.message });
      }
    }

    return json({
      success: true,
      sent,
      failed,
      errors: errors.length ? errors : undefined,
    });
  }),
];
