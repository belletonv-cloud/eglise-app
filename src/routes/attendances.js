import { CORS, json, badRequest, notFound, getBody, requireId } from "../lib.js";
import { validate, validationError } from '../validate.js'
import { hasPermission, getMemberFromRequest } from "../auth.js";
import { route } from "../routes.js";

export const attendanceRoutes = [
  route("GET", "/api/attendances", async (request, env, params, url) => {
    const caller = await getMemberFromRequest(request, env);
    if (!caller) return json({ error: "Not authenticated" }, 401);
    if (!(await hasPermission(request, env, "schedule")) && caller.role !== "admin")
      return json({ error: "Forbidden" }, 403);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const size = Math.min(parseInt(url.searchParams.get("size") || "25", 10), 100);
    const offset = (page - 1) * size;
    const countRes = await env.DB.prepare("SELECT COUNT(*) as count FROM attendances").first();
    const totalCount = countRes?.count || 0;
    const attendances = await env.DB.prepare(`
      SELECT a.*, m.first_name, m.last_name, p.date as plan_date, p.time as plan_time
      FROM attendances a
      JOIN members m ON m.id = a.member_id
      JOIN plans p ON p.id = a.plan_id
      ORDER BY a.check_in_time DESC LIMIT ? OFFSET ?
    `).bind(size, offset).all();
    return json({ data: attendances.results, page, size, totalCount });
  }),

  route("POST", "/api/attendances", async (request, env) => {
    if (!(await hasPermission(request, env, "schedule")))
      return json({ error: "Forbidden" }, 403);
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON body");
    const attErr = validate({ plan_id: { required: true, type: 'integer' }, member_id: { required: true, type: 'integer' } }, body);
    if (attErr) return validationError(attErr);
    const existing = await env.DB.prepare("SELECT id FROM attendances WHERE plan_id = ? AND member_id = ?").bind(body.plan_id, body.member_id).first();
    if (existing) return badRequest("Already checked in for this service");
    const result = await env.DB.prepare("INSERT INTO attendances (plan_id, member_id, status, notes) VALUES (?, ?, ?, ?)").bind(body.plan_id, body.member_id, body.status || "present", body.notes || null).run();
    const attendance = await env.DB.prepare("SELECT a.*, m.first_name, m.last_name FROM attendances a JOIN members m ON m.id = a.member_id WHERE a.id = ?").bind(result.meta.last_row_id).first();
    return json(attendance, 201);
  }),

  route("GET", "/api/attendances/:id", async (request, env, params) => {
    const attendanceId = requireId({ id: params.id });
    if (!attendanceId) return badRequest("Invalid ID");
    const attendance = await env.DB.prepare("SELECT a.*, m.first_name, m.last_name, p.date as plan_date, p.time as plan_time FROM attendances a JOIN members m ON m.id = a.member_id JOIN plans p ON p.id = a.plan_id WHERE a.id = ?").bind(attendanceId).first();
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
    await env.DB.prepare("UPDATE attendances SET status=?, notes=? WHERE id=?").bind(body.status || null, body.notes || null, attendanceId).run();
    const attendance = await env.DB.prepare("SELECT a.*, m.first_name, m.last_name FROM attendances a JOIN members m ON m.id = a.member_id WHERE a.id = ?").bind(attendanceId).first();
    return json(attendance);
  }),

  route("DELETE", "/api/attendances/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "schedule")))
      return json({ error: "Forbidden" }, 403);
    const attendanceId = requireId({ id: params.id });
    if (!attendanceId) return badRequest("Invalid ID");
    await env.DB.prepare("DELETE FROM attendances WHERE id = ?").bind(attendanceId).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  route("GET", "/api/plans/:pid/attendances", async (request, env, params) => {
    const planId = requireId({ id: params.pid });
    if (!planId) return badRequest("Invalid plan ID");
    const attendances = await env.DB.prepare("SELECT a.*, m.first_name, m.last_name FROM attendances a JOIN members m ON m.id = a.member_id WHERE a.plan_id = ? ORDER BY a.check_in_time DESC").bind(planId).all();
    return json(attendances.results);
  }),
]
