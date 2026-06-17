// Teams & service types route handlers
import { CORS, json, badRequest, notFound, getBody, requireId } from "../lib.js";
import { validate, validationError } from "../validate.js";
import { hasPermission, getMemberFromRequest, requirePermission } from "../auth.js";
import { route } from "../routes.js";

export const teamsRoutes = [
  // ========================================
  // TEAMS
  // ========================================
  route("GET", "/api/teams", async (request, env, params, url) => {
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const size = Math.min(
      parseInt(url.searchParams.get("size") || "25", 10),
      100,
    );
    const offset = (page - 1) * size;
    // Get total count
    const countRes = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM teams",
    ).first();
    const totalCount = countRes?.count || 0;
    // Paginated fetch
    const result = await env.DB.prepare(
      `
      SELECT t.*, COUNT(tm.id) as member_count
      FROM teams t LEFT JOIN team_members tm ON tm.team_id = t.id
      GROUP BY t.id ORDER BY t.name ASC
      LIMIT ? OFFSET ?
    `,
    )
      .bind(size, offset)
      .all();
    return json({ data: result.results, page, size, totalCount });
  }),

  route("POST", "/api/teams", async (request, env) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const body = await getBody(request);
    if (!body) return badRequest("Corps JSON invalide");
    const err = validate({ name: { required: true, type: 'string', maxLength: 100 } }, body);
    if (err) return validationError(err);
    const result = await env.DB.prepare(
      "INSERT INTO teams (name, description, service_type) VALUES (?, ?, ?)",
    )
      .bind(body.name, body.description || null, body.service_type || null)
      .run();
    const newTeam = await env.DB.prepare("SELECT * FROM teams WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();
    return json(newTeam, 201);
  }),

  route("GET", "/api/teams/:id", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const team = await env.DB.prepare("SELECT * FROM teams WHERE id = ?")
      .bind(id)
      .first();
    if (!team) return notFound();
    const members = await env.DB.prepare(
      `
      SELECT m.*, tm.position FROM members m
      JOIN team_members tm ON tm.member_id = m.id
      WHERE tm.team_id = ? ORDER BY m.last_name ASC, m.first_name ASC
    `,
    )
      .bind(id)
      .all();
    return json({ ...team, members: members.results });
  }),

  route("PUT", "/api/teams/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const body = await getBody(request);
    if (!body) return badRequest("Corps JSON invalide");
    await env.DB.prepare(
      "UPDATE teams SET name=?, description=?, service_type=? WHERE id=?",
    )
      .bind(body.name, body.description || null, body.service_type || null, id)
      .run();
    const updated = await env.DB.prepare("SELECT * FROM teams WHERE id = ?")
      .bind(id)
      .first();
    return json(updated);
  }),

  route("DELETE", "/api/teams/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    await env.DB.prepare("DELETE FROM teams WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  route("POST", "/api/teams/:id/members", async (request, env, params) => {
    const teamId = requireId(params);
    if (!teamId) return badRequest("ID équipe invalide");
    const body = await getBody(request);
    if (!body || !body.member_id) return badRequest("member_id requis");
    // Prevent duplicate membership
    const exists = await env.DB.prepare(
      "SELECT id FROM team_members WHERE team_id = ? AND member_id = ?",
    )
      .bind(teamId, body.member_id)
      .first();
    if (exists) return json({ error: "Member already in team" }, 409);
    await env.DB.prepare(
      "INSERT INTO team_members (team_id, member_id, position) VALUES (?, ?, ?)",
    )
      .bind(teamId, body.member_id, body.position || null)
      .run();
    return new Response(null, { status: 201, headers: CORS });
  }),

  // Update team member (position)
  route("PUT", "/api/teams/:tid/members/:mid", async (request, env, params) => {
    const teamId = requireId({ id: params.tid });
    const memberId = requireId({ id: params.mid });
    if (!teamId || !memberId) return badRequest("ID invalide");
    const body = await getBody(request);
    if (!body) return badRequest("Corps JSON invalide");
    await env.DB.prepare(
      "UPDATE team_members SET position = ? WHERE team_id = ? AND member_id = ?",
    )
      .bind(body.position || null, teamId, memberId)
      .run();
    const updated = await env.DB.prepare(
      "SELECT m.*, tm.position FROM members m JOIN team_members tm ON tm.member_id = m.id WHERE tm.team_id = ? AND m.id = ?",
    )
      .bind(teamId, memberId)
      .first();
    return json(updated);
  }),

  route(
    "DELETE",
    "/api/teams/:tid/members/:mid",
    async (request, env, params) => {
      const teamId = requireId({ id: params.tid });
      const memberId = requireId({ id: params.mid });
      if (!teamId || !memberId) return badRequest("ID invalide");
      await env.DB.prepare(
        "DELETE FROM team_members WHERE team_id = ? AND member_id = ?",
      )
        .bind(teamId, memberId)
        .run();
      return new Response(null, { status: 204, headers: CORS });
    },
  ),

  // ========================================
  // SERVICE TYPES
  // ========================================
  route("GET", "/api/service-types", async (request, env) => {
    const result = await env.DB.prepare(
      "SELECT * FROM service_types ORDER BY name ASC",
    ).all();
    return json(result.results);
  }),
];
