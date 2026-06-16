import { json, badRequest, notFound, getBody, requireId, dbFirst, dbAll, CORS } from '../lib.js'
import { validate, validationError } from '../validate.js'
import { hasPermission, getMemberFromRequest, requirePermission } from '../auth.js'
import { route } from '../routes.js'

export const planTemplatesRoutes = [
  // ========================================
  // PLAN TEMPLATES
  // ========================================
  route("GET", "/api/plan-templates", async (request, env) => {
    const rows = await env.DB.prepare(
      `
        SELECT pt.*, COUNT(pti.id) as item_count
        FROM plan_templates pt
        LEFT JOIN plan_template_items pti ON pti.plan_template_id = pt.id
        GROUP BY pt.id ORDER BY pt.name ASC
      `,
    ).all();
    return json(rows.results);
  }),

  route("POST", "/api/plan-templates", async (request, env) => {
    const body = await getBody(request);
    const err = validate({ name: { required: true, type: 'string', maxLength: 200 }, service_type_id: { required: true, type: 'integer' } }, body);
    if (err) return validationError(err);
    const stmt = await env.DB.prepare(
      "INSERT INTO plan_templates (name, description, service_type_id) VALUES (?, ?, ?)",
    )
      .bind(body.name, body.description || null, body.service_type_id)
      .run();
    const created = await env.DB.prepare(
      "SELECT * FROM plan_templates WHERE id = ?",
    )
      .bind(stmt.meta.last_row_id)
      .first();
    return json(created, 201);
  }),

  route("GET", "/api/plan-templates/:id", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("Invalid ID");
    const template = await env.DB.prepare(
      "SELECT * FROM plan_templates WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!template) return notFound();
    const items = await env.DB.prepare(
      "SELECT * FROM plan_template_items WHERE plan_template_id = ? ORDER BY position ASC",
    )
      .bind(id)
      .all();
    template.items = items.results;
    return json(template);
  }),

  route("PUT", "/api/plan-templates/:id", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("Invalid ID");
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON");
    await env.DB.prepare(
      "UPDATE plan_templates SET name = COALESCE(?, name), description = COALESCE(?, description), service_type_id = COALESCE(?, service_type_id) WHERE id = ?",
    )
      .bind(
        body.name || null,
        body.description ?? null,
        body.service_type_id ?? null,
        id,
      )
      .run();
    const updated = await env.DB.prepare(
      "SELECT * FROM plan_templates WHERE id = ?",
    )
      .bind(id)
      .first();
    return json(updated);
  }),

  route("DELETE", "/api/plan-templates/:id", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("Invalid ID");
    await env.DB.prepare("DELETE FROM plan_templates WHERE id = ?")
      .bind(id)
      .run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // Plan template items
  route(
    "GET",
    "/api/plan-templates/:id/items",
    async (request, env, params) => {
      const id = requireId(params);
      if (!id) return badRequest("Invalid ID");
      const items = await env.DB.prepare(
        "SELECT * FROM plan_template_items WHERE plan_template_id = ? ORDER BY position ASC",
      )
        .bind(id)
        .all();
      return json(items.results);
    },
  ),

  route(
    "POST",
    "/api/plan-templates/:id/items",
    async (request, env, params) => {
      if (!(await hasPermission(request, env, "schedule")))
        return json({ error: "Forbidden" }, 403);
      const templateId = requireId(params);
      if (!templateId) return badRequest("Invalid template ID");
      const body = await getBody(request);
      const ptiErr = validate({ type: { required: true, type: 'string', maxLength: 50 }, title: { required: true, type: 'string', maxLength: 200 } }, body);
      if (ptiErr) return validationError(ptiErr);
      const maxPos = await env.DB.prepare(
        "SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM plan_template_items WHERE plan_template_id = ?",
      )
        .bind(templateId)
        .first();
      const stmt = await env.DB.prepare(
        "INSERT INTO plan_template_items (plan_template_id, type, title, description, position, length_minutes, arrangement_id, transposed_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
        .bind(
          templateId,
          body.type,
          body.title,
          body.description || null,
          body.position ?? maxPos.next_pos,
          body.length_minutes || null,
          body.arrangement_id || null,
          body.transposed_key || null,
        )
        .run();
      const created = await env.DB.prepare(
        "SELECT * FROM plan_template_items WHERE id = ?",
      )
        .bind(stmt.meta.last_row_id)
        .first();
      return json(created, 201);
    },
  ),

  route("PUT", "/api/plan-template-items/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "schedule")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("Invalid ID");
    const body = await getBody(request);
    if (!body) return badRequest("Invalid JSON");
    await env.DB.prepare(
      `UPDATE plan_template_items SET
        type = COALESCE(?, type), title = COALESCE(?, title), description = COALESCE(?, description),
        position = COALESCE(?, position), length_minutes = COALESCE(?, length_minutes),
        arrangement_id = COALESCE(?, arrangement_id), transposed_key = COALESCE(?, transposed_key)
        WHERE id = ?`,
    )
      .bind(
        body.type || null,
        body.title || null,
        body.description ?? null,
        body.position ?? null,
        body.length_minutes ?? null,
        body.arrangement_id ?? null,
        body.transposed_key ?? null,
        id,
      )
      .run();
    const updated = await env.DB.prepare(
      "SELECT * FROM plan_template_items WHERE id = ?",
    )
      .bind(id)
      .first();
    return json(updated);
  }),

  route(
    "DELETE",
    "/api/plan-template-items/:id",
    async (request, env, params) => {
      if (!(await hasPermission(request, env, "schedule")))
        return json({ error: "Forbidden" }, 403);
      const id = requireId(params);
      if (!id) return badRequest("Invalid ID");
      await env.DB.prepare("DELETE FROM plan_template_items WHERE id = ?")
        .bind(id)
        .run();
      return new Response(null, { status: 204, headers: CORS });
    },
  ),

  // Apply template: create a plan from a template
  route(
    "POST",
    "/api/plan-templates/:id/apply",
    async (request, env, params) => {
      const templateId = requireId(params);
      if (!templateId) return badRequest("Invalid template ID");
      const template = await env.DB.prepare(
        "SELECT * FROM plan_templates WHERE id = ?",
      )
        .bind(templateId)
        .first();
      if (!template) return notFound("Template not found");
      const body = await getBody(request);
      if (!body || !body.date) return badRequest("date required");
      // Create the plan
      const planStmt = await env.DB.prepare(
        "INSERT INTO plans (service_type_id, date, time, theme, notes, status) VALUES (?, ?, ?, ?, ?, ?)",
      )
        .bind(
          template.service_type_id,
          body.date,
          body.time || null,
          body.theme || null,
          body.notes || null,
          "planned",
        )
        .run();
      const planId = planStmt.meta.last_row_id;
      // Copy items
      const items = await env.DB.prepare(
        "SELECT * FROM plan_template_items WHERE plan_template_id = ? ORDER BY position ASC",
      )
        .bind(templateId)
        .all();
      for (const item of items.results) {
        await env.DB.prepare(
          "INSERT INTO plan_items (plan_id, type, title, description, position, length_minutes) VALUES (?, ?, ?, ?, ?, ?)",
        )
          .bind(
            planId,
            item.type,
            item.title,
            item.description,
            item.position,
            item.length_minutes,
          )
          .run();
        // If song item with arrangement, link it
        if (item.type === "song" && item.arrangement_id) {
          const planItemId = (
            await env.DB.prepare(
              "SELECT id FROM plan_items WHERE plan_id = ? ORDER BY id DESC LIMIT 1",
            )
              .bind(planId)
              .first()
          ).id;
          await env.DB.prepare(
            "INSERT INTO plan_songs (plan_item_id, arrangement_id, transposed_key) VALUES (?, ?, ?)",
          )
            .bind(planItemId, item.arrangement_id, item.transposed_key || null)
            .run();
        }
      }
      const plan = await env.DB.prepare("SELECT * FROM plans WHERE id = ?")
        .bind(planId)
        .first();
      return json(plan, 201);
    },
  ),
]
