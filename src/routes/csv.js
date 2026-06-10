import { route } from "../routes.js";
import { json, getBody, badRequest, toCsv, CORS } from "../lib.js";
import { hasPermission, getMemberFromRequest } from "../auth.js";

// ========================================
// IMPORT / EXPORT CSV
// ========================================
export const csvRoutes = [
  route("GET", "/api/export/:entity", async (request, env, params) => {
    // Export contains PII — require manage_members permission
    const caller = await getMemberFromRequest(request, env);
    if (!caller) return json({ error: "Not authenticated" }, 401);
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const entity = params.entity;
    let rows;
    let columns;
    let filename;

    if (entity === "members") {
      rows = await env.DB.prepare(
        "SELECT id, first_name, last_name, email, phone, membership_type, notes FROM members ORDER BY last_name ASC",
      ).all();
      columns = [
        "id",
        "first_name",
        "last_name",
        "email",
        "phone",
        "membership_type",
        "notes",
      ];
      filename = "membres.csv";
    } else if (entity === "songs") {
      rows = await env.DB.prepare(
        `
        SELECT s.id, s.title, s.author, s.ccli_number, s.copyright, a.name as arrangement_name, a.key, a.tempo
        FROM songs s LEFT JOIN arrangements a ON a.song_id = s.id ORDER BY s.title ASC
      `,
      ).all();
      columns = [
        "id",
        "title",
        "author",
        "ccli_number",
        "copyright",
        "arrangement_name",
        "key",
        "tempo",
      ];
      filename = "chants.csv";
    } else if (entity === "plans") {
      rows = await env.DB.prepare(
        `
        SELECT p.id, p.date, p.time, p.theme, p.status, st.name as service_type
        FROM plans p LEFT JOIN service_types st ON st.id = p.service_type_id ORDER BY p.date DESC
      `,
      ).all();
      columns = ["id", "date", "time", "theme", "status", "service_type"];
      filename = "services.csv";
    } else {
      return badRequest("Entité invalide. Utilise members, songs, ou plans");
    }

    const csv = toCsv(rows.results, columns);
    return new Response(csv, {
      headers: {
        ...CORS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }),

  route("POST", "/api/import/:entity", async (request, env, params) => {
    if (!(await hasPermission(request, env, "edit_members")))
      return json({ error: "Forbidden" }, 403);
    const entity = params.entity;
    let body;
    try {
      body = await request.text();
    } catch (e) {
      console.error("import: failed to read request body", e);
      return badRequest("Corps requis");
    }
    const lines = body.split("\n").filter((l) => l.trim());
    if (lines.length < 2)
      return badRequest("CSV doit avoir un en-tête et au moins une ligne");

    const headers = lines[0].split(",").map((h) => h.trim());
    let imported = 0;
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map((v) =>
          v
            .trim()
            .replace(/^"(.*)"$/, "$1")
            .replace(/""/g, '"'),
        );
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || null;
        });

        if (entity === "members") {
          await env.DB.prepare(
            "INSERT OR IGNORE INTO members (first_name, last_name, email, phone, membership_type, notes) VALUES (?, ?, ?, ?, ?, ?)",
          )
            .bind(
              row.first_name,
              row.last_name,
              row.email || null,
              row.phone || null,
              row.membership_type || "guest",
              row.notes || null,
            )
            .run();
          imported++;
        } else if (entity === "songs") {
          await env.DB.prepare(
            "INSERT OR IGNORE INTO songs (title, author, ccli_number, copyright, notes) VALUES (?, ?, ?, ?, ?)",
          )
            .bind(
              row.title,
              row.author || null,
              row.ccli_number || null,
              row.copyright || null,
              row.notes || null,
            )
            .run();
          imported++;
        } else {
          return badRequest("Entité invalide. Utilise members ou songs");
        }
      } catch (e) {
        errors.push({ line: i + 1, error: e.message });
      }
    }

    return json({ imported, errors: errors.length ? errors : undefined });
  }),

  // API logs view (admin only)
  route("GET", "/api/logs", async (request, env, params, url) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);

    const page = parseInt(url.searchParams.get("page") || "1", 10) || 1;
    const per = Math.min(
      100,
      parseInt(url.searchParams.get("per") || "50", 10) || 50,
    );
    const offset = (page - 1) * per;

    const statusClass = url.searchParams.get("status_class"); // "2" | "4" | "5"
    const minDuration =
      parseInt(url.searchParams.get("min_duration") || "0", 10) || 0;

    const where = [];
    const binds = [];

    if (statusClass === "2") where.push("status BETWEEN 200 AND 299");
    if (statusClass === "4") where.push("status BETWEEN 400 AND 499");
    if (statusClass === "5") where.push("status >= 500");
    if (minDuration > 0) {
      where.push("duration >= ?");
      binds.push(minDuration);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await env.DB.prepare(
      `SELECT * FROM api_logs ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
      .bind(...binds, per, offset)
      .all();

    const total = await env.DB.prepare(
      `SELECT COUNT(*) as c FROM api_logs ${whereSql}`,
    )
      .bind(...binds)
      .first();

    return json({ rows: rows.results, total: total.c, page, per });
  }),

  route("DELETE", "/api/logs", async (request, env) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    await env.DB.prepare(
      "DELETE FROM api_logs WHERE created_at < datetime('now', '-7 days')",
    ).run();
    return json({ success: true });
  }),
];
