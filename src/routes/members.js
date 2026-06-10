import { CORS, json, badRequest, notFound, getBody, validate, requireId } from '../lib.js'
import { hasPermission, getMemberFromRequest } from '../auth.js'
import { route } from '../routes.js'
import { triggerWebhooks } from '../webhooks.js'

// ========================================
// MEMBERS
// ========================================
export const membersRoutes = [

  route("GET", "/api/members", async (request, env, params, url) => {
    // Pagination params
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const size = Math.min(
      parseInt(url.searchParams.get("size") || "25", 10),
      100,
    );
    const offset = (page - 1) * size;
    const q = (url.searchParams.get("q") || "").trim();
    const teamIdValue =
      url.searchParams.get("teamId") || url.searchParams.get("team_id") || "";
    const teamId = parseInt(teamIdValue, 10);

    const caller = await getMemberFromRequest(request, env);
    if (!caller) return json({ error: "Not authenticated" }, 401);

    // Check caller role — non-admins get a reduced view (no sensitive fields)
    const isAdmin =
      caller.role === "admin" ||
      (await hasPermission(request, env, "edit_members"));

    const whereClauses = [];
    const whereBindings = [];

    if (q) {
      const term = `%${q}%`;
      whereClauses.push(
        "(m.first_name LIKE ? OR m.last_name LIKE ? OR m.email LIKE ? OR m.phone LIKE ?)",
      );
      whereBindings.push(term, term, term, term);
    }

    if (Number.isFinite(teamId) && teamId > 0) {
      whereClauses.push(
        "EXISTS (SELECT 1 FROM team_members tm_filter WHERE tm_filter.member_id = m.id AND tm_filter.team_id = ?)",
      );
      whereBindings.push(teamId);
    }

    const whereSql = whereClauses.length
      ? ` WHERE ${whereClauses.join(" AND ")}`
      : "";

    // Count total members
    const countRes = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM members m${whereSql}`,
    )
      .bind(...whereBindings)
      .first();
    const totalCount = countRes?.count || 0;

    // Get paginated members
    const membersRes = await env.DB.prepare(
      `SELECT
        m.*,
        (
          SELECT MAX(p.date)
          FROM scheduled_people sp
          JOIN plans p ON p.id = sp.plan_id
          WHERE sp.member_id = m.id
        ) as last_scheduled_plan
       FROM members m${whereSql}
       ORDER BY m.last_name ASC, m.first_name ASC
       LIMIT ? OFFSET ?`,
    )
      .bind(...whereBindings, size, offset)
      .all();
    const members = membersRes.results;

    // Get team memberships for all these members only
    const ids = members.map((m) => m.id);
    let map = {};
    if (ids.length) {
      const queryMark = ids.map(() => "?").join(",");
      const tmRes = await env.DB.prepare(
        `
        SELECT tm.member_id as member_id, t.id as team_id, t.name as team_name, t.description as team_description, tm.position as position
        FROM team_members tm JOIN teams t ON t.id = tm.team_id
        WHERE tm.member_id IN (${queryMark})
      `,
      )
        .bind(...ids)
        .all();
      map = {};
      for (const row of tmRes.results) {
        if (!map[row.member_id]) map[row.member_id] = [];
        map[row.member_id].push({
          id: row.team_id,
          name: row.team_name,
          description: row.team_description,
          position: row.position,
        });
      }
    }

    // Attach teams array to each member, strip sensitive fields for non-admins
    const withTeams = members.map((m) => {
      const base = { ...m, teams: map[m.id] || [] };
      if (!isAdmin) {
        // Remove fields not relevant for the directory view
        delete base.birth_date;
        delete base.baptism_date;
        delete base.notes;
        delete base.pco_id;
        delete base.pco_updated_at;
        delete base.pco_deleted_at;
        delete base.consent_data_sharing;
        delete base.consent_photo;
        delete base.consent_communication;
        delete base.data_origin;
        delete base.gdpr_data_exported_at;
        delete base.gdpr_erased_at;
      }
      return base;
    });
    return json({ data: withTeams, page, size, totalCount });
  }),

  route("POST", "/api/members", async (request, env) => {
    if (!(await hasPermission(request, env, "edit_members")))
      return json({ error: "Forbidden" }, 403);
    const body = await getBody(request);
    if (!body) return badRequest("Corps JSON invalide");
    const err = validate(
      {
        first_name: { required: true, maxLength: 100 },
        last_name: { required: true, maxLength: 100 },
      },
      body,
    );
    if (err) return badRequest(err);
    const stmt = env.DB.prepare(
      "INSERT INTO members (first_name, last_name, email, phone, birth_date, membership_type, baptism_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const result = await stmt
      .bind(
        body.first_name,
        body.last_name,
        body.email || null,
        body.phone || null,
        body.birth_date || null,
        body.membership_type || "guest",
        body.baptism_date || null,
        body.notes || null,
      )
      .run();
    const newMember = await env.DB.prepare("SELECT * FROM members WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();
    triggerWebhooks(env, "member.created", newMember).catch((err) => {
      console.error("triggerWebhooks member.created failed", err, {
        event: "member.created",
        payload: newMember,
      });
    });
    return json(newMember, 201);
  }),

  route("GET", "/api/members/:id", async (request, env, params) => {
    const caller = await getMemberFromRequest(request, env);
    if (!caller) return json({ error: "Not authenticated" }, 401);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?")
      .bind(id)
      .first();
    if (!member) return notFound();
    const teams = await env.DB.prepare(
      `
      SELECT t.*, tm.position FROM teams t
      JOIN team_members tm ON tm.team_id = t.id
      WHERE tm.member_id = ? ORDER BY t.name ASC
    `,
    )
      .bind(id)
      .all();
    const result = { ...member, teams: teams.results };
    // Strip sensitive fields for non-admins viewing other members' profiles
    const isAdmin =
      caller.role === "admin" ||
      (await hasPermission(request, env, "edit_members"));
    if (!isAdmin && caller.id !== id) {
      delete result.birth_date;
      delete result.baptism_date;
      delete result.notes;
      delete result.pco_id;
      delete result.pco_updated_at;
      delete result.pco_deleted_at;
    }
    return json(result);
  }),

  route("PUT", "/api/members/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "edit_members")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const body = await getBody(request);
    if (!body) return badRequest("Corps JSON invalide");
    await env.DB.prepare(
      "UPDATE members SET first_name=?, last_name=?, email=?, phone=?, birth_date=?, membership_type=?, role=?, baptism_date=?, notes=?, updated_at=datetime('now') WHERE id=?",
    )
      .bind(
        body.first_name,
        body.last_name,
        body.email || null,
        body.phone || null,
        body.birth_date || null,
        body.membership_type || "guest",
        body.role || null,
        body.baptism_date || null,
        body.notes || null,
        id,
      )
      .run();
    const updated = await env.DB.prepare("SELECT * FROM members WHERE id = ?")
      .bind(id)
      .first();
    return json(updated);
  }),

  route("DELETE", "/api/members/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    await env.DB.prepare("DELETE FROM members WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // ========================================
  // RGPD — Right to access (export my data)
  // ========================================
  route("GET", "/api/members/:id/gdpr-export", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const caller = await getMemberFromRequest(request, env);
    if (!caller) return json({ error: "Unauthorized" }, 401);
    // Only the member themself or an admin can export
    if (caller.id !== Number(id) && caller.role !== "admin")
      return json({ error: "Forbidden" }, 403);
    const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?")
      .bind(id)
      .first();
    if (!member) return json({ error: "Not found" }, 404);
    // Collect all related data
    const teams = await env.DB.prepare(
      `SELECT t.name, tm.position FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE tm.member_id = ?`,
    ).bind(id).all();
    const attendances = await env.DB.prepare(
      "SELECT plan_id, status, created_at FROM attendances WHERE member_id = ?",
    ).bind(id).all();
    const scheduled = await env.DB.prepare(
      `SELECT p.date, p.time, st.name as service_type, sp.status
       FROM scheduled_people sp
       JOIN plans p ON p.id = sp.plan_id
       JOIN service_types st ON st.id = p.service_type_id
       WHERE sp.member_id = ?`,
    ).bind(id).all();
    const commPrefs = await env.DB.prepare(
      "SELECT * FROM communication_preferences WHERE member_id = ?",
    ).bind(id).first();
    const exportData = {
      exported_at: new Date().toISOString(),
      member: {
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        phone: member.phone,
        birth_date: member.birth_date,
        membership_type: member.membership_type,
        role: member.role,
        consent_data_sharing: member.consent_data_sharing,
        consent_photo: member.consent_photo,
        consent_communication: member.consent_communication,
        data_origin: member.data_origin,
        created_at: member.created_at,
        updated_at: member.updated_at,
      },
      teams: teams.results,
      attendances: attendances.results,
      scheduled_services: scheduled.results,
      communication_preferences: commPrefs || null,
    };
    // Mark export timestamp
    await env.DB.prepare(
      "UPDATE members SET gdpr_data_exported_at = ? WHERE id = ?",
    ).bind(exportData.exported_at, id).run();
    return json(exportData);
  }),

  // ========================================
  // RGPD — Right to erasure (anonymize)
  // ========================================
  route("POST", "/api/members/:id/gdpr-erase", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const caller = await getMemberFromRequest(request, env);
    if (!caller) return json({ error: "Unauthorized" }, 401);
    // Only the member themself or an admin can request erasure
    if (caller.id !== Number(id) && caller.role !== "admin")
      return json({ error: "Forbidden" }, 403);
    const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?")
      .bind(id)
      .first();
    if (!member) return json({ error: "Not found" }, 404);
    if (member.gdpr_erased_at)
      return json({ error: "Already erased" }, 400);
    // Anonymize member data (keep ID for referential integrity)
    const now = new Date().toISOString();
    await env.DB.prepare(`
      UPDATE members SET
        first_name = '[anonymisé]',
        last_name = '[anonymisé]',
        email = NULL,
        phone = NULL,
        birth_date = NULL,
        notes = NULL,
        pco_id = NULL,
        pco_updated_at = NULL,
        consent_data_sharing = 0,
        consent_photo = 0,
        consent_communication = 0,
        gdpr_erased_at = ?
      WHERE id = ?
    `).bind(now, id).run();
    // Also clear communication preferences
    await env.DB.prepare(
      "DELETE FROM communication_preferences WHERE member_id = ?",
    ).bind(id).run();
    return json({ success: true, erased_at: now });
  }),

  // ========================================
  // RGPD — Update member consent
  // ========================================
  route("PUT", "/api/members/:id/consent", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const caller = await getMemberFromRequest(request, env);
    if (!caller) return json({ error: "Unauthorized" }, 401);
    if (caller.id !== Number(id) && !(await hasPermission(request, env, "edit_members")))
      return json({ error: "Forbidden" }, 403);
    const body = await getBody(request).catch(() => null);
    if (!body) return badRequest("Body required");
    await env.DB.prepare(`
      UPDATE members SET
        consent_data_sharing = ?,
        consent_photo = ?,
        consent_communication = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.consent_data_sharing ? 1 : 0,
      body.consent_photo ? 1 : 0,
      body.consent_communication ? 1 : 0,
      id,
    ).run();
    return json({ success: true });
  }),

]
