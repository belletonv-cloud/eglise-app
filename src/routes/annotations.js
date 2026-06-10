import { json, badRequest, notFound, unauthorized, getBody, requireId, dbFirst } from '../lib.js'
import { hasPermission, getMemberFromRequest } from '../auth.js'
import { route } from '../routes.js'
import { kdriveUpload, kdriveGet, kdriveDelete, kdriveParseId } from '../kdrive.js'

// ========================================
// ANNOTATIONS (partagées/privées)
// ========================================
export const annotationsRoutes = [

  route(
    "GET",
    "/api/arrangements/:id/annotations",
    async (request, env, params) => {
      const arrId = requireId(params);
      if (!arrId) return badRequest("Invalid arrangement ID");
      const member = await getMemberFromRequest(request, env);
      if (!member) return unauthorized();
      const annotations = await env.DB.prepare(
        `
      SELECT aa.*, m.first_name, m.last_name
      FROM arrangement_annotations aa
      LEFT JOIN members m ON m.id = aa.member_id
      WHERE aa.arrangement_id = ?
        AND (aa.is_shared = 1 OR aa.member_id = ?)
      ORDER BY aa.created_at ASC
    `,
      )
        .bind(arrId, member.id)
        .all();
      return json(annotations.results);
    },
  ),

  route(
    "POST",
    "/api/arrangements/:id/annotations",
    async (request, env, params) => {
      const member = await getMemberFromRequest(request, env);
      if (!member) return unauthorized();
      const arrId = requireId(params);
      if (!arrId) return badRequest("Invalid arrangement ID");
      const body = await getBody(request);
      if (!body || !body.content) return badRequest("content is required");
      const result = await env.DB.prepare(
        "INSERT INTO arrangement_annotations (arrangement_id, member_id, content, is_shared) VALUES (?, ?, ?, ?)",
      )
        .bind(arrId, member.id, body.content, body.is_shared ? 1 : 0)
        .run();
      const annotation = await env.DB.prepare(
        `
      SELECT aa.*, m.first_name, m.last_name
      FROM arrangement_annotations aa
      LEFT JOIN members m ON m.id = aa.member_id
      WHERE aa.id = ?
    `,
      )
        .bind(result.meta.last_row_id)
        .first();
      return json(annotation, 201);
    },
  ),

  route("PUT", "/api/annotations/:id", async (request, env, params) => {
    const member = await getMemberFromRequest(request, env);
    if (!member) return unauthorized();
    const id = requireId(params);
    if (!id) return badRequest("Invalid annotation ID");
    const body = await getBody(request);
    if (!body) return badRequest();
    const annotation = await env.DB.prepare(
      "SELECT * FROM arrangement_annotations WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!annotation) return notFound("Annotation not found");
    // Only owner or admin can edit
    if (annotation.member_id !== member.id && member.role !== "admin")
      return json({ error: "Forbidden" }, 403);
    const updates = [];
    const values = [];
    if (body.content !== undefined) {
      updates.push("content = ?");
      values.push(body.content);
    }
    if (body.is_shared !== undefined) {
      updates.push("is_shared = ?");
      values.push(body.is_shared ? 1 : 0);
    }
    if (updates.length === 0) return badRequest("No fields to update");
    updates.push("updated_at = datetime('now')");
    values.push(id);
    await env.DB.prepare(
      `UPDATE arrangement_annotations SET ${updates.join(", ")} WHERE id = ?`,
    )
      .bind(...values)
      .run();
    const updated = await env.DB.prepare(
      `
      SELECT aa.*, m.first_name, m.last_name
      FROM arrangement_annotations aa
      LEFT JOIN members m ON m.id = aa.member_id
      WHERE aa.id = ?
    `,
    )
      .bind(id)
      .first();
    return json(updated);
  }),

  route("DELETE", "/api/annotations/:id", async (request, env, params) => {
    const member = await getMemberFromRequest(request, env);
    if (!member) return unauthorized();
    const id = requireId(params);
    if (!id) return badRequest("Invalid annotation ID");
    const annotation = await env.DB.prepare(
      "SELECT * FROM arrangement_annotations WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!annotation) return notFound("Annotation not found");
    // Only owner or admin can delete
    if (annotation.member_id !== member.id && member.role !== "admin")
      return json({ error: "Forbidden" }, 403);
    await env.DB.prepare("DELETE FROM arrangement_annotations WHERE id = ?")
      .bind(id)
      .run();
    return json({ success: true });
  }),

  // ========================================
  // ARRANGEMENT DRAWINGS (canvas annotations)
  // ========================================
  // GET /api/arrangements/:id/drawings — list all drawings for an arrangement
  // Returns own drawing + shared drawings from other members
  route(
    "GET",
    "/api/arrangements/:id/drawings",
    async (request, env, params) => {
      const member = await getMemberFromRequest(request, env);
      if (!member) return json({ error: "Not authenticated" }, 401);
      const arrangementId = requireId(params);
      if (!arrangementId) return badRequest("Invalid arrangement id");
      const drawings = await env.DB.prepare(
        `
      SELECT ad.*, m.first_name, m.last_name
      FROM arrangement_drawings ad
      JOIN members m ON m.id = ad.member_id
      WHERE ad.arrangement_id = ?
        AND (ad.member_id = ? OR ad.is_shared = 1)
      ORDER BY ad.updated_at DESC
    `,
      )
        .bind(arrangementId, member.id)
        .all();
      return json(drawings.results);
    },
  ),

  // PUT /api/arrangements/:id/drawings — upsert own drawing (one per member per arrangement)
  route(
    "PUT",
    "/api/arrangements/:id/drawings",
    async (request, env, params) => {
      const member = await getMemberFromRequest(request, env);
      if (!member) return json({ error: "Not authenticated" }, 401);
      const arrangementId = requireId(params);
      if (!arrangementId) return badRequest("Invalid arrangement id");
      const body = await getBody(request);
      if (!body) return badRequest("Missing body");
      const paths =
        typeof body.paths === "string"
          ? body.paths
          : JSON.stringify(body.paths || []);
      const isShared = body.is_shared ? 1 : 0;
      // Upsert: one drawing per member per arrangement
      const existing = await env.DB.prepare(
        "SELECT id FROM arrangement_drawings WHERE arrangement_id = ? AND member_id = ?",
      )
        .bind(arrangementId, member.id)
        .first();
      if (existing) {
        await env.DB.prepare(
          "UPDATE arrangement_drawings SET paths = ?, is_shared = ?, updated_at = datetime('now') WHERE id = ?",
        )
          .bind(paths, isShared, existing.id)
          .run();
      } else {
        await env.DB.prepare(
          "INSERT INTO arrangement_drawings (arrangement_id, member_id, paths, is_shared) VALUES (?, ?, ?, ?)",
        )
          .bind(arrangementId, member.id, paths, isShared)
          .run();
      }
      const row = await env.DB.prepare(
        `
      SELECT ad.*, m.first_name, m.last_name
      FROM arrangement_drawings ad
      JOIN members m ON m.id = ad.member_id
      WHERE ad.arrangement_id = ? AND ad.member_id = ?
    `,
      )
        .bind(arrangementId, member.id)
        .first();
      return json(row);
    },
  ),

  // DELETE /api/arrangements/:id/drawings — clear own drawing
  route(
    "DELETE",
    "/api/arrangements/:id/drawings",
    async (request, env, params) => {
      const member = await getMemberFromRequest(request, env);
      if (!member) return json({ error: "Not authenticated" }, 401);
      const arrangementId = requireId(params);
      if (!arrangementId) return badRequest("Invalid arrangement id");
      await env.DB.prepare(
        "DELETE FROM arrangement_drawings WHERE arrangement_id = ? AND member_id = ?",
      )
        .bind(arrangementId, member.id)
        .run();
      return json({ success: true });
    },
  ),

  // ========================================
  // RESOURCE PERMISSIONS (RBAC fin)
  // ========================================
  // ========================================
  // RESOURCE-LEVEL PERMISSIONS
  // Stored per (member, resource_type, resource_id, permission).
  // NOT consulted by hasPermission() — reserved for future granular access control
  // (e.g. "member 5 can edit plan 42 specifically").
  // Use hasResourcePermission() when that granularity is needed.
  // ========================================
  route("GET", "/api/resource-permissions", async (request, env, params) => {
    const member = await getMemberFromRequest(request, env);
    if (!member || member.role !== "admin") return unauthorized();
    const perms = await env.DB.prepare(
      "SELECT * FROM resource_permissions ORDER BY created_at DESC",
    ).all();
    return json(perms.results);
  }),

  route("POST", "/api/resource-permissions", async (request, env, params) => {
    const member = await getMemberFromRequest(request, env);
    if (!member || member.role !== "admin") return unauthorized();
    const body = await getBody(request);
    if (
      !body ||
      !body.member_id ||
      !body.resource_type ||
      !body.resource_id ||
      !body.permission
    )
      return badRequest(
        "member_id, resource_type, resource_id, permission required",
      );
    const existing = await env.DB.prepare(
      "SELECT id FROM resource_permissions WHERE member_id = ? AND resource_type = ? AND resource_id = ? AND permission = ?",
    )
      .bind(
        body.member_id,
        body.resource_type,
        body.resource_id,
        body.permission,
      )
      .first();
    if (existing) {
      await env.DB.prepare(
        "UPDATE resource_permissions SET granted = ? WHERE id = ?",
      )
        .bind(body.granted !== false ? 1 : 0, existing.id)
        .run();
    } else {
      await env.DB.prepare(
        "INSERT INTO resource_permissions (member_id, resource_type, resource_id, permission, granted) VALUES (?, ?, ?, ?, ?)",
      )
        .bind(
          body.member_id,
          body.resource_type,
          body.resource_id,
          body.permission,
          body.granted !== false ? 1 : 0,
        )
        .run();
    }
    const perms = await env.DB.prepare(
      "SELECT * FROM resource_permissions WHERE member_id = ?",
    )
      .bind(body.member_id)
      .all();
    return json(perms.results, 201);
  }),

  route(
    "DELETE",
    "/api/resource-permissions/:id",
    async (request, env, params) => {
      const id = requireId(params);
      if (!id) return badRequest("Invalid permission ID");
      const member = await getMemberFromRequest(request, env);
      if (!member || member.role !== "admin") return unauthorized();
      await env.DB.prepare("DELETE FROM resource_permissions WHERE id = ?")
        .bind(id)
        .run();
      return json({ success: true });
    },
  ),

  route("POST", "/api/upload", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const member = await getMemberFromRequest(request, env);
    if (!member) return unauthorized();
    let formData;
    try {
      formData = await request.formData();
    } catch (e) {
      console.error("upload: invalid multipart form data", e);
      return badRequest("Invalid multipart form data");
    }

    const file = formData.get("file");
    const arrangementId = formData.get("arrangement_id");
    const fileType = formData.get("file_type") || "audio";

    if (!file || !arrangementId)
      return badRequest("file and arrangement_id are required");

    let kdriveFile;
    try {
      kdriveFile = await kdriveUpload(env, file, file.name);
    } catch (e) {
      return json({ error: e.message }, 500);
    }

    const fileUrl = `kdrive:${kdriveFile.id}`;

    const stmt = await env.DB.prepare(
      `
      INSERT INTO attachments (entity_type, entity_id, filename, file_url, file_type)
      VALUES (?, ?, ?, ?, ?)
    `,
    )
      .bind("arrangement", Number(arrangementId), file.name, fileUrl, fileType)
      .run();

    const attachment = await dbFirst(
      env.DB,
      "SELECT * FROM attachments WHERE id = ?",
      stmt.meta.last_row_id,
    );
    return json(attachment, 201);
  }),

  route("GET", "/api/attachments/:id/file", async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest("Invalid attachment ID");

    const attachment = await dbFirst(
      env.DB,
      "SELECT * FROM attachments WHERE id = ?",
      id,
    );
    if (!attachment) return notFound();

    const fileId = kdriveParseId(attachment.file_url);
    if (!fileId) return notFound();

    const kdriveResp = await kdriveGet(env, fileId);
    if (!kdriveResp) return notFound();

    const headers = new Headers(kdriveResp.headers);
    headers.set("Cache-Control", "public, max-age=31536000");

    return new Response(kdriveResp.body, { headers });
  }),

  route("DELETE", "/api/attachments/:id", async (request, env, params) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const id = requireId(params);
    if (!id) return badRequest("Invalid attachment ID");
    const existing = await dbFirst(
      env.DB,
      "SELECT id, file_url FROM attachments WHERE id = ?",
      id,
    );
    if (!existing) return notFound();

    const fileId = kdriveParseId(existing.file_url);
    if (fileId)
      await kdriveDelete(env, fileId).catch((err) => {
        console.error("kdriveDelete failed", err, { fileId });
      });

    await env.DB.prepare("DELETE FROM attachments WHERE id = ?").bind(id).run();
    return json({ success: true });
  }),
];
