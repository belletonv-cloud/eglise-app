import { CORS, json, badRequest, notFound, getBody, requireId } from "../lib.js";
import { validate, validationError } from '../validate.js'
import { hasPermission, getMemberFromRequest } from "../auth.js";
import { route } from "../routes.js";

export const adminSchedulingRoutes = [
  // ========================================
  // HOUSE GROUPS
  // ========================================
  route("GET", "/api/house-groups", async (request, env, params, url) => {
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const size = Math.min(parseInt(url.searchParams.get("size") || "25", 10), 100);
    const offset = (page - 1) * size;
    const countRes = await env.DB.prepare("SELECT COUNT(*) as count FROM house_groups").first();
    const totalCount = countRes?.count || 0;
    const groups = await env.DB.prepare(`
      SELECT hg.*, m.first_name as leader_first, m.last_name as leader_last,
        COUNT(gm.id) as member_count
      FROM house_groups hg
      LEFT JOIN group_members gm ON gm.group_id = hg.id
      LEFT JOIN members m ON m.id = hg.leader_id
      GROUP BY hg.id ORDER BY hg.name ASC LIMIT ? OFFSET ?
    `).bind(size, offset).all();
    return json({ data: groups.results, page, size, totalCount });
  }),

  route("POST", "/api/house-groups", async (request, env) => {
    if (!(await hasPermission(request, env, "manage_members"))) return json({ error: "Forbidden" }, 403);
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");
    const hgErr = validate({ name: { required: true, type: 'string' } }, body);
    if (hgErr) return validationError(hgErr);
    const result = await env.DB.prepare("INSERT INTO house_groups (name, description, leader_id, meeting_day, meeting_time, location) VALUES (?, ?, ?, ?, ?, ?)").bind(body.name, body.description || null, body.leader_id || null, body.meeting_day || null, body.meeting_time || null, body.location || null).run();
    const newGroup = await env.DB.prepare("SELECT hg.*, m.first_name as leader_first, m.last_name as leader_last FROM house_groups hg LEFT JOIN members m ON m.id = hg.leader_id WHERE hg.id = ?").bind(result.meta.last_row_id).first();
    return json(newGroup, 201);
  }),

  route("GET", "/api/house-groups/:id", async (request, env, params) => {
    const groupId = requireId({ id: params.id });
    if (!groupId) return badRequest("Invalid ID");
    const group = await env.DB.prepare("SELECT hg.*, m.first_name as leader_first, m.last_name as leader_last FROM house_groups hg LEFT JOIN members m ON m.id = hg.leader_id WHERE hg.id = ?").bind(groupId).first();
    if (!group) return notFound();
    group.members = (await env.DB.prepare("SELECT gm.*, m.first_name, m.last_name FROM group_members gm JOIN members m ON m.id = gm.member_id WHERE gm.group_id = ? ORDER BY m.last_name ASC").bind(groupId).all()).results;
    group.meetings = (await env.DB.prepare("SELECT * FROM group_meetings WHERE group_id = ? ORDER BY date DESC").bind(groupId).all()).results;
    return json(group);
  }),

  route("PUT", "/api/house-groups/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members"))) return json({ error: "Forbidden" }, 403);
    const groupId = requireId({ id: params.id });
    if (!groupId) return badRequest("Invalid ID");
    const existing = await env.DB.prepare("SELECT * FROM house_groups WHERE id = ?").bind(groupId).first();
    if (!existing) return notFound();
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");
    await env.DB.prepare("UPDATE house_groups SET name=?, description=?, leader_id=?, meeting_day=?, meeting_time=?, location=? WHERE id=?").bind(body.name || existing.name, body.description !== undefined ? body.description : existing.description, body.leader_id !== undefined ? body.leader_id || null : existing.leader_id, body.meeting_day !== undefined ? body.meeting_day || null : existing.meeting_day, body.meeting_time !== undefined ? body.meeting_time || null : existing.meeting_time, body.location !== undefined ? body.location || null : existing.location, groupId).run();
    const updated = await env.DB.prepare("SELECT hg.*, m.first_name as leader_first, m.last_name as leader_last FROM house_groups hg LEFT JOIN members m ON m.id = hg.leader_id WHERE hg.id = ?").bind(groupId).first();
    return json(updated);
  }),

  route("DELETE", "/api/house-groups/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members"))) return json({ error: "Forbidden" }, 403);
    const groupId = requireId({ id: params.id });
    if (!groupId) return badRequest("Invalid ID");
    await env.DB.prepare("DELETE FROM house_groups WHERE id = ?").bind(groupId).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // Group members
  route("POST", "/api/house-groups/:gid/members", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members"))) return json({ error: "Forbidden" }, 403);
    const groupId = requireId({ id: params.gid });
    if (!groupId) return badRequest("Invalid group ID");
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");
    const gmErr = validate({ member_id: { required: true, type: 'integer' } }, body);
    if (gmErr) return validationError(gmErr);
    await env.DB.prepare("INSERT OR IGNORE INTO group_members (group_id, member_id, role) VALUES (?, ?, ?)").bind(groupId, body.member_id, body.role || "member").run();
    return json({ success: true }, 201);
  }),

  route("DELETE", "/api/house-groups/:gid/members/:mid", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members"))) return json({ error: "Forbidden" }, 403);
    const groupId = requireId({ id: params.gid });
    const memberId = requireId({ id: params.mid });
    if (!groupId || !memberId) return badRequest("Invalid ID");
    await env.DB.prepare("DELETE FROM group_members WHERE group_id = ? AND member_id = ?").bind(groupId, memberId).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // Group meetings
  route("GET", "/api/house-groups/:gid/meetings", async (request, env, params) => {
    const groupId = requireId({ id: params.gid });
    if (!groupId) return badRequest("Invalid group ID");
    const meetings = await env.DB.prepare("SELECT * FROM group_meetings WHERE group_id = ? ORDER BY date DESC").bind(groupId).all();
    return json(meetings.results);
  }),

  route("POST", "/api/house-groups/:gid/meetings", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members"))) return json({ error: "Forbidden" }, 403);
    const groupId = requireId({ id: params.gid });
    if (!groupId) return badRequest("Invalid group ID");
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");
    const mtErr = validate({ date: { required: true, type: 'string' } }, body);
    if (mtErr) return validationError(mtErr);
    const result = await env.DB.prepare("INSERT INTO group_meetings (group_id, date, notes) VALUES (?, ?, ?)").bind(groupId, body.date, body.notes || null).run();
    const meeting = await env.DB.prepare("SELECT * FROM group_meetings WHERE id = ?").bind(result.meta.last_row_id).first();
    return json(meeting, 201);
  }),

  // ========================================
  // EMAIL TEMPLATES
  // ========================================
  route("GET", "/api/email-templates", async (request, env) => {
    const templates = await env.DB.prepare("SELECT et.*, COUNT(el.id) as usage_count FROM email_templates et LEFT JOIN email_logs el ON el.template_id = et.id GROUP BY et.id ORDER BY et.name ASC").all();
    return json(templates.results);
  }),

  route("POST", "/api/email-templates", async (request, env) => {
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");
    const etErr = validate({ name: { required: true, type: 'string', maxLength: 100 }, subject: { required: true, type: 'string', maxLength: 200 }, body: { required: true, type: 'string' } }, body);
    if (etErr) return validationError(etErr);
    const result = await env.DB.prepare("INSERT INTO email_templates (name, subject, body, variables) VALUES (?, ?, ?, ?)").bind(body.name, body.subject, body.body, body.variables || null).run();
    const newTemplate = await env.DB.prepare("SELECT * FROM email_templates WHERE id = ?").bind(result.meta.last_row_id).first();
    return json(newTemplate, 201);
  }),

  route("GET", "/api/email-templates/:id", async (request, env, params) => {
    const templateId = requireId({ id: params.id });
    if (!templateId) return badRequest("Invalid ID");
    const template = await env.DB.prepare("SELECT * FROM email_templates WHERE id = ?").bind(templateId).first();
    if (!template) return notFound();
    return json(template);
  }),

  route("PUT", "/api/email-templates/:id", async (request, env, params) => {
    const templateId = requireId({ id: params.id });
    if (!templateId) return badRequest("Invalid ID");
    const existing = await env.DB.prepare("SELECT * FROM email_templates WHERE id = ?").bind(templateId).first();
    if (!existing) return notFound();
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");
    const etuErr = validate({ name: { type: 'string', maxLength: 100 }, subject: { type: 'string', maxLength: 200 }, body: { type: 'string' } }, body);
    if (etuErr) return validationError(etuErr);
    await env.DB.prepare("UPDATE email_templates SET name=?, subject=?, body=?, variables=? WHERE id=?").bind(body.name || existing.name, body.subject || existing.subject, body.body || existing.body, body.variables !== undefined ? body.variables : existing.variables, templateId).run();
    const updated = await env.DB.prepare("SELECT * FROM email_templates WHERE id = ?").bind(templateId).first();
    return json(updated);
  }),

  route("DELETE", "/api/email-templates/:id", async (request, env, params) => {
    const templateId = requireId({ id: params.id });
    if (!templateId) return badRequest("Invalid ID");
    await env.DB.prepare("DELETE FROM email_templates WHERE id = ?").bind(templateId).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // ========================================
  // EMAIL LOGS
  // ========================================
  route("GET", "/api/email-logs", async (request, env) => {
    const caller = await getMemberFromRequest(request, env);
    if (!caller) return json({ error: "Not authenticated" }, 401);
    if (caller.role !== "admin" && !(await hasPermission(request, env, "edit_announcements")))
      return json({ error: "Forbidden" }, 403);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const size = Math.min(parseInt(url.searchParams.get("size") || "50", 10), 200);
    const offset = (page - 1) * size;
    const total = (await env.DB.prepare("SELECT COUNT(*) as c FROM email_logs").first())?.c || 0;
    const logs = await env.DB.prepare("SELECT el.*, et.name as template_name FROM email_logs el LEFT JOIN email_templates et ON et.id = el.template_id ORDER BY el.sent_at DESC LIMIT ? OFFSET ?").bind(size, offset).all();
    return json({ data: logs.results, page, size, totalCount: total });
  }),

  // ========================================
  // MEMBER EXCEPTIONS
  // ========================================
  route("GET", "/api/member-exceptions", async (request, env) => {
    if (!(await hasPermission(request, env, "manage_members"))) return json({ error: "Forbidden" }, 403);
    const rows = await env.DB.prepare("SELECT me.*, m.first_name, m.last_name FROM member_exceptions me LEFT JOIN members m ON m.id = me.member_id ORDER BY me.created_at DESC").all();
    return json(rows.results);
  }),

  route("POST", "/api/member-exceptions", async (request, env) => {
    if (!(await hasPermission(request, env, "manage_members"))) return json({ error: "Forbidden" }, 403);
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");
    const meErr = validate({ member_id: { required: true, type: 'integer' }, permission: { required: true, type: 'string' } }, body);
    if (meErr) return validationError(meErr);
    await env.DB.prepare("INSERT INTO member_exceptions (member_id, permission, granted) VALUES (?, ?, ?)").bind(body.member_id, body.permission, !!body.granted).run();
    return json({ success: true }, 201);
  }),

  route("DELETE", "/api/member-exceptions/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members"))) return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("Invalid ID");
    await env.DB.prepare("DELETE FROM member_exceptions WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // ========================================
  // MEMBER ROLE
  // ========================================
  route("PUT", "/api/members/:id/role", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members"))) return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("Invalid ID");
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");
    const roleErr = validate({ role: { required: true, type: 'string' } }, body);
    if (roleErr) return validationError(roleErr);
    await env.DB.prepare("UPDATE members SET role = ? WHERE id = ?").bind(body.role, id).run();
    const updated = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(id).first();
    return json(updated);
  }),
]
