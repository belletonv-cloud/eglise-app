import { route } from "../routes.js";
import { json, getBody, badRequest, requireId, notFound, CORS } from "../lib.js";
import { hasPermission, getMemberFromRequest } from "../auth.js";

// ========================================
// SONDAGES (Polls)
// ========================================
export const pollsRoutes = [
  route("GET", "/api/polls", async (request, env, params, url) => {
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const size = Math.min(
      parseInt(url.searchParams.get("size") || "25", 10),
      100,
    );
    const offset = (page - 1) * size;
    // Get total count
    const countRes = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM polls",
    ).first();
    const totalCount = countRes?.count || 0;
    // Paginated fetch
    const rows = await env.DB.prepare(
      `
      SELECT p.*, (SELECT COUNT(*) FROM poll_votes pv WHERE pv.poll_id = p.id) as vote_count
      FROM polls p ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `,
    )
      .bind(size, offset)
      .all();
    const polls = rows.results;
    const member = await getMemberFromRequest(request, env);
    for (const poll of polls) {
      poll.options = (
        await env.DB.prepare(
          "SELECT * FROM poll_options WHERE poll_id = ? ORDER BY position ASC",
        )
          .bind(poll.id)
          .all()
      ).results;
      if (member) {
        const myVotes = await env.DB.prepare(
          "SELECT poll_option_id FROM poll_votes WHERE poll_id = ? AND member_id = ?",
        )
          .bind(poll.id, member.id)
          .all();
        poll.my_votes = myVotes.results.map((v) => v.poll_option_id);
      }
    }
    return json({ data: polls, page, size, totalCount });
  }),

  route("POST", "/api/polls", async (request, env) => {
    if (!(await hasPermission(request, env, "edit_announcements")))
      return json({ error: "Forbidden" }, 403);
    if (!(await hasPermission(request, env, "edit_members")))
      return json({ error: "Forbidden" }, 403);
    const body = await getBody(request);
    if (!body || !body.question) return badRequest("question required");
    const maxVotes = body.max_votes || 1;
    const expiresAt = body.expires_at || null;
    const result = await env.DB.prepare(
      "INSERT INTO polls (question, max_votes, expires_at) VALUES (?, ?, ?)",
    )
      .bind(body.question, maxVotes, expiresAt)
      .run();
    const poll = await env.DB.prepare("SELECT * FROM polls WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();
    return json(poll, 201);
  }),

  route("DELETE", "/api/polls/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "edit_announcements")))
      return json({ error: "Forbidden" }, 403);
    if (!(await hasPermission(request, env, "edit_members")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    await env.DB.prepare("DELETE FROM polls WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  route("POST", "/api/polls/:id/options", async (request, env, params) => {
    if (!(await hasPermission(request, env, "edit_members")))
      return json({ error: "Forbidden" }, 403);
    const pollId = requireId(params);
    if (!pollId) return badRequest("ID sondage invalide");
    const body = await getBody(request);
    if (!body || !body.label) return badRequest("label required");
    const maxPos = await env.DB.prepare(
      "SELECT COALESCE(MAX(position), 0) + 1 as next FROM poll_options WHERE poll_id = ?",
    )
      .bind(pollId)
      .first();
    const result = await env.DB.prepare(
      "INSERT INTO poll_options (poll_id, label, position) VALUES (?, ?, ?)",
    )
      .bind(pollId, body.label, body.position ?? maxPos.next)
      .run();
    const opt = await env.DB.prepare("SELECT * FROM poll_options WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();
    return json(opt, 201);
  }),

  route("DELETE", "/api/poll-options/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "edit_members")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    await env.DB.prepare("DELETE FROM poll_options WHERE id = ?")
      .bind(id)
      .run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  route("POST", "/api/polls/:id/vote", async (request, env, params) => {
    const pollId = requireId(params);
    if (!pollId) return badRequest("ID sondage invalide");
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: "Not authenticated" }, 401);
    const body = await getBody(request);
    if (!body || !body.option_id) return badRequest("option_id required");

    const poll = await env.DB.prepare("SELECT * FROM polls WHERE id = ?")
      .bind(pollId)
      .first();
    if (!poll) return notFound("Sondage non trouvé");
    if (poll.expires_at && poll.expires_at < new Date().toISOString())
      return badRequest("Sondage expiré");

    const myVotes = await env.DB.prepare(
      "SELECT id FROM poll_votes WHERE poll_id = ? AND member_id = ?",
    )
      .bind(pollId, member.id)
      .all();
    if (myVotes.results.length >= poll.max_votes)
      return badRequest(`Maximum ${poll.max_votes} vote(s) atteint`);

    const existing = await env.DB.prepare(
      "SELECT id FROM poll_votes WHERE poll_id = ? AND member_id = ? AND poll_option_id = ?",
    )
      .bind(pollId, member.id, body.option_id)
      .first();
    if (existing) return badRequest("Tu as déjà voté pour cette option");

    await env.DB.prepare(
      "INSERT INTO poll_votes (poll_id, member_id, poll_option_id) VALUES (?, ?, ?)",
    )
      .bind(pollId, member.id, body.option_id)
      .run();
    return json({ success: true }, 201);
  }),

  route("DELETE", "/api/polls/:id/vote", async (request, env, params) => {
    const pollId = requireId(params);
    if (!pollId) return badRequest("ID sondage invalide");
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: "Not authenticated" }, 401);
    const body = await getBody(request);
    if (!body || !body.option_id) return badRequest("option_id required");
    await env.DB.prepare(
      "DELETE FROM poll_votes WHERE poll_id = ? AND member_id = ? AND poll_option_id = ?",
    )
      .bind(pollId, member.id, body.option_id)
      .run();
    return json({ success: true });
  }),
];
