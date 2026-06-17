import { CORS, json, badRequest, getBody, requireId, dbFirst, dbAll } from '../lib.js';
import { validate, validationError } from '../validate.js';
import { hasPermission, getMemberFromRequest } from '../auth.js';
import { route } from '../routes.js';

export const statsRoutes = [
  // ========================================
  // STATS (for dashboard)
  // ========================================
  route("GET", "/api/stats", async (request, env) => {
    const [
      members,
      activeMembers,
      upcomingPlans,
      songs,
      pendingSchedule,
      teams,
    ] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) as c FROM members").first(),
      env.DB.prepare(
        "SELECT COUNT(*) as c FROM members WHERE membership_type = 'member'",
      ).first(),
      env.DB.prepare(
        "SELECT COUNT(*) as c FROM plans WHERE date >= date('now') AND status = 'planned'",
      ).first(),
      env.DB.prepare(
        "SELECT COUNT(*) as c FROM songs WHERE id IN (SELECT DISTINCT song_id FROM arrangements)",
      ).first(),
      env.DB.prepare(
        "SELECT COUNT(*) as c FROM scheduled_people WHERE status = 'pending'",
      ).first(),
      env.DB.prepare("SELECT COUNT(*) as c FROM teams").first(),
    ]);
    return json({
      members: members.c,
      activeMembers: activeMembers.c,
      upcomingPlans: upcomingPlans.c,
      songsWithArrangements: songs.c,
      pendingConfirmations: pendingSchedule.c,
      teams: teams.c,
    });
  }),

  route("POST", "/api/email-logs", async (request, env) => {
    const caller = await getMemberFromRequest(request, env);
    if (!caller) return json({ error: "Not authenticated" }, 401);
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");
    const emailLogsErr = validate({ subject: { required: true, type: 'string' }, body: { required: true, type: 'string' }, recipient_email: { required: true, type: 'string' } }, body);
    if (emailLogsErr) return validationError(emailLogsErr);

    const result = await env.DB.prepare(
      `
        INSERT INTO email_logs (template_id, subject, body, recipient_email, recipient_member_id, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
      .bind(
        body.template_id || null,
        body.subject,
        body.body,
        body.recipient_email,
        body.recipient_member_id || null,
        body.status || "sent",
      )
      .run();

    const log = await env.DB.prepare(
      `
        SELECT el.*, et.name as template_name
        FROM email_logs el
        LEFT JOIN email_templates et ON et.id = el.template_id
        WHERE el.id = ?
      `,
    )
      .bind(result.meta.last_row_id)
      .first();

    return json(log, 201);
  }),

  // Send email via Resend (https://resend.com) and log result
  route("POST", "/api/send-email", async (request, env) => {
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");

    const sendEmailErr = validate({ recipient_email: { required: true, type: 'string' }, subject: { required: true, type: 'string' }, body: { required: true, type: 'string' } }, body);
    if (sendEmailErr) return validationError(sendEmailErr);

    // Provider configuration from environment
    const apiKey = env.RESEND_API_KEY;
    const from = env.EMAIL_FROM || "no-reply@example.com";
    if (!apiKey)
      return badRequest("Email provider not configured (RESEND_API_KEY)");

    // Build the payload for Resend
    const payload = {
      from,
      to: body.recipient_email,
      subject: body.subject,
      html: body.body,
    };

    let sendStatus = "pending";
    let errorMessage = null;
    let remoteResponse = null;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      try {
        remoteResponse = JSON.parse(text);
      } catch (e) {
        console.error("parse resend send-email response failed", e);
        remoteResponse = text;
      }

      if (!res.ok) {
        sendStatus = "failed";
        errorMessage =
          remoteResponse && remoteResponse.error
            ? JSON.stringify(remoteResponse)
            : `HTTP ${res.status}`;
      } else {
        sendStatus = "sent";
      }
    } catch (e) {
      sendStatus = "failed";
      errorMessage = e.message || String(e);
    }

    // Insert into email_logs
    try {
      await env.DB.prepare(
        `
          INSERT INTO email_logs (template_id, subject, body, recipient_email, recipient_member_id, status, error_message)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
      )
        .bind(
          body.template_id || null,
          body.subject,
          body.body,
          body.recipient_email,
          body.recipient_member_id || null,
          sendStatus,
          errorMessage,
        )
        .run();
    } catch (e) {
      // If logging fails, return send failure
      return json(
        {
          success: false,
          error: "Failed to write email log",
          details: e.message || String(e),
        },
        500,
      );
    }

    return json({
      success: sendStatus === "sent",
      status: sendStatus,
      remote: remoteResponse,
      error: errorMessage,
    });
  }),

  // One-click action endpoint — executes an admin action based on a token
  route("POST", "/api/oneclick", async (request, env) => {
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");
    const oneclickErr = validate({ token: { required: true, type: 'string' } }, body);
    if (oneclickErr) return validationError(oneclickErr);
    if (!env.ONECLICK_SECRET) return json({ error: "Not configured" }, 500);
    // If email_oneclicks table exists, prefer DB-driven one-time tokens
    let payload = null;
    try {
      const dbRow = await env.DB.prepare(
        "SELECT * FROM email_oneclicks WHERE token = ?",
      )
        .bind(body.token)
        .first();
      if (dbRow) {
        if (dbRow.used) return json({ error: "Token already used" }, 400);
        payload = JSON.parse(dbRow.payload_json || "{}");
        // check expiry
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now)
          return json({ error: "Token expired" }, 400);
        // mark used
        await env.DB.prepare(
          "UPDATE email_oneclicks SET used = 1, used_at = datetime('now') WHERE id = ?",
        )
          .bind(dbRow.id)
          .run();
      } else {
        payload = await verifyOneClickToken(body.token, env.ONECLICK_SECRET);
      }
    } catch (e) {
      payload = await verifyOneClickToken(body.token, env.ONECLICK_SECRET);
    }
    if (!payload) return json({ error: "Invalid or expired token" }, 400);
    // check expiry field
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now)
      return json({ error: "Token expired" }, 400);
    if (
      payload.action === "revert_assignment" &&
      payload.existing_scheduled_id
    ) {
      try {
        // Delete the existing scheduled assignment
        await env.DB.prepare("DELETE FROM scheduled_people WHERE id = ?")
          .bind(payload.existing_scheduled_id)
          .run();
        // Log in scheduled_conflict_logs that revert was performed via one-click
        await env.DB.prepare(
          "INSERT INTO scheduled_conflict_logs (plan_id, member_id, existing_scheduled_id, forced_by, note) VALUES (?, ?, ?, ?, ?)",
        )
          .bind(
            payload.plan_id || null,
            payload.member_id || null,
            payload.existing_scheduled_id,
            "oneclick",
            "Reverted via one-click email",
          )
          .run();
        return json({ success: true });
      } catch (e) {
        return json(
          { error: "Action failed", details: e.message || String(e) },
          500,
        );
      }
    }
    return badRequest("Unknown action");
  }),

  // Communication Preferences
  route(
    "GET",
    "/api/communication-preferences/:memberId",
    async (request, env, params) => {
      const memberId = requireId({ id: params.memberId });
      if (!memberId) return badRequest("Invalid member ID");

      const prefs = await env.DB.prepare(
        `
        SELECT * FROM communication_preferences WHERE member_id = ?
      `,
      )
        .bind(memberId)
        .first();

      if (!prefs) {
        return json({
          member_id: memberId,
          receive_emails: true,
          receive_sms: true,
          email_types: null,
        });
      }
      return json(prefs);
    },
  ),

  route("POST", "/api/communication-preferences", async (request, env) => {
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");
    const commPrefErr = validate({ member_id: { required: true } }, body);
    if (commPrefErr) return validationError(commPrefErr);

    await env.DB.prepare(
      `
        INSERT OR REPLACE INTO communication_preferences (member_id, receive_emails, receive_sms, email_types)
        VALUES (?, ?, ?, ?)
      `,
    )
      .bind(
        body.member_id,
        body.receive_emails !== undefined ? body.receive_emails : 1,
        body.receive_sms !== undefined ? body.receive_sms : 1,
        body.email_types || null,
      )
      .run();

    const prefs = await env.DB.prepare(
      `
        SELECT * FROM communication_preferences WHERE member_id = ?
      `,
    )
      .bind(body.member_id)
      .first();

    return json(prefs, 201);
  }),
];
