import { route } from "../routes.js";
import { json, badRequest, getBody, requireId, CORS } from "../lib.js";
import { hasPermission } from "../auth.js";
import { validate, validationError } from '../validate.js'

// ========================================
// WEBHOOKS
// ========================================
// CRUD for webhook configurations
export const webhooksRoutes = [
  route("GET", "/api/webhooks", async (request, env) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const rows = await env.DB.prepare(
      "SELECT * FROM webhooks ORDER BY created_at DESC",
    ).all();
    return json(rows.results);
  }),

  route("POST", "/api/webhooks", async (request, env) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const body = await getBody(request);
    const whErr = validate({ url: { required: true, type: 'string', maxLength: 500, pattern: /^https?:\/\// }, events: { required: true, type: 'array' } }, body);
    if (whErr) return validationError(whErr);
    const result = await env.DB.prepare(
      "INSERT INTO webhooks (url, events, secret, label) VALUES (?, ?, ?, ?)",
    )
      .bind(
        body.url,
        JSON.stringify(body.events),
        body.secret || null,
        body.label || null,
      )
      .run();
    const created = await env.DB.prepare("SELECT * FROM webhooks WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();
    return json(created, 201);
  }),

  route("PUT", "/api/webhooks/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const body = await getBody(request);
    if (!body) return badRequest("Corps requis");
    const whuErr = validate({ url: { type: 'string', maxLength: 500, pattern: /^https?:\/\// }, events: { type: 'array' } }, body);
    if (whuErr) return validationError(whuErr);
    await env.DB.prepare(
      "UPDATE webhooks SET url = COALESCE(?, url), events = COALESCE(?, events), secret = COALESCE(?, secret), label = COALESCE(?, label) WHERE id = ?",
    )
      .bind(
        body.url || null,
        body.events ? JSON.stringify(body.events) : null,
        body.secret ?? null,
        body.label ?? null,
        id,
      )
      .run();
    const updated = await env.DB.prepare("SELECT * FROM webhooks WHERE id = ?")
      .bind(id)
      .first();
    return json(updated);
  }),

  route("DELETE", "/api/webhooks/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    await env.DB.prepare("DELETE FROM webhooks WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // Webhook logs
  route("GET", "/api/webhook-logs", async (request, env, params, url) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const page = parseInt(url.searchParams.get("page") || "1", 10) || 1;
    const per = Math.min(
      100,
      parseInt(url.searchParams.get("per") || "50", 10) || 50,
    );
    const offset = (page - 1) * per;
    const rows = await env.DB.prepare(
      "SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT ? OFFSET ?",
    )
      .bind(per, offset)
      .all();
    const total = await env.DB.prepare(
      "SELECT COUNT(*) as c FROM webhook_logs",
    ).first();
    return json({ rows: rows.results, total: total.c, page, per });
  }),

  // Generic incoming webhook (for Zapier/Make/Calendly to push data)
  route(
    "POST",
    "/api/webhook/incoming/:token",
    async (request, env, params) => {
      const token = params.token;
      const wh = await env.DB.prepare("SELECT * FROM webhooks WHERE secret = ?")
        .bind(token)
        .first();
      if (!wh) return json({ error: "Invalid token" }, 401);

      let body;
      try {
        body = await request.json();
      } catch (e) {
        try {
          body = await request.text();
        } catch (ee) {
          console.error("webhook incoming: failed to parse body", e, ee);
          body = "";
        }
      }

      // webhook_logs table created by migrations
      await env.DB.prepare(
        "INSERT INTO webhook_logs (webhook_id, event, status, response) VALUES (?, ?, ?, ?)",
      )
        .bind(
          wh.id,
          "incoming",
          200,
          typeof body === "string"
            ? body.slice(0, 500)
            : JSON.stringify(body).slice(0, 500),
        )
        .run();

      // For Zapier/Make: just acknowledge receipt
      return json({ success: true, received: true });
    },
  ),
];
