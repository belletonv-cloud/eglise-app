import { route } from "../routes.js";
import { requireId, badRequest, notFound, json, getBody, dbFirst } from "../lib.js";
import { getMemberFromRequest } from "../auth.js";
import { kdriveUpload, kdriveParseId, kdriveGet, kdriveDelete } from "../kdrive.js";
import { validate, validationError } from '../validate.js'

async function callAudioSplitter(env, file, planId) {
  const url = env.AUDIO_SPLITTER_URL || "http://localhost:8765";
  const buffer =
    typeof file.arrayBuffer === "function" ? await file.arrayBuffer() : file;
  const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
  const encoder = new TextEncoder();
  const parts = [];
  parts.push(
    encoder.encode(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name || "audio.mp3"}"\r\nContent-Type: audio/mpeg\r\n\r\n`,
    ),
  );
  parts.push(buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer);
  parts.push(
    encoder.encode(
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\nfr\r\n`,
    ),
  );
  parts.push(
    encoder.encode(
      `--${boundary}\r\nContent-Disposition: form-data; name="min_silence"\r\n\r\n5.0\r\n`,
    ),
  );
  parts.push(encoder.encode(`--${boundary}--\r\n`));
  const totalLen = parts.reduce((s, p) => s + p.byteLength, 0);
  const body = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    body.set(p, offset);
    offset += p.byteLength;
  }
  const res = await fetch(`${url}/api/process`, {
    method: "POST",
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "Erreur audio-splitter");
    throw new Error(`Audio splitter error: ${errText}`);
  }
  return await res.json();
}

// ========================================
// SERMON AUDIO (attachments on plans)
// ========================================
export const audioRoutes = [
  route("POST", "/api/plans/:id/audio", async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest("ID plan invalide");
    const plan = await env.DB.prepare("SELECT id FROM plans WHERE id = ?")
      .bind(planId)
      .first();
    if (!plan) return notFound("Plan non trouvé");

    let formData;
    try {
      formData = await request.formData();
    } catch (e) {
      console.error("plans/:id/audio: invalid multipart form data", e);
      return badRequest("Invalid multipart form data");
    }

    const file = formData.get("file");
    const title = formData.get("title") || "Enregistrement";

    if (!file) return badRequest("file required");

    let fileUrl;
    if (env.INFOMANIAK_TOKEN && env.INFOMANIAK_TOKEN !== "changeme") {
      try {
        const kdriveFile = await kdriveUpload(
          env,
          file,
          `sermon-${planId}-${file.name}`,
        );
        fileUrl = `kdrive:${kdriveFile.id}`;
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    } else {
      fileUrl = `local:${file.name}`;
    }

    // Store in attachments table
    if (fileUrl.startsWith("kdrive:")) {
      await env.DB.prepare(
        "INSERT INTO attachments (entity_type, entity_id, filename, file_url, file_type) VALUES (?, ?, ?, ?, ?)",
      )
        .bind("plan", planId, file.name, fileUrl, "audio")
        .run();
    }

    // Also set audio_url on plans for convenience
    await env.DB.prepare(
      "UPDATE plans SET audio_url = ?, audio_title = ? WHERE id = ?",
    )
      .bind(fileUrl, title, planId)
      .run();

    let segmentsResult = null;
    const audioDuration = null;
    try {
      const splitterResult = await callAudioSplitter(env, file, planId);
      if (splitterResult && splitterResult.segments) {
        const s = splitterResult.segments;
        const songs = splitterResult.summary?.chants || [];
        const duration = splitterResult.duration_seconds;
        await env.DB.prepare(
          "DELETE FROM plan_audio_segments WHERE plan_id = ?",
        )
          .bind(planId)
          .run();
        await env.DB.prepare("DELETE FROM plan_audio_songs WHERE plan_id = ?")
          .bind(planId)
          .run();
        for (let i = 0; i < s.length; i++) {
          const seg = s[i];
          await env.DB.prepare(
            "INSERT INTO plan_audio_segments (plan_id, segment_index, start_seconds, end_seconds, segment_type, title, text, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          )
            .bind(
              planId,
              i,
              seg.start,
              seg.end,
              seg.type,
              seg.title || null,
              seg.text || null,
              seg.confidence || null,
            )
            .run();
        }
        for (let i = 0; i < songs.length; i++) {
          const c = songs[i];
          await env.DB.prepare(
            "INSERT INTO plan_audio_songs (plan_id, song_index, title, start_seconds, end_seconds) VALUES (?, ?, ?, ?, ?)",
          )
            .bind(planId, i, c.title || null, c.start, c.end)
            .run();
        }
        if (duration != null) {
          await env.DB.prepare(
            "UPDATE plans SET audio_duration_seconds = ? WHERE id = ?",
          )
            .bind(duration, planId)
            .run();
        }
        segmentsResult = {
          segments: s.length,
          songs: songs.length,
          duration_seconds: duration,
        };
      }
    } catch (e) {
      segmentsResult = { error: e.message };
    }

    return json(
      {
        success: true,
        file_url: fileUrl,
        title,
        audio_splitter: segmentsResult,
      },
      201,
    );
  }),

  route("GET", "/api/plans/:id/audio", async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest("ID plan invalide");
    const plan = await env.DB.prepare(
      "SELECT audio_url, audio_title, audio_duration_seconds FROM plans WHERE id = ?",
    )
      .bind(planId)
      .first();
    if (!plan) return notFound();
    const attachments = await env.DB.prepare(
      "SELECT * FROM attachments WHERE entity_type = 'plan' AND entity_id = ? AND file_type = 'audio' ORDER BY created_at DESC",
    )
      .bind(planId)
      .all();
    return json({
      audio_url: plan.audio_url,
      audio_title: plan.audio_title,
      audio_duration_seconds: plan.audio_duration_seconds,
      attachments: attachments.results,
    });
  }),

  route("GET", "/api/plans/:id/audio/stream", async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest("ID plan invalide");
    const plan = await env.DB.prepare(
      "SELECT audio_url FROM plans WHERE id = ?",
    )
      .bind(planId)
      .first();
    if (!plan || !plan.audio_url) return notFound("Aucun audio");
    const fileId = kdriveParseId(plan.audio_url);
    if (!fileId) return notFound();
    const attachment = await dbFirst(
      env.DB,
      "SELECT id FROM attachments WHERE entity_type = 'plan' AND entity_id = ? AND file_type = 'audio' ORDER BY created_at DESC LIMIT 1",
      planId,
    );
    if (!attachment) return notFound();
    const resp = await kdriveGet(env, fileId);
    if (!resp) return notFound();
    const headers = new Headers(resp.headers);
    headers.set("Cache-Control", "public, max-age=31536000");
    return new Response(resp.body, { headers });
  }),

  route("DELETE", "/api/plans/:id/audio", async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest("ID plan invalide");
    const attachments = await env.DB.prepare(
      "SELECT * FROM attachments WHERE entity_type = 'plan' AND entity_id = ? AND file_type = 'audio'",
    )
      .bind(planId)
      .all();
    for (const a of attachments.results) {
      const fileId = kdriveParseId(a.file_url);
      if (fileId)
        await kdriveDelete(env, fileId).catch((err) => {
          console.error("kdriveDelete failed", err, { fileId });
        });
      await env.DB.prepare("DELETE FROM attachments WHERE id = ?")
        .bind(a.id)
        .run();
    }
    await env.DB.prepare(
      "UPDATE plans SET audio_url = NULL, audio_title = NULL, audio_duration_seconds = NULL WHERE id = ?",
    )
      .bind(planId)
      .run();
    return json({ success: true });
  }),

  // ========================================
  // AUDIO SEGMENTS (audio-splitter integration)
  // ========================================
  route(
    "GET",
    "/api/plans/:id/audio-segments",
    async (request, env, params) => {
      const planId = requireId(params);
      if (!planId) return badRequest("ID plan invalide");
      const member = await getMemberFromRequest(request, env);
      if (!member) return json({ error: "Not authenticated" }, 401);
      const plan = await env.DB.prepare(
        "SELECT audio_duration_seconds FROM plans WHERE id = ?",
      )
        .bind(planId)
        .first();
      const segments = await env.DB.prepare(
        "SELECT * FROM plan_audio_segments WHERE plan_id = ? ORDER BY segment_index",
      )
        .bind(planId)
        .all();
      const songs = await env.DB.prepare(
        "SELECT * FROM plan_audio_songs WHERE plan_id = ? ORDER BY song_index",
      )
        .bind(planId)
        .all();
      return json({
        segments: segments.results,
        songs: songs.results,
        duration_seconds: plan?.audio_duration_seconds || null,
      });
    },
  ),

  route(
    "POST",
    "/api/plans/:id/audio-segments",
    async (request, env, params) => {
      const planId = requireId(params);
      if (!planId) return badRequest("ID plan invalide");
      const body = await getBody(request).catch(() => null);
      if (!body || !body.segments) return badRequest("segments requis");
      const segErr = validate({ segments: { required: true, type: 'array' } }, body)
      if (segErr) return validationError(segErr)
      const token = request.headers.get("x-audio-token");
      if (token !== env.AUDIO_SPLITTER_TOKEN)
        return json({ error: "Invalid token" }, 401);
      const plan = await env.DB.prepare("SELECT id FROM plans WHERE id = ?")
        .bind(planId)
        .first();
      if (!plan) return notFound("Plan non trouvé");
      await env.DB.prepare("DELETE FROM plan_audio_segments WHERE plan_id = ?")
        .bind(planId)
        .run();
      await env.DB.prepare("DELETE FROM plan_audio_songs WHERE plan_id = ?")
        .bind(planId)
        .run();
      for (let i = 0; i < body.segments.length; i++) {
        const s = body.segments[i];
        await env.DB.prepare(
          "INSERT INTO plan_audio_segments (plan_id, segment_index, start_seconds, end_seconds, segment_type, title, text, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
          .bind(
            planId,
            i,
            s.start,
            s.end,
            s.type,
            s.title || null,
            s.text || null,
            s.confidence || null,
          )
          .run();
      }
      if (body.songs) {
        for (let i = 0; i < body.songs.length; i++) {
          const s = body.songs[i];
          await env.DB.prepare(
            "INSERT INTO plan_audio_songs (plan_id, song_index, title, start_seconds, end_seconds) VALUES (?, ?, ?, ?, ?)",
          )
            .bind(planId, i, s.title || null, s.start, s.end)
            .run();
        }
      }
      return json({ success: true });
    },
  ),
];
