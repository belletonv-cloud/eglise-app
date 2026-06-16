import { route } from "../routes.js";
import { json, getBody, badRequest, requireId } from "../lib.js";
import { hasPermission, getMemberFromRequest } from "../auth.js";
import { validate, validationError } from '../validate.js'

// ========================================
// MESSAGERIE INTERNE
// ========================================
export const messagesRoutes = [
  route("POST", "/api/messages", async (request, env) => {
    if (!(await hasPermission(request, env, "manage_members")))
      return json({ error: "Forbidden" }, 403);
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: "Not authenticated" }, 401);
    const body = await getBody(request);
    const msgErr = validate({ title: { required: true, type: 'string', maxLength: 200 }, content: { type: 'string', maxLength: 10000 } }, body)
    if (msgErr) return validationError(msgErr)
    const recipients = Array.isArray(body.recipients) ? body.recipients : [];
    const res = await env.DB.prepare(
      "INSERT INTO messages (sender_id, subject, content) VALUES (?, ?, ?)",
    )
      .bind(member.id, body.title || body.subject || null, body.content)
      .run();
    const messageId = res.meta.last_row_id;
    for (const rid of recipients) {
      await env.DB.prepare(
        "INSERT INTO message_recipients (message_id, recipient_id) VALUES (?, ?)",
      )
        .bind(messageId, rid)
        .run();
    }
    // also create a recipient copy for the sender
    await env.DB.prepare(
      "INSERT INTO message_recipients (message_id, recipient_id) VALUES (?, ?)",
    )
      .bind(messageId, member.id)
      .run();
    const created = await env.DB.prepare(
      "SELECT m.*, mr.* FROM messages m WHERE m.id = ?",
    )
      .bind(messageId)
      .first();
    return json(created, 201);
  }),

  route("GET", "/api/messages/inbox", async (request, env, params, url) => {
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: "Not authenticated" }, 401);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const size = Math.min(
      parseInt(url.searchParams.get("size") || "25", 10),
      100,
    );
    const offset = (page - 1) * size;
    // Count total
    const countRes = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM message_recipients WHERE recipient_id = ?",
    )
      .bind(member.id)
      .first();
    const totalCount = countRes?.count || 0;
    // Paginated fetch
    const rows = await env.DB.prepare(
      `
      SELECT m.id, m.sender_id, m.subject, m.content, m.created_at, mr.read_at, mem.first_name as sender_first, mem.last_name as sender_last
      FROM message_recipients mr
      JOIN messages m ON m.id = mr.message_id
      LEFT JOIN members mem ON mem.id = m.sender_id
      WHERE mr.recipient_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `,
    )
      .bind(member.id, size, offset)
      .all();
    return json({ data: rows.results, page, size, totalCount });
  }),

  route("GET", "/api/messages/:id", async (request, env, params) => {
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: "Not authenticated" }, 401);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    const allowed = await env.DB.prepare(
      "SELECT 1 FROM message_recipients WHERE message_id = ? AND recipient_id = ? LIMIT 1",
    )
      .bind(id, member.id)
      .first();
    if (!allowed) return json({ error: "Forbidden" }, 403);
    const msg = await env.DB.prepare(
      "SELECT m.*, mem.first_name as sender_first, mem.last_name as sender_last FROM messages m LEFT JOIN members mem ON mem.id = m.sender_id WHERE m.id = ?",
    )
      .bind(id)
      .first();
    const recipients = (
      await env.DB.prepare(
        "SELECT recipient_id, read_at FROM message_recipients WHERE message_id = ?",
      )
        .bind(id)
        .all()
    ).results;
    return json({ ...msg, recipients });
  }),

  route("POST", "/api/messages/:id/read", async (request, env, params) => {
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: "Not authenticated" }, 401);
    const id = requireId(params);
    if (!id) return badRequest("ID invalide");
    await env.DB.prepare(
      "UPDATE message_recipients SET read_at = datetime('now') WHERE message_id = ? AND recipient_id = ?",
    )
      .bind(id, member.id)
      .run();
    return json({ success: true });
  }),
];
