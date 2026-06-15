import { json, badRequest, unauthorized, getBody } from '../lib.js'
import { getMemberFromRequest, requirePermission } from '../auth.js'
import { route } from '../routes.js'
import { sendFcmV1 } from '../fcm.js'

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

    const serviceAccount = env.FCM_SERVICE_ACCOUNT;
    if (!serviceAccount) return badRequest("FCM not configured (FCM_SERVICE_ACCOUNT)");
    let sa;
    try { sa = JSON.parse(serviceAccount); }
    catch { return badRequest("FCM_SERVICE_ACCOUNT is not valid JSON"); }

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
        `SELECT DISTINCT nt.token FROM notification_tokens nt
         JOIN scheduled_people sp ON sp.member_id = nt.member_id
         WHERE sp.plan_id = ?`,
      )
        .bind(body.plan_id)
        .all();
      tokens = result.results.map((r) => r.token);
    } else if (body.tokens) {
      tokens = body.tokens;
    }

    if (!tokens.length)
      return json({ success: true, sent: 0, error: "No tokens" });

    const { sent, failed, errors } = await sendFcmV1(
      sa, tokens, body.title || "Église App", body.message || "", body.data,
    );

    return json({ success: true, sent, failed, errors: errors.length ? errors : undefined });
  }),
];
