import { route } from "../routes.js";
import { json, getBody, badRequest, requireId, CORS } from "../lib.js";
import { hasPermission, getMemberFromRequest } from "../auth.js";
import { validate, validationError } from '../validate.js'

// ========================================
// ANNONCES & POINTS DE PRIÈRE
// ========================================
export const announcementsRoutes = [
  route("GET", "/api/announcements", async (request, env, params, url) => {
    const type = url.searchParams.get("type");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const size = Math.min(
      parseInt(url.searchParams.get("size") || "25", 10),
      100,
    );
    const offset = (page - 1) * size;
    let where = "",
      whereCount = "",
      binds = [];
    if (type === "prayer") {
      where = "WHERE a.type = 'prayer' ";
      whereCount = "WHERE type = 'prayer' ";
    } else if (type === "announcement") {
      where = "WHERE a.type = 'announcement' ";
      whereCount = "WHERE type = 'announcement' ";
    }

    // Get total count
    const countRes = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM announcements ${whereCount}`,
    ).all();
    const totalCount = countRes.results[0]?.count || 0;

    // Get paginated list
    let query = `SELECT a.*, m.first_name as author_first, m.last_name as author_last FROM announcements a LEFT JOIN members m ON m.id = a.author_id ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
    const rows = await env.DB.prepare(query).bind(size, offset).all();
    return json({ data: rows.results, page, size, totalCount });
  }),

  route("POST", "/api/announcements", async (request, env) => {
    if (!(await hasPermission(request, env, "edit_announcements")))
      return json({ error: "Forbidden" }, 403);
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: "Not authenticated" }, 401);
    const body = await getBody(request);
    const err = validate({ title: { required: true, type: 'string', maxLength: 200 }, content: { required: true, type: 'string', maxLength: 5000 }, target_audience: { type: 'string', enum: ['everyone', 'members', 'team'] }, type: { type: 'string', enum: ['announcement', 'prayer'] } }, body)
    if (err) return validationError(err)
    const result = await env.DB.prepare(
      "INSERT INTO announcements (type, content, author_id, plan_id) VALUES (?, ?, ?, ?)",
    )
      .bind(body.type || 'announcement', body.content, member.id, body.plan_id || null)
      .run();
    const created = await env.DB.prepare(
      "SELECT a.*, m.first_name as author_first, m.last_name as author_last FROM announcements a LEFT JOIN members m ON m.id = a.author_id WHERE a.id = ?",
    )
      .bind(result.meta.last_row_id)
      .first();
    return json(created, 201);
  }),

  route("PUT", "/api/announcements/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "edit_announcements")))
      return json({ error: "Forbidden" }, 403);
    if (!(await hasPermission(request, env, "edit_members")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const body = await getBody(request);
    const putErr = validate({ title: { type: 'string', maxLength: 200 }, content: { type: 'string', maxLength: 5000 }, target_audience: { type: 'string', enum: ['everyone', 'members', 'team'] }, type: { type: 'string', enum: ['announcement', 'prayer'] } }, body)
    if (putErr) return validationError(putErr)
    await env.DB.prepare(
      "UPDATE announcements SET content = ?, type = ? WHERE id = ?",
    )
      .bind(body.content, body.type || "announcement", id)
      .run();
    const updated = await env.DB.prepare(
      "SELECT a.*, m.first_name as author_first, m.last_name as author_last FROM announcements a LEFT JOIN members m ON m.id = a.author_id WHERE a.id = ?",
    )
      .bind(id)
      .first();
    return json(updated);
  }),

  route("DELETE", "/api/announcements/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "edit_announcements")))
      return json({ error: "Forbidden" }, 403);
    if (!(await hasPermission(request, env, "edit_members")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    await env.DB.prepare("DELETE FROM announcements WHERE id = ?")
      .bind(id)
      .run();
    return new Response(null, { status: 204, headers: CORS });
  }),
];
