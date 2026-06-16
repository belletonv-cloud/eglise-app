import { route } from "../routes.js";
import { getBody, requireId, badRequest, json, CORS } from "../lib.js";
import { validate, validationError } from '../validate.js'

// ========================================
// CHECKLIST PAR POSTE
// ========================================
export const checklistRoutes = [
  route(
    "GET",
    "/api/checklist-templates",
    async (request, env, params, url) => {
      const serviceTypeId = url.searchParams.get("service_type_id");
      let rows;
      if (serviceTypeId) {
        rows = await env.DB.prepare(
          "SELECT * FROM checklist_templates WHERE service_type_id = ? ORDER BY position ASC",
        )
          .bind(Number(serviceTypeId))
          .all();
      } else {
        rows = await env.DB.prepare(
          "SELECT ct.*, st.name as service_type_name FROM checklist_templates ct LEFT JOIN service_types st ON st.id = ct.service_type_id ORDER BY ct.label ASC",
        ).all();
      }
      const templates = rows.results;
      for (const t of templates) {
        const items = await env.DB.prepare(
          "SELECT * FROM checklist_template_items WHERE checklist_id = ? ORDER BY position ASC",
        )
          .bind(t.id)
          .all();
        t.items = items.results;
      }
      return json(templates);
    },
  ),

  route("POST", "/api/checklist-templates", async (request, env) => {
    const body = await getBody(request);
    const ctErr = validate({ position: { required: true, type: 'integer' }, label: { required: true, type: 'string', maxLength: 200 } }, body)
    if (ctErr) return validationError(ctErr)
    const result = await env.DB.prepare(
      "INSERT INTO checklist_templates (service_type_id, position, label) VALUES (?, ?, ?)",
    )
      .bind(body.service_type_id || null, body.position, body.label)
      .run();
    const created = await env.DB.prepare(
      "SELECT * FROM checklist_templates WHERE id = ?",
    )
      .bind(result.meta.last_row_id)
      .first();
    return json(created, 201);
  }),

  route(
    "DELETE",
    "/api/checklist-templates/:id",
    async (request, env, params) => {
      const id = requireId(params);
      if (!id) return badRequest("ID invalide");
      await env.DB.prepare("DELETE FROM checklist_templates WHERE id = ?")
        .bind(id)
        .run();
      return new Response(null, { status: 204, headers: CORS });
    },
  ),

  // Checklist template items
  route(
    "POST",
    "/api/checklist-templates/:id/items",
    async (request, env, params) => {
      const checklistId = requireId(params);
      if (!checklistId) return badRequest("ID invalide");
      const body = await getBody(request);
      const itemErr = validate({ label: { required: true, type: 'string', maxLength: 200 } }, body)
      if (itemErr) return validationError(itemErr)
      const maxPos = await env.DB.prepare(
        "SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM checklist_template_items WHERE checklist_id = ?",
      )
        .bind(checklistId)
        .first();
      const result = await env.DB.prepare(
        "INSERT INTO checklist_template_items (checklist_id, label, position) VALUES (?, ?, ?)",
      )
        .bind(checklistId, body.label, body.position ?? maxPos.next_pos)
        .run();
      const created = await env.DB.prepare(
        "SELECT * FROM checklist_template_items WHERE id = ?",
      )
        .bind(result.meta.last_row_id)
        .first();
      return json(created, 201);
    },
  ),

  route(
    "DELETE",
    "/api/checklist-template-items/:id",
    async (request, env, params) => {
      const id = requireId(params);
      if (!id) return badRequest("ID invalide");
      await env.DB.prepare("DELETE FROM checklist_template_items WHERE id = ?")
        .bind(id)
        .run();
      return new Response(null, { status: 204, headers: CORS });
    },
  ),

  // Plan checklists (per-service checklist state)
  route("GET", "/api/plans/:id/checklist", async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest("ID invalide");
    const items = await env.DB.prepare(
      "SELECT * FROM plan_checklists WHERE plan_id = ? ORDER BY id ASC",
    )
      .bind(planId)
      .all();
    return json(items.results);
  }),

  route("POST", "/api/plans/:id/checklist", async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest("ID invalide");
    const body = await getBody(request);
    const pcErr = validate({ position: { required: true, type: 'integer' }, label: { required: true, type: 'string', maxLength: 200 } }, body)
    if (pcErr) return validationError(pcErr)
    const result = await env.DB.prepare(
      "INSERT INTO plan_checklists (plan_id, member_id, position, done, label) VALUES (?, ?, ?, 0, ?)",
    )
      .bind(planId, body.member_id || null, body.position, body.label)
      .run();
    const created = await env.DB.prepare(
      "SELECT * FROM plan_checklists WHERE id = ?",
    )
      .bind(result.meta.last_row_id)
      .first();
    return json(created, 201);
  }),

  route("PUT", "/api/plan-checklists/:id", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const body = await getBody(request);
    const updErr = validate({ done: { required: true, type: 'boolean' } }, body)
    if (updErr) return validationError(updErr)
    await env.DB.prepare(
      `UPDATE plan_checklists SET done = ?, done_at = CASE WHEN ? THEN datetime('now') ELSE NULL END WHERE id = ?`,
    )
      .bind(body.done ? 1 : 0, body.done ? 1 : 0, id)
      .run();
    const updated = await env.DB.prepare(
      "SELECT * FROM plan_checklists WHERE id = ?",
    )
      .bind(id)
      .first();
    return json(updated);
  }),

  route("DELETE", "/api/plan-checklists/:id", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    await env.DB.prepare("DELETE FROM plan_checklists WHERE id = ?")
      .bind(id)
      .run();
    return new Response(null, { status: 204, headers: CORS });
  }),
];
