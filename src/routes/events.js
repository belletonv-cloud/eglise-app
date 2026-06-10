import { route } from "../routes.js";
import { json, getBody, badRequest, requireId, notFound } from "../lib.js";

// ========================================
// CHURCH EVENTS (external scraped events)
// ========================================
export const eventsRoutes = [
  route("POST", "/api/church-events", async (request, env, params) => {
    const body = await getBody(request);
    if (!body || !body.title || !body.start_date)
      return badRequest("title et start_date requis");
    const result = await env.DB.prepare(
      `INSERT INTO church_events (title, description, location, start_date, start_time, end_date, end_time, color, repeat_period, image_url, rsvp_enabled, source, status, link, ticket_url, emoji)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        body.title,
        body.description || null,
        body.location || null,
        body.start_date,
        body.start_time || null,
        body.end_date || null,
        body.end_time || null,
        body.color || "",
        body.repeat_period || null,
        body.image_url || null,
        body.rsvp_enabled ? 1 : 0,
        body.source || null,
        body.status || "active",
        body.link || null,
        body.ticket_url || null,
        body.emoji || null,
      )
      .run();
    const id = result.meta?.last_row_id;
    const created = await env.DB.prepare(
      "SELECT * FROM church_events WHERE id = ?",
    )
      .bind(id)
      .first();
    return json(created, 201);
  }),

  route("GET", "/api/church-events", async (request, env, params, url) => {
    const source = url.searchParams.get("source");
    const includeExceptions =
      url.searchParams.get("include_exceptions") === "1";
    const fromDate = url.searchParams.get("from");
    const toDate = url.searchParams.get("to");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const size = Math.min(
      parseInt(url.searchParams.get("size") || "25", 10),
      100,
    );
    const offset = (page - 1) * size;
    let where = "",
      binds = [],
      conditions = [];
    if (source) {
      conditions.push("ce.source = ?");
      binds.push(source);
    }
    if (fromDate) {
      conditions.push("ce.start_date >= ?");
      binds.push(fromDate);
    }
    if (toDate) {
      conditions.push("ce.start_date <= ?");
      binds.push(toDate);
    }
    if (conditions.length > 0) where = "WHERE " + conditions.join(" AND ");
    // Count total
    const countRes = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM church_events ce ${where}`,
    )
      .bind(...binds)
      .first();
    const totalCount = countRes?.count || 0;
    // Paginated fetch
    let query = `SELECT ce.*,
      (SELECT COUNT(*) FROM church_event_exceptions cee WHERE cee.event_id = ce.id) as exception_count
      FROM church_events ce ${where} ORDER BY ce.start_date ASC, ce.start_time ASC
      LIMIT ? OFFSET ?`;
    const rows = await env.DB.prepare(query)
      .bind(...binds, size, offset)
      .all();

    if (includeExceptions) {
      // Fetch all exceptions in a single query and attach to events
      const eventIds = rows.results.map((r) => r.id);
      let exceptions = [];
      if (eventIds.length > 0) {
        const placeholders = eventIds.map(() => "?").join(",");
        const exQuery = `SELECT * FROM church_event_exceptions WHERE event_id IN (${placeholders}) ORDER BY exception_date ASC`;
        const exRows = await env.DB.prepare(exQuery)
          .bind(...eventIds)
          .all();
        exceptions = exRows.results;
      }
      // Build a map: event_id -> exceptions[]
      const exMap = {};
      for (const ex of exceptions) {
        if (!exMap[ex.event_id]) exMap[ex.event_id] = [];
        exMap[ex.event_id].push(ex);
      }
      const resultsWithExceptions = rows.results.map((ev) => ({
        ...ev,
        exceptions: exMap[ev.id] || [],
      }));
      return json(resultsWithExceptions);
    }

    return json(rows.results);
  }),

  route("GET", "/api/church-events/:id", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const event = await env.DB.prepare(
      "SELECT * FROM church_events WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!event) return notFound();
    const exceptions = await env.DB.prepare(
      "SELECT * FROM church_event_exceptions WHERE event_id = ? ORDER BY created_at DESC",
    )
      .bind(id)
      .all();
    return json({ ...event, exceptions: exceptions.results });
  }),

  route(
    "GET",
    "/api/church-events/:id/exceptions",
    async (request, env, params) => {
      const id = requireId(params);
      if (!id) return badRequest("ID invalide");
      const exceptions = await env.DB.prepare(
        "SELECT * FROM church_event_exceptions WHERE event_id = ? ORDER BY exception_date ASC",
      )
        .bind(id)
        .all();
      return json(exceptions.results);
    },
  ),

  route("PUT", "/api/church-events/:id", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const body = await getBody(request);
    if (!body) return badRequest("Corps JSON invalide");

    const updates = [];
    const values = [];
    if (body.status !== undefined) {
      updates.push("status = ?");
      values.push(body.status);
    }
    if (body.repeat_period !== undefined) {
      updates.push("repeat_period = ?");
      values.push(body.repeat_period || null);
    }
    if (body.title !== undefined) {
      updates.push("title = ?");
      values.push(body.title);
    }
    if (body.description !== undefined) {
      updates.push("description = ?");
      values.push(body.description || null);
    }
    if (body.location !== undefined) {
      updates.push("location = ?");
      values.push(body.location || null);
    }
    if (body.start_date !== undefined) {
      updates.push("start_date = ?");
      values.push(body.start_date);
    }
    if (body.start_time !== undefined) {
      updates.push("start_time = ?");
      values.push(body.start_time || null);
    }
    if (body.end_date !== undefined) {
      updates.push("end_date = ?");
      values.push(body.end_date || null);
    }
    if (body.end_time !== undefined) {
      updates.push("end_time = ?");
      values.push(body.end_time || null);
    }
    if (body.image_url !== undefined) {
      updates.push("image_url = ?");
      values.push(body.image_url || null);
    }
    if (body.emoji !== undefined) {
      updates.push("emoji = ?");
      values.push(body.emoji || null);
    }
    if (body.link !== undefined) {
      updates.push("link = ?");
      values.push(body.link || null);
    }
    if (body.ticket_url !== undefined) {
      updates.push("ticket_url = ?");
      values.push(body.ticket_url || null);
    }
    if (body.source !== undefined) {
      updates.push("source = ?");
      values.push(body.source || null);
    }
    if (body.rsvp_enabled !== undefined) {
      updates.push("rsvp_enabled = ?");
      values.push(body.rsvp_enabled ? 1 : 0);
    }
    if (body.color !== undefined) {
      updates.push("color = ?");
      values.push(body.color || "");
    }

    if (updates.length === 0) return badRequest("Aucun champ à mettre à jour");
    values.push(id);
    await env.DB.prepare(
      `UPDATE church_events SET ${updates.join(", ")} WHERE id = ?`,
    )
      .bind(...values)
      .run();
    const updated = await env.DB.prepare(
      "SELECT * FROM church_events WHERE id = ?",
    )
      .bind(id)
      .first();
    return json(updated);
  }),

  route("DELETE", "/api/church-events/:id", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    await env.DB.prepare(
      "DELETE FROM church_event_exceptions WHERE event_id = ?",
    )
      .bind(id)
      .run();
    await env.DB.prepare("DELETE FROM church_events WHERE id = ?")
      .bind(id)
      .run();
    return new Response(null, { status: 204 });
  }),

  route(
    "POST",
    "/api/church-events/:id/exceptions",
    async (request, env, params) => {
      const id = requireId(params);
      if (!id) return badRequest("ID invalide");
      const body = await getBody(request);
      if (!body || !body.type)
        return badRequest(
          "type requis (cancelled, moved, periodicity_changed)",
        );

      await env.DB.prepare(
        "INSERT INTO church_event_exceptions (event_id, exception_date, type, new_date, new_repeat_period, reason) VALUES (?, ?, ?, ?, ?, ?)",
      )
        .bind(
          id,
          body.exception_date || null,
          body.type,
          body.new_date || null,
          body.new_repeat_period || null,
          body.reason || null,
        )
        .run();

      return json({ success: true });
    },
  ),

  route(
    "DELETE",
    "/api/church-events/:id/exceptions/:eid",
    async (request, env, params) => {
      const id = requireId(params);
      const eid = parseInt(params.eid, 10);
      if (!id || isNaN(eid)) return badRequest("ID invalide");
      await env.DB.prepare(
        "DELETE FROM church_event_exceptions WHERE id = ? AND event_id = ?",
      )
        .bind(eid, id)
        .run();
      return json({ success: true });
    },
  ),
];
