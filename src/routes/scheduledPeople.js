import {
  CORS,
  json,
  badRequest,
  notFound,
  getBody,
  validate,
  requireId,
  dbFirst,
  dbAll,
  generateSecureToken,
} from "../lib.js";
import {
  hasPermission,
  getMemberFromRequest,
  requirePermission,
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
          member_id: { required: true, type: "int" },
        },
        body,
      );
      // authorization: need scheduling permission
      if (!(await hasPermission(request, env, "schedule")))
        return json({ error: "Forbidden" }, 403);
      // if forcing, require force_schedule permission
      if (body.force && !(await hasPermission(request, env, "force_schedule")))
        return json({ error: "Forbidden to force" }, 403);
      if (err) return badRequest(err);

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
          try { fcmSa = JSON.parse(env.FCM_SERVICE_ACCOUNT); } catch { fcmSa = null; }
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

  // Attendance endpoints
  route("GET", "/api/attendances", async (request, env, params, url) => {
    const caller = await getMemberFromRequest(request, env);
    if (!caller) return json({ error: "Not authenticated" }, 401);
    if (
      !(await hasPermission(request, env, "schedule")) &&
      caller.role !== "admin"
    )
      return json({ error: "Forbidden" }, 403);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const size = Math.min(
      parseInt(url.searchParams.get("size") || "25", 10),
      100,
    );
    const offset = (page - 1) * size;
    // Total count
    const countRes = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM attendances",
    ).first();
    const totalCount = countRes?.count || 0;
    // Paginated fetch
    const attendances = await env.DB.prepare(
      `
        SELECT a.*, m.first_name, m.last_name, p.date as plan_date, p.time as plan_time
        FROM attendances a
        JOIN members m ON m.id = a.member_id
        JOIN plans p ON p.id = a.plan_id
        ORDER BY a.check_in_time DESC
        LIMIT ? OFFSET ?
      `,
    )
      .bind(size, offset)
      .all();
    return json({ data: attendances.results, page, size, totalCount });
  }),

  route("POST", "/api/attendances", async (request, env) => {
    if (!(await hasPermission(request, env, "schedule")))
      return json({ error: "Forbidden" }, 403);
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");

    // Validate required fields
    if (!body.plan_id || !body.member_id) {
      return badRequest("plan_id and member_id are required");
    }

    // Check if already checked in for this plan
    const existing = await env.DB.prepare(
      "SELECT id FROM attendances WHERE plan_id = ? AND member_id = ?",
    )
      .bind(body.plan_id, body.member_id)
      .first();

    if (existing) {
      return badRequest("Already checked in for this service");
    }

    const result = await env.DB.prepare(
      "INSERT INTO attendances (plan_id, member_id, status, notes) VALUES (?, ?, ?, ?)",
    )
      .bind(
        body.plan_id,
        body.member_id,
        body.status || "present",
        body.notes || null,
      )
      .run();

    const attendance = await env.DB.prepare(
      `
        SELECT a.*, m.first_name, m.last_name
        FROM attendances a
        JOIN members m ON m.id = a.member_id
        WHERE a.id = ?
      `,
    )
      .bind(result.meta.last_row_id)
      .first();

    return json(attendance, 201);
  }),

  route("GET", "/api/attendances/:id", async (request, env, params) => {
    const attendanceId = requireId({ id: params.id });
    if (!attendanceId) return badRequest("Invalid ID");

    const attendance = await env.DB.prepare(
      `
        SELECT a.*, m.first_name, m.last_name, p.date as plan_date, p.time as plan_time
        FROM attendances a
        JOIN members m ON m.id = a.member_id
        JOIN plans p ON p.id = a.plan_id
        WHERE a.id = ?
      `,
    )
      .bind(attendanceId)
      .first();

    if (!attendance) return notFound();
    return json(attendance);
  }),

  route("PUT", "/api/attendances/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "schedule")))
      return json({ error: "Forbidden" }, 403);
    const attendanceId = requireId({ id: params.id });
    if (!attendanceId) return badRequest("Invalid ID");

    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");

    await env.DB.prepare("UPDATE attendances SET status=?, notes=? WHERE id=?")
      .bind(body.status || null, body.notes || null, attendanceId)
      .run();

    const attendance = await env.DB.prepare(
      `
        SELECT a.*, m.first_name, m.last_name
        FROM attendances a
        JOIN members m ON m.id = a.member_id
        WHERE a.id = ?
      `,
    )
      .bind(attendanceId)
      .first();

    return json(attendance);
  }),

  route("DELETE", "/api/attendances/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "schedule")))
      return json({ error: "Forbidden" }, 403);
    const attendanceId = requireId({ id: params.id });
    if (!attendanceId) return badRequest("Invalid ID");

    await env.DB.prepare("DELETE FROM attendances WHERE id = ?")
      .bind(attendanceId)
      .run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  route("GET", "/api/plans/:pid/attendances", async (request, env, params) => {
    const planId = requireId({ id: params.pid });
    if (!planId) return badRequest("Invalid plan ID");

    const attendances = await env.DB.prepare(
      `
        SELECT a.*, m.first_name, m.last_name
        FROM attendances a
        JOIN members m ON m.id = a.member_id
        WHERE a.plan_id = ?
        ORDER BY a.check_in_time DESC
      `,
    )
      .bind(planId)
      .all();

    return json(attendances.results);
  }),

  // House Groups endpoints
  route("GET", "/api/house-groups", async (request, env, params, url) => {
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const size = Math.min(
      parseInt(url.searchParams.get("size") || "25", 10),
      100,
    );
    const offset = (page - 1) * size;
    // Get total count
    const countRes = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM house_groups",
    ).first();
    const totalCount = countRes?.count || 0;
    // Main paginated fetch
    const groups = await env.DB.prepare(
      `
        SELECT hg.*, m.first_name as leader_first, m.last_name as leader_last,
          COUNT(gm.id) as member_count
        FROM house_groups hg
        LEFT JOIN group_members gm ON gm.group_id = hg.id
        LEFT JOIN members m ON m.id = hg.leader_id
        GROUP BY hg.id
        ORDER BY hg.name ASC
        LIMIT ? OFFSET ?
      `,
    )
      .bind(size, offset)
      .all();
    return json({ data: groups.results, page, size, totalCount });
  }),

  route("POST", "/api/house-groups", async (request, env) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");
    if (!body.name) return badRequest("Name is required");

    const result = await env.DB.prepare(
      `
        INSERT INTO house_groups (name, description, leader_id, meeting_day, meeting_time, location)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
      .bind(
        body.name,
        body.description || null,
        body.leader_id || null,
        body.meeting_day || null,
        body.meeting_time || null,
        body.location || null,
      )
      .run();

    const newGroup = await env.DB.prepare(
      `
        SELECT hg.*, m.first_name as leader_first, m.last_name as leader_last
        FROM house_groups hg
        LEFT JOIN members m ON m.id = hg.leader_id
        WHERE hg.id = ?
      `,
    )
      .bind(result.meta.last_row_id)
      .first();

    return json(newGroup, 201);
  }),

  route("GET", "/api/house-groups/:id", async (request, env, params) => {
    const groupId = requireId({ id: params.id });
    if (!groupId) return badRequest("Invalid ID");

    const group = await env.DB.prepare(
      `
        SELECT hg.*, m.first_name as leader_first, m.last_name as leader_last
        FROM house_groups hg
        LEFT JOIN members m ON m.id = hg.leader_id
        WHERE hg.id = ?
      `,
    )
      .bind(groupId)
      .first();

    if (!group) return notFound();

    // Get members
    group.members = (
      await env.DB.prepare(
        `
        SELECT gm.*, m.first_name, m.last_name
        FROM group_members gm
        JOIN members m ON m.id = gm.member_id
        WHERE gm.group_id = ?
        ORDER BY m.last_name ASC
      `,
      )
        .bind(groupId)
        .all()
    ).results;

    // Get meetings
    group.meetings = (
      await env.DB.prepare(
        `
        SELECT * FROM group_meetings
        WHERE group_id = ?
        ORDER BY date DESC
      `,
      )
        .bind(groupId)
        .all()
    ).results;

    return json(group);
  }),

  route("PUT", "/api/house-groups/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const groupId = requireId({ id: params.id });
    if (!groupId) return badRequest("Invalid ID");

    const existing = await env.DB.prepare(
      "SELECT * FROM house_groups WHERE id = ?",
    )
      .bind(groupId)
      .first();
    if (!existing) return notFound();

    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");

    await env.DB.prepare(
      `
        UPDATE house_groups SET name=?, description=?, leader_id=?, meeting_day=?, meeting_time=?, location=?
        WHERE id=?
      `,
    )
      .bind(
        body.name || existing.name,
        body.description !== undefined
          ? body.description
          : existing.description,
        body.leader_id !== undefined
          ? body.leader_id || null
          : existing.leader_id,
        body.meeting_day !== undefined
          ? body.meeting_day || null
          : existing.meeting_day,
        body.meeting_time !== undefined
          ? body.meeting_time || null
          : existing.meeting_time,
        body.location !== undefined ? body.location || null : existing.location,
        groupId,
      )
      .run();

    const updated = await env.DB.prepare(
      `
        SELECT hg.*, m.first_name as leader_first, m.last_name as leader_last
        FROM house_groups hg
        LEFT JOIN members m ON m.id = hg.leader_id
        WHERE hg.id = ?
      `,
    )
      .bind(groupId)
      .first();

    return json(updated);
  }),

  route("DELETE", "/api/house-groups/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const groupId = requireId({ id: params.id });
    if (!groupId) return badRequest("Invalid ID");

    await env.DB.prepare("DELETE FROM house_groups WHERE id = ?")
      .bind(groupId)
      .run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // Group members
  route(
    "POST",
    "/api/house-groups/:gid/members",
    async (request, env, params) => {
      if (!(await hasPermission(request, env, "manage_members")))
        return json({ error: "Forbidden" }, 403);
      const groupId = requireId({ id: params.gid });
      if (!groupId) return badRequest("Invalid group ID");

      const body = await getBody(request);
      if (!body) return badRequest("Invalid JSON body");
      if (!body.member_id) return badRequest("member_id is required");

      await env.DB.prepare(
        `
        INSERT OR IGNORE INTO group_members (group_id, member_id, role)
        VALUES (?, ?, ?)
      `,
      )
        .bind(groupId, body.member_id, body.role || "member")
        .run();

      return json({ success: true }, 201);
    },
  ),

  route(
    "DELETE",
    "/api/house-groups/:gid/members/:mid",
    async (request, env, params) => {
      if (!(await hasPermission(request, env, "manage_members")))
        return json({ error: "Forbidden" }, 403);
      const groupId = requireId({ id: params.gid });
      const memberId = requireId({ id: params.mid });
      if (!groupId || !memberId) return badRequest("Invalid ID");

      await env.DB.prepare(
        "DELETE FROM group_members WHERE group_id = ? AND member_id = ?",
      )
        .bind(groupId, memberId)
        .run();
      return new Response(null, { status: 204, headers: CORS });
    },
  ),

  // Group meetings
  route(
    "GET",
    "/api/house-groups/:gid/meetings",
    async (request, env, params) => {
      const groupId = requireId({ id: params.gid });
      if (!groupId) return badRequest("Invalid group ID");

      const meetings = await env.DB.prepare(
        `
        SELECT * FROM group_meetings
        WHERE group_id = ?
        ORDER BY date DESC
      `,
      )
        .bind(groupId)
        .all();

      return json(meetings.results);
    },
  ),

  route(
    "POST",
    "/api/house-groups/:gid/meetings",
    async (request, env, params) => {
      if (!(await hasPermission(request, env, "manage_members")))
        return json({ error: "Forbidden" }, 403);
      const groupId = requireId({ id: params.gid });
      if (!groupId) return badRequest("Invalid group ID");

      const body = await getBody(request);
      if (!body) return badRequest("Invalid JSON body");
      if (!body.date) return badRequest("date is required");

      const result = await env.DB.prepare(
        `
        INSERT INTO group_meetings (group_id, date, notes)
        VALUES (?, ?, ?)
      `,
      )
        .bind(groupId, body.date, body.notes || null)
        .run();

      const meeting = await env.DB.prepare(
        "SELECT * FROM group_meetings WHERE id = ?",
      )
        .bind(result.meta.last_row_id)
        .first();

      return json(meeting, 201);
    },
  ),

  // Email Templates
  route("GET", "/api/email-templates", async (request, env) => {
    const templates = await env.DB.prepare(
      `
        SELECT et.*, COUNT(el.id) as usage_count
        FROM email_templates et
        LEFT JOIN email_logs el ON el.template_id = et.id
        GROUP BY et.id
        ORDER BY et.name ASC
      `,
    ).all();
    return json(templates.results);
  }),

  route("POST", "/api/email-templates", async (request, env) => {
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");
    if (!body.name || !body.subject || !body.body) {
      return badRequest("name, subject and body are required");
    }

    const result = await env.DB.prepare(
      `
        INSERT INTO email_templates (name, subject, body, variables)
        VALUES (?, ?, ?, ?)
      `,
    )
      .bind(body.name, body.subject, body.body, body.variables || null)
      .run();

    const newTemplate = await env.DB.prepare(
      `
        SELECT * FROM email_templates WHERE id = ?
      `,
    )
      .bind(result.meta.last_row_id)
      .first();

    return json(newTemplate, 201);
  }),

  route("GET", "/api/email-templates/:id", async (request, env, params) => {
    const templateId = requireId({ id: params.id });
    if (!templateId) return badRequest("Invalid ID");

    const template = await env.DB.prepare(
      `
        SELECT * FROM email_templates WHERE id = ?
      `,
    )
      .bind(templateId)
      .first();

    if (!template) return notFound();
    return json(template);
  }),

  route("PUT", "/api/email-templates/:id", async (request, env, params) => {
    const templateId = requireId({ id: params.id });
    if (!templateId) return badRequest("Invalid ID");

    const existing = await env.DB.prepare(
      "SELECT * FROM email_templates WHERE id = ?",
    )
      .bind(templateId)
      .first();
    if (!existing) return notFound();

    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");

    await env.DB.prepare(
      `
        UPDATE email_templates SET name=?, subject=?, body=?, variables=?
        WHERE id=?
      `,
    )
      .bind(
        body.name || existing.name,
        body.subject || existing.subject,
        body.body || existing.body,
        body.variables !== undefined ? body.variables : existing.variables,
        templateId,
      )
      .run();

    const updated = await env.DB.prepare(
      `
        SELECT * FROM email_templates WHERE id = ?
      `,
    )
      .bind(templateId)
      .first();

    return json(updated);
  }),

  route("DELETE", "/api/email-templates/:id", async (request, env, params) => {
    const templateId = requireId({ id: params.id });
    if (!templateId) return badRequest("Invalid ID");

    await env.DB.prepare("DELETE FROM email_templates WHERE id = ?")
      .bind(templateId)
      .run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // Email Logs
  route("GET", "/api/email-logs", async (request, env) => {
    const caller = await getMemberFromRequest(request, env);
    if (!caller) return json({ error: "Not authenticated" }, 401);
    if (
      caller.role !== "admin" &&
      !(await hasPermission(request, env, "edit_announcements"))
    )
      return json({ error: "Forbidden" }, 403);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const size = Math.min(
      parseInt(url.searchParams.get("size") || "50", 10),
      200,
    );
    const offset = (page - 1) * size;
    const total =
      (await env.DB.prepare("SELECT COUNT(*) as c FROM email_logs").first())
        ?.c || 0;
    const logs = await env.DB.prepare(
      `SELECT el.*, et.name as template_name
       FROM email_logs el
       LEFT JOIN email_templates et ON et.id = el.template_id
       ORDER BY el.sent_at DESC
       LIMIT ? OFFSET ?`,
    )
      .bind(size, offset)
      .all();
    return json({ data: logs.results, page, size, totalCount: total });
  }),

  // Member exceptions management (admin)
  route("GET", "/api/member-exceptions", async (request, env) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const rows = await env.DB.prepare(
      "SELECT me.*, m.first_name, m.last_name FROM member_exceptions me LEFT JOIN members m ON m.id = me.member_id ORDER BY me.created_at DESC",
    ).all();
    return json(rows.results);
  }),

  route("POST", "/api/member-exceptions", async (request, env) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const body = await getBody(request);
    if (!body || !body.member_id || !body.permission)
      return badRequest("member_id and permission required");
    await env.DB.prepare(
      "INSERT INTO member_exceptions (member_id, permission, granted) VALUES (?, ?, ?)",
    )
      .bind(body.member_id, body.permission, !!body.granted)
      .run();
    return json({ success: true }, 201);
  }),

  route(
    "DELETE",
    "/api/member-exceptions/:id",
    async (request, env, params) => {
      if (!(await hasPermission(request, env, "manage_members")))
        return json({ error: "Forbidden" }, 403);
      const id = requireId(params);
      if (!id) return badRequest("Invalid ID");
      await env.DB.prepare("DELETE FROM member_exceptions WHERE id = ?")
        .bind(id)
        .run();
      return new Response(null, { status: 204, headers: CORS });
    },
  ),

  // Admin: update member role
  route("PUT", "/api/members/:id/role", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("Invalid ID");
    const body = await getBody(request);
    if (!body || !body.role) return badRequest("role required");
    await env.DB.prepare("UPDATE members SET role = ? WHERE id = ?")
      .bind(body.role, id)
      .run();
    const updated = await env.DB.prepare("SELECT * FROM members WHERE id = ?")
      .bind(id)
      .first();
    return json(updated);
  }),
];
