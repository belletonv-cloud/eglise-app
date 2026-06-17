// Plans & plan items route handlers
import { json, badRequest, notFound, getBody, requireId, CORS } from "../lib.js";
import { validate, validationError } from '../validate.js'
import { hasPermission } from "../auth.js";
import { route } from "../routes.js";
import { triggerWebhooks } from "../webhooks.js";

export const plansRoutes = [
  // ========================================
  // PLANS (Calendrier & Services)
  // ========================================
  route("GET", "/api/plans", async (request, env, params, url) => {
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const size = Math.min(
      parseInt(url.searchParams.get("size") || "25", 10),
      100,
    );
    const offset = (page - 1) * size;

    let where = "";
    const binds = [];
    if (month && year) {
      where = "WHERE strftime('%m', p.date) = ? AND strftime('%Y', p.date) = ?";
      binds.push(month.padStart(2, "0"), year);
    } else if (year) {
      where = "WHERE strftime('%Y', p.date) = ?";
      binds.push(year);
    }

    // Count total plans
    const countRes = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM plans p ${where}`,
    )
      .bind(...binds)
      .first();
    const totalCount = countRes?.count || 0;

    // Main paginated query
    let query = `
      SELECT p.*, st.name as service_type_name,
        COUNT(pi.id) as items_count,
        COUNT(sp.id) as people_count
      FROM plans p
      LEFT JOIN service_types st ON st.id = p.service_type_id
      LEFT JOIN plan_items pi ON pi.plan_id = p.id
      LEFT JOIN scheduled_people sp ON sp.plan_id = p.id
      ${where}
      GROUP BY p.id ORDER BY p.date ASC
      LIMIT ? OFFSET ?
    `;
    const result = await env.DB.prepare(query)
      .bind(...binds, size, offset)
      .all();
    return json({ data: result.results, page, size, totalCount });
  }),

  route("GET", "/api/plans/:id", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const plan = await env.DB.prepare(
      `
      SELECT p.*, st.name as service_type_name
      FROM plans p
      LEFT JOIN service_types st ON st.id = p.service_type_id
      WHERE p.id = ?
    `,
    )
      .bind(id)
      .first();
    if (!plan) return notFound();
    return json(plan);
  }),

  // Public read-only plan view — no auth required, accessed via share token
  route("GET", "/api/public/plans/:token", async (request, env, params) => {
    const token = params.token;
    if (!token) return badRequest("Token invalide");
    const plan = await env.DB.prepare(
      `SELECT p.id, p.date, p.time, p.theme, p.notes, p.status,
              st.name as service_type_name
       FROM plans p
       LEFT JOIN service_types st ON st.id = p.service_type_id
       WHERE p.share_token = ?`,
    )
      .bind(token)
      .first();
    if (!plan) return notFound("Plan introuvable ou lien expiré");
    const items = await env.DB.prepare(
      `SELECT pi.id, pi.type, pi.title, pi.description, pi.position,
              pi.length_minutes, pi.color,
              ps.transposed_key, a.name as arrangement_name, s.title as song_title
       FROM plan_items pi
       LEFT JOIN plan_songs ps ON ps.plan_item_id = pi.id
       LEFT JOIN arrangements a ON a.id = ps.arrangement_id
       LEFT JOIN songs s ON s.id = a.song_id
       WHERE pi.plan_id = ?
       ORDER BY pi.position ASC`,
    )
      .bind(plan.id)
      .all();
    return json({ plan, items: items.results });
  }),

  // Generate or retrieve share token for a plan (admin/scheduler only)
  route("POST", "/api/plans/:id/share", async (request, env, params) => {
    if (!(await hasPermission(request, env, "schedule")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const plan = await env.DB.prepare(
      "SELECT id, share_token FROM plans WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!plan) return notFound();
    if (plan.share_token) return json({ token: plan.share_token });
    // Generate a UUID-like token
    const token = crypto.randomUUID();
    await env.DB.prepare("UPDATE plans SET share_token = ? WHERE id = ?")
      .bind(token, id)
      .run();
    return json({ token }, 201);
  }),

  // Revoke share token
  route("DELETE", "/api/plans/:id/share", async (request, env, params) => {
    if (!(await hasPermission(request, env, "schedule")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    await env.DB.prepare("UPDATE plans SET share_token = NULL WHERE id = ?")
      .bind(id)
      .run();
    return json({ ok: true });
  }),

  route("POST", "/api/plans", async (request, env) => {
    if (!(await hasPermission(request, env, "schedule")))
      return json({ error: "Forbidden" }, 403);
    const body = await getBody(request);
    if (!body) return badRequest("Corps JSON invalide");
    const err = validate(
      {
        service_type_id: { required: true, type: 'integer' },
        date: { required: true, type: 'string' },
      },
      body,
    );
    if (err) return validationError(err);
    const result = await env.DB.prepare(
      "INSERT INTO plans (service_type_id, date, time, theme, notes, status) VALUES (?, ?, ?, ?, ?, ?)",
    )
      .bind(
        body.service_type_id || null,
        body.date,
        body.time || null,
        body.theme || null,
        body.notes || null,
        body.status || "planned",
      )
      .run();
    const newPlan = await env.DB.prepare(
      `
      SELECT p.*, st.name as service_type_name
      FROM plans p LEFT JOIN service_types st ON st.id = p.service_type_id
      WHERE p.id = ?
    `,
    )
      .bind(result.meta.last_row_id)
      .first();
    triggerWebhooks(env, "plan.created", newPlan).catch((err) => {
      console.error("triggerWebhooks plan.created failed", err, {
        event: "plan.created",
        payload: newPlan,
      });
    });
    return json(newPlan, 201);
  }),

  route("PUT", "/api/plans/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "schedule")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const body = await getBody(request);
    if (!body) return badRequest("Corps JSON invalide");
    const err = validate(
      {
        service_type_id: { type: 'integer' },
        date: { type: 'string' },
        time: { type: 'string' },
        theme: { type: 'string' },
        notes: { type: 'string' },
        status: { type: 'string' },
      },
      body,
    );
    if (err) return validationError(err);
    const existing = await env.DB.prepare("SELECT * FROM plans WHERE id = ?")
      .bind(id)
      .first();
    if (!existing) return notFound();
    await env.DB.prepare(
      "UPDATE plans SET service_type_id=?, date=?, time=?, theme=?, notes=?, status=? WHERE id=?",
    )
      .bind(
        body.service_type_id !== undefined
          ? body.service_type_id
          : existing.service_type_id,
        body.date || existing.date,
        body.time !== undefined ? body.time : existing.time,
        body.theme !== undefined ? body.theme : existing.theme,
        body.notes !== undefined ? body.notes : existing.notes,
        body.status || existing.status,
        id,
      )
      .run();
    const updated = await env.DB.prepare(
      `
      SELECT p.*, st.name as service_type_name
      FROM plans p LEFT JOIN service_types st ON st.id = p.service_type_id
      WHERE p.id = ?
    `,
    )
      .bind(id)
      .first();
    if (updated)
      triggerWebhooks(env, "plan.updated", updated).catch((err) => {
        console.error("triggerWebhooks plan.updated failed", err, {
          event: "plan.updated",
          payload: updated,
        });
      });
    return json(updated);
  }),

  route("DELETE", "/api/plans/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "schedule")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    await env.DB.prepare("DELETE FROM plans WHERE id = ?").bind(id).run();
    triggerWebhooks(env, "plan.deleted", { id }).catch((err) => {
      console.error("triggerWebhooks plan.deleted failed", err, {
        event: "plan.deleted",
        payload: { id },
      });
    });
    return new Response(null, { status: 204, headers: CORS });
  }),

  // ========================================
  // PLAN ITEMS
  // ========================================
  route("GET", "/api/plans/:id/items", async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest("ID plan invalide");
    const plan = await env.DB.prepare("SELECT id FROM plans WHERE id = ?")
      .bind(planId)
      .first();
    if (!plan) return notFound("Plan non trouvé");
    const items = await env.DB.prepare(
      `
      SELECT pi.*, ps.arrangement_id, ps.transposed_key,
        a.name as arrangement_name, a.key as arrangement_key, a.tempo,
        s.title as song_title, s.id as song_id
      FROM plan_items pi
      LEFT JOIN plan_songs ps ON ps.plan_item_id = pi.id
      LEFT JOIN arrangements a ON a.id = ps.arrangement_id
      LEFT JOIN songs s ON s.id = a.song_id
      WHERE pi.plan_id = ?
      ORDER BY pi.position ASC
    `,
    )
      .bind(planId)
      .all();
    return json(items.results);
  }),

  route("POST", "/api/plans/:id/items", async (request, env, params) => {
    if (!(await hasPermission(request, env, "schedule")))
      return json({ error: "Forbidden" }, 403);
    const planId = requireId(params);
    if (!planId) return badRequest("ID plan invalide");
    const plan = await env.DB.prepare("SELECT id FROM plans WHERE id = ?")
      .bind(planId)
      .first();
    if (!plan) return notFound("Plan non trouvé");
    const body = await getBody(request);
    if (!body) return badRequest("Corps JSON invalide");
    const err = validate(
      {
        type: { required: true, type: 'string', maxLength: 50 },
        title: { required: true, type: 'string', maxLength: 200 },
        song_id: { type: 'integer' },
        arrangement_id: { type: 'integer' },
      },
      body,
    );
    if (err) return validationError(err);

    let position = body.position;
    if (position === undefined || position === null) {
      const maxPos = await env.DB.prepare(
        "SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM plan_items WHERE plan_id = ?",
      )
        .bind(planId)
        .first();
      position = maxPos.next_pos;
    }

    const result = await env.DB.prepare(
      "INSERT INTO plan_items (plan_id, type, title, description, position, length_minutes, color) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        planId,
        body.type,
        body.title,
        body.description || null,
        position,
        body.length_minutes || null,
        body.color || null,
      )
      .run();

    const newItem = await env.DB.prepare(
      "SELECT * FROM plan_items WHERE id = ?",
    )
      .bind(result.meta.last_row_id)
      .first();

    if (body.type === "song" && body.arrangement_id) {
      await env.DB.prepare(
        "INSERT INTO plan_songs (plan_item_id, arrangement_id, transposed_key) VALUES (?, ?, ?)",
      )
        .bind(newItem.id, body.arrangement_id, body.transposed_key || null)
        .run();
    }

    return json(newItem, 201);
  }),

  route("PUT", "/api/plan-items/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "schedule")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const existing = await env.DB.prepare(
      "SELECT * FROM plan_items WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!existing) return notFound();
    const body = await getBody(request);
    if (!body) return badRequest("Corps JSON invalide");
    await env.DB.prepare(
      "UPDATE plan_items SET type=?, title=?, description=?, position=?, length_minutes=?, color=? WHERE id=?",
    )
      .bind(
        body.type || existing.type,
        body.title || existing.title,
        body.description !== undefined
          ? body.description
          : existing.description,
        body.position !== undefined ? body.position : existing.position,
        body.length_minutes !== undefined
          ? body.length_minutes
          : existing.length_minutes,
        body.color !== undefined ? body.color : existing.color,
        id,
      )
      .run();

    if (body.type === "song" || existing.type === "song") {
      if (body.arrangement_id !== undefined) {
        const existingPs = await env.DB.prepare(
          "SELECT id FROM plan_songs WHERE plan_item_id = ?",
        )
          .bind(id)
          .first();
        if (existingPs) {
          if (body.arrangement_id === null) {
            await env.DB.prepare(
              "DELETE FROM plan_songs WHERE plan_item_id = ?",
            )
              .bind(id)
              .run();
          } else {
            await env.DB.prepare(
              "UPDATE plan_songs SET arrangement_id=?, transposed_key=? WHERE plan_item_id=?",
            )
              .bind(body.arrangement_id, body.transposed_key || null, id)
              .run();
          }
        } else if (body.arrangement_id !== null) {
          await env.DB.prepare(
            "INSERT INTO plan_songs (plan_item_id, arrangement_id, transposed_key) VALUES (?, ?, ?)",
          )
            .bind(id, body.arrangement_id, body.transposed_key || null)
            .run();
        }
      }
    }

    const updated = await env.DB.prepare(
      `
      SELECT pi.*, ps.arrangement_id, ps.transposed_key,
        a.name as arrangement_name, s.title as song_title
      FROM plan_items pi
      LEFT JOIN plan_songs ps ON ps.plan_item_id = pi.id
      LEFT JOIN arrangements a ON a.id = ps.arrangement_id
      LEFT JOIN songs s ON s.id = a.song_id
      WHERE pi.id = ?
    `,
    )
      .bind(id)
      .first();
    return json(updated);
  }),

  route("DELETE", "/api/plan-items/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "schedule")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    await env.DB.prepare("DELETE FROM plan_items WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204, headers: CORS });
  }),
];
