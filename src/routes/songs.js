// Songs & arrangements route handlers
import { json, badRequest, notFound, getBody, requireId } from "../lib.js";
import { validate, validationError } from "../validate.js";
import { hasPermission } from "../auth.js";
import { route } from "../routes.js";

export const songsRoutes = [
  route("GET", "/api/songs", async (request, env) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const size = Math.min(
      parseInt(url.searchParams.get("size") || "200", 10),
      500,
    );
    const offset = (page - 1) * size;
    const where = q ? "WHERE s.title LIKE ? OR s.author LIKE ?" : "";
    const binds = q ? [`%${q}%`, `%${q}%`] : [];
    const total =
      (
        await env.DB.prepare(`SELECT COUNT(*) as c FROM songs s ${where}`)
          .bind(...binds)
          .first()
      )?.c || 0;
    const stmt = await env.DB.prepare(
      `
      SELECT s.*,
             COUNT(a.id) as arrangement_count,
             MAX(CASE WHEN a.chord_chart IS NOT NULL AND TRIM(a.chord_chart) != '' THEN 1 ELSE 0 END) as has_chord_chart,
             (
               SELECT COALESCE(
                 NULLIF(TRIM(a2.key), ''),
                 (SELECT NULLIF(TRIM(ps2.transposed_key), '')
                  FROM plan_songs ps2
                  JOIN plan_items pi2 ON pi2.id = ps2.plan_item_id
                  WHERE ps2.arrangement_id = a2.id AND ps2.transposed_key IS NOT NULL
                  ORDER BY pi2.id DESC LIMIT 1)
               )
               FROM arrangements a2
               WHERE a2.song_id = s.id
               ORDER BY a2.id ASC
               LIMIT 1
             ) as primary_key,
             (
               SELECT MAX(p.date)
               FROM plan_songs ps
               JOIN plan_items pi ON pi.id = ps.plan_item_id
               JOIN plans p ON p.id = pi.plan_id
               JOIN arrangements ax ON ax.id = ps.arrangement_id
               WHERE ax.song_id = s.id
             ) as last_used,
             COALESCE(s.pco_updated_at, MAX(a.pco_updated_at), s.created_at) as last_edited
      FROM songs s LEFT JOIN arrangements a ON a.song_id = s.id
      ${where}
      GROUP BY s.id ORDER BY s.title ASC
      LIMIT ? OFFSET ?
    `,
    )
      .bind(...binds, size, offset)
      .all();
    // Return flat array when no pagination params supplied (backwards compat)
    const paginated =
      url.searchParams.has("page") || url.searchParams.has("size");
    if (paginated)
      return json({ data: stmt.results, page, size, totalCount: total });
    return json(stmt.results);
  }),

  route("POST", "/api/songs", async (request, env) => {
    if (!(await hasPermission(request, env, "edit_music")))
      return json({ error: "Forbidden" }, 403);
    const body = await getBody(request);
    if (!body) return badRequest("Corps JSON invalide");
    const err = validate({ title: { required: true, type: 'string', maxLength: 200 } }, body);
    if (err) return validationError(err);
    const result = await env.DB.prepare(
      "INSERT INTO songs (title, author, ccli_number, copyright, themes, notes) VALUES (?, ?, ?, ?, ?, ?)",
    )
      .bind(
        body.title,
        body.author || null,
        body.ccli_number || null,
        body.copyright || null,
        body.themes || null,
        body.notes || null,
      )
      .run();
    const song = await env.DB.prepare("SELECT * FROM songs WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();
    return json(song, 201);
  }),

  route("DELETE", "/api/songs/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "edit_music")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const song = await env.DB.prepare("SELECT id FROM songs WHERE id = ?")
      .bind(id)
      .first();
    if (!song) return notFound();
    await env.DB.prepare("DELETE FROM songs WHERE id = ?").bind(id).run();
    return json({ ok: true });
  }),

  route("GET", "/api/songs/:id", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const song = await env.DB.prepare("SELECT * FROM songs WHERE id = ?")
      .bind(id)
      .first();
    if (!song) return notFound();
    const arrangements = await env.DB.prepare(
      "SELECT * FROM arrangements WHERE song_id = ? ORDER BY name ASC",
    )
      .bind(id)
      .all();
    // Normalize empty chord_charts to null for cleaner frontend handling
    const normalizedArrangements = arrangements.results.map((a) => ({
      ...a,
      chord_chart:
        a.chord_chart && a.chord_chart.trim().length > 0 ? a.chord_chart : null,
    }));
    return json({ ...song, arrangements: normalizedArrangements });
  }),

  route("PUT", "/api/arrangements/:id", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const body = await getBody(request);
    if (!body) return badRequest("Corps JSON invalide");

    const existing = await env.DB.prepare(
      "SELECT id FROM arrangements WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!existing) return notFound();

    const updates = [];
    const values = [];

    if (body.name !== undefined) {
      updates.push("name = ?");
      values.push(body.name);
    }
    if (body.key !== undefined) {
      updates.push("key = ?");
      values.push(body.key);
    }
    if (body.tempo !== undefined) {
      updates.push("tempo = ?");
      values.push(body.tempo);
    }
    if (body.chord_chart !== undefined) {
      updates.push("chord_chart = ?");
      values.push(body.chord_chart);
    }

    if (updates.length === 0) return badRequest("Aucun champ à mettre à jour");

    values.push(id);
    await env.DB.prepare(
      `UPDATE arrangements SET ${updates.join(", ")} WHERE id = ?`,
    )
      .bind(...values)
      .run();

    const updated = await env.DB.prepare(
      "SELECT * FROM arrangements WHERE id = ?",
    )
      .bind(id)
      .first();
    return json(updated);
  }),
];
