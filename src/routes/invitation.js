import { route } from "../routes.js";
import { getBody, badRequest, json, generateSecureToken, requireId, notFound, CORS } from "../lib.js";
import { hasPermission, getMemberFromRequest } from "../auth.js";
import { signOneClickToken } from "../oneclick.js";

// ========================================
// INVITATION SYSTEM
// ========================================
export const invitationRoutes = [
  route("POST", "/api/invitations", async (request, env) => {
    const body = await getBody(request);
    if (!body || !body.email) return badRequest("email required");
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);

    const member = await env.DB.prepare("SELECT * FROM members WHERE email = ?")
      .bind(body.email)
      .first();
    if (!member) return badRequest("Aucun membre avec cet email");

    const token = generateSecureToken(48);
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString(); // 7 days

    // invitation_tokens table created by migrations
    await env.DB.prepare(
      "INSERT INTO invitation_tokens (member_id, token, expires_at) VALUES (?, ?, ?)",
    )
      .bind(member.id, token, expiresAt)
      .run();

    // Send email
    try {
      const frontend = env.FRONTEND_URL || "https://eglise-app.pages.dev";
      const link = `${frontend}/invitation?token=${token}`;
      const html = `<p>Bonjour ${member.first_name},</p>
        <p>Tu as été invité(e) à rejoindre l'application Église.</p>
        <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">Activer mon compte</a></p>
        <p>Ce lien expire dans 7 jours.</p>`;
      const apiKey = env.RESEND_API_KEY;
      const from = env.EMAIL_FROM || "no-reply@example.com";
      if (apiKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from,
            to: body.email,
            subject: "Invitation à rejoindre Église App",
            html,
          }),
        });
      }
    } catch (e) {
      console.error("invitation send failed", e);
    }

    return json({ success: true, email: body.email }, 201);
  }),

  route("GET", "/api/invitations/:token", async (request, env, params) => {
    const token = params.token;
    const row = await env.DB.prepare(
      "SELECT it.*, m.first_name, m.last_name, m.email FROM invitation_tokens it JOIN members m ON m.id = it.member_id WHERE it.token = ?",
    )
      .bind(token)
      .first();
    if (!row) return badRequest("Token invalide");
    if (row.used) return badRequest("Token déjà utilisé");
    if (row.expires_at < new Date().toISOString())
      return badRequest("Token expiré");
    return json({
      member_id: row.member_id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
    });
  }),

  route(
    "POST",
    "/api/invitations/:token/redeem",
    async (request, env, params) => {
      const token = params.token;
      const body = await getBody(request);
      if (!body || !body.firebase_uid)
        return badRequest("firebase_uid required");

      const row = await env.DB.prepare(
        "SELECT * FROM invitation_tokens WHERE token = ?",
      )
        .bind(token)
        .first();
      if (!row) return badRequest("Token invalide");
      if (row.used) return badRequest("Token déjà utilisé");
      if (row.expires_at < new Date().toISOString())
        return badRequest("Token expiré");

      // Check no other member has this firebase_uid
      // member_firebase table created by migrations
      const existing = await env.DB.prepare(
        "SELECT member_id FROM member_firebase WHERE firebase_uid = ?",
      )
        .bind(body.firebase_uid)
        .first();
      if (existing)
        return badRequest("Ce compte Firebase est déjà lié à un membre");

      await env.DB.prepare(
        "INSERT INTO member_firebase (member_id, firebase_uid) VALUES (?, ?)",
      )
        .bind(row.member_id, body.firebase_uid)
        .run();
      await env.DB.prepare("UPDATE invitation_tokens SET used = 1 WHERE id = ?")
        .bind(row.id)
        .run();

      return json({ success: true, member_id: row.member_id });
    },
  ),

  // Verify firebase link for member portal
  route("GET", "/api/me/firebase-status", async (request, env) => {
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: "Not authenticated" }, 401);
    const fb = await env.DB.prepare(
      "SELECT firebase_uid FROM member_firebase WHERE member_id = ?",
    )
      .bind(member.id)
      .first();
    return json({ linked: !!fb, firebase_uid: fb?.firebase_uid || null });
  }),

  // QR check-in token for a plan
  route("GET", "/api/plans/:id/qr-checkin", async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest("ID plan invalide");
    const plan = await env.DB.prepare("SELECT id, date FROM plans WHERE id = ?")
      .bind(planId)
      .first();
    if (!plan) return notFound();
    // Generate a short-lived token for check-in
    // Require ONECLICK_SECRET to be configured — do not fall back to an insecure default.
    if (!env.ONECLICK_SECRET) {
      return json({ error: "ONECLICK_SECRET not configured" }, 500);
    }
    const token = generateSecureToken(16);
    const payload = JSON.stringify({
      action: "qr_checkin",
      plan_id: planId,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const signed = await signOneClickToken(payload, env.ONECLICK_SECRET);
    return json({
      checkin_url: `${env.FRONTEND_URL || "https://eglise-app.pages.dev"}/checkin?plan=${planId}&token=${encodeURIComponent(signed)}`,
      plan_id: planId,
      date: plan.date,
    });
  }),
];
