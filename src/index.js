const KDRIVE_API = 'https://api.infomaniak.com'

async function getKdriveToken(env) {
  if (!env.INFOMANIAK_TOKEN) {
    throw new Error('INFOMANIAK_TOKEN not configured');
  }
  return env.INFOMANIAK_TOKEN;
}

function createRouter(routes) {
  return function (request, env) {
    const url = new URL(request.url);
    const method = request.method;

    for (const route of routes) {
      const match = route.pattern.exec(url.pathname);
      if (route.method === method && match) {
        const params = {};
        if (route.names) {
          for (let i = 0; i < route.names.length; i++) {
            params[route.names[i]] = match[i + 1];
          }
        }
        return route.handler(request, env, params, url);
      }
    }

    return new Response('Not Found', { status: 404, headers: CORS });
  };
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function notFound(msg = 'Not Found') {
  return new Response(msg, { status: 404, headers: CORS });
}

function badRequest(msg = 'Bad Request') {
  return json({ error: msg }, 400);
}

function unauthorized(msg = 'Unauthorized') {
  return json({ error: msg }, 403);
}

async function getBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function validate(rules, data) {
  for (const [field, rule] of Object.entries(rules)) {
    const val = data[field];
    if (rule.required) {
      if (val === undefined || val === null || val === '') return `${field} est requis`;
    }
    if (val !== undefined && val !== null && val !== '') {
      if (rule.maxLength && String(val).length > rule.maxLength) return `${field} ne doit pas dépasser ${rule.maxLength} caractères`;
      if (rule.type === 'int' && !Number.isInteger(Number(val))) return `${field} doit être un nombre entier`;
    }
  }
  return null;
}

// Authorization helpers (lightweight)
const ROLE_PERMISSIONS = {
  admin: ['*'],
  scheduler: ['schedule', 'view_conflicts', 'force_schedule'],
  editor: ['edit_members', 'edit_teams', 'manage_members'],
  music_director: ['schedule', 'edit_music', 'view_conflicts'],
  tech_director: ['schedule', 'view_conflicts', 'edit_tech'],
  volunteer: [],
  viewer: [],
};

async function getMemberFromRequest(request, env) {
  // Prefer Firebase ID token in Authorization header (Bearer)
  // Demo mode: allow demo email header (bypasses Firebase token validation)
  const demoEmail = request.headers.get('x-demo-email') || request.headers.get('X-Demo-Email');
  if (demoEmail) {
    const m = await env.DB.prepare('SELECT * FROM members WHERE email = ?').bind(demoEmail).first();
    if (m) return m;
    try {
      await env.DB.prepare(
        'INSERT OR IGNORE INTO members (first_name, last_name, email, role, membership_type) VALUES (?, ?, ?, ?, ?)'
      ).bind('Démo', 'Cieux Ouverts', demoEmail, 'admin', 'member').run();
      return await env.DB.prepare('SELECT * FROM members WHERE email = ?').bind(demoEmail).first();
    } catch { return null; }
  }

  const auth = request.headers.get('authorization') || request.headers.get('Authorization')
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.split(' ')[1]
    try {
      // Simple, robust check via Google's tokeninfo endpoint with caching.
      // This avoids implementing full JWT verification here while still validating audience/issuer/exp.
      if (!getMemberFromRequest._tokenCache) getMemberFromRequest._tokenCache = new Map();
      const cache = getMemberFromRequest._tokenCache;
      const now = Date.now() / 1000;
      let info = cache.get(token);
      if (!info || (info.exp && info.exp < now)) {
      if (!env.FIREBASE_PROJECT_ID) throw new Error('FIREBASE_PROJECT_ID not set');
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`)
      if (!res.ok) throw new Error('Invalid token')
      info = await res.json()
        // store with expiry if present or short TTL
        cache.set(token, info);
        // prune cache occasionally
        if (cache.size > 500) {
          for (const k of cache.keys()) { cache.delete(k); if (cache.size <= 250) break }
        }
      }
      const expectedIss = `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`
      if (info.iss !== expectedIss || info.aud !== env.FIREBASE_PROJECT_ID) throw new Error('Invalid token audience/issuer')
      // check expiry
      if (info.exp && info.exp < now) throw new Error('Token expired')
      const email = info.email
      if (!email) return null
      const m = await env.DB.prepare('SELECT * FROM members WHERE email = ?').bind(email).first()
      return m || null
    } catch (e) {
      // don't fallback here if project id is set; just return null
      return null
    }
  }
  // Dev fallback: x-user-email + X-Auth-Secret (disabled if DEV_AUTH_SECRET not set)
  const authSecret = request.headers.get('X-Auth-Secret') || request.headers.get('x-auth-secret')
  if (!env.DEV_AUTH_SECRET) return null
  if (authSecret !== env.DEV_AUTH_SECRET) return null
  const email = request.headers.get('x-user-email') || request.headers.get('X-User-Email')
  if (!email) return null
  const m = await env.DB.prepare('SELECT * FROM members WHERE email = ?').bind(email).first()
  return m || null
}

async function hasPermission(request, env, permission) {
  // wildcard permission
  if (!permission) return false
  const member = await getMemberFromRequest(request, env)
  if (!member) return false
  if (member.role === 'admin') return true

  const rolePerms = ROLE_PERMISSIONS[member.role] || []
  let allowed = rolePerms.includes('*') || rolePerms.includes(permission)

  // check exceptions table (most recent entry wins)
  const ex = await env.DB.prepare('SELECT granted FROM member_exceptions WHERE member_id = ? AND permission = ? ORDER BY created_at DESC LIMIT 1').bind(member.id, permission).first()
  if (ex) {
    allowed = !!ex.granted
  }

  return !!allowed
}

async function kdriveUpload(env, file, filename) {
  const token = await getKdriveToken(env);
  const driveId = env.KDRIVE_DRIVE_ID || '3066287';
  const parentId = env.KDRIVE_PARENT_ID || '9';
  const size = file.size;
  const buf = await file.arrayBuffer();
  const url = `${KDRIVE_API}/3/drive/${driveId}/upload?directory_id=${parentId}&total_size=${size}&file_name=${encodeURIComponent(filename)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
    },
    body: buf,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`kDrive upload failed: ${err}`);
  }
  const data = await res.json();
  return data.data || data;
}

async function kdriveGetFile(env, fileId) {
  const token = await getKdriveToken(env);
  const driveId = env.KDRIVE_DRIVE_ID || '3066287';
  const res = await fetch(`${KDRIVE_API}/2/drive/${driveId}/files/${fileId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: 'follow',
  });
  if (!res.ok) return null;
  return res;
}

async function kdriveDelete(env, fileId) {
  const token = await getKdriveToken(env);
  const driveId = env.KDRIVE_DRIVE_ID || '3066287';
  await fetch(`${KDRIVE_API}/2/drive/${driveId}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

function parseKdriveFileId(fileUrl) {
  if (!fileUrl) return null;
  if (fileUrl.startsWith('kdrive:')) return fileUrl.slice(7);
  const parts = fileUrl.split('/');
  return parts.pop() || null;
}

function requireId(params) {
  const id = parseInt(params.id, 10);
  return isNaN(id) ? null : id;
}

async function dbFirst(db, sql, ...params) {
  return await db.prepare(sql).bind(...params).first();
}

async function dbAll(db, sql, ...params) {
  return await db.prepare(sql).bind(...params).all();
}

  // Utility: create a HMAC token for one-click actions (very small, base64)
  const crypto = globalThis.crypto || require('node:crypto')
async function signOneClickToken(payloadJson, secret) {
  // secret is a string; use HMAC SHA256
    if (crypto.subtle && crypto.getRandomValues) {
      const enc = new TextEncoder();
      const keyData = enc.encode(secret);
      const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payloadJson));
      const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
      return btoa(payloadJson) + '.' + b64;
    } else {
      const hmac = require('node:crypto').createHmac('sha256', secret).update(payloadJson).digest('base64');
      return btoa(payloadJson) + '.' + hmac;
    }
}

function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toCsv(rows, columns) {
  const header = columns.join(',') + '\n';
  const body = rows.map(row => columns.map(col => csvEscape(row[col])).join(',')).join('\n');
  return header + body;
}

function generateSecureToken(bytes = 32) {
  // base64url token
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    let s = '';
    for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
    const b64 = btoa(s);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  // Node fallback
  try {
    const buf = require('node:crypto').randomBytes(bytes);
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    // last fallback
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
}

async function verifyOneClickToken(token, secret) {
  try {
    const [b64payload, b64sig] = token.split('.')
    const payloadJson = atob(b64payload)
    if (crypto.subtle) {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
      const sig = Uint8Array.from(atob(b64sig), c=>c.charCodeAt(0));
      const ok = await crypto.subtle.verify('HMAC', key, sig, enc.encode(payloadJson));
      if (!ok) return null
      return JSON.parse(payloadJson)
    }
    const expected = require('node:crypto').createHmac('sha256', secret).update(payloadJson).digest('base64')
    if (expected !== b64sig) return null
    return JSON.parse(payloadJson)
  } catch (e) { return null }
}

async function callAudioSplitter(env, file, planId) {
  const url = env.AUDIO_SPLITTER_URL || 'http://localhost:8765';
  const buffer = typeof file.arrayBuffer === 'function'
    ? await file.arrayBuffer()
    : file;
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  const encoder = new TextEncoder();
  const parts = [];
  parts.push(encoder.encode(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name || 'audio.mp3'}"\r\nContent-Type: audio/mpeg\r\n\r\n`
  ));
  parts.push(buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer);
  parts.push(encoder.encode(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\nfr\r\n`));
  parts.push(encoder.encode(`--${boundary}\r\nContent-Disposition: form-data; name="min_silence"\r\n\r\n5.0\r\n`));
  parts.push(encoder.encode(`--${boundary}--\r\n`));
  const totalLen = parts.reduce((s, p) => s + p.byteLength, 0);
  const body = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    body.set(p, offset);
    offset += p.byteLength;
  }
  const res = await fetch(`${url}/api/process`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => 'Erreur audio-splitter');
    throw new Error(`Audio splitter error: ${errText}`);
  }
  return await res.json();
}

const route = (method, path, handler) => {
  const names = [];
  const patternStr = path.replace(/:([^/]+)/g, (_, name) => {
    names.push(name);
    return '([^/]+)';
  });
  return { method, pattern: new RegExp(`^${patternStr}$`), names, handler };
};

const routes0 = [
  // ========================================
  // SONGS
  // ========================================
  route('GET', '/api/songs', async (request, env) => {
    const stmt = env.DB.prepare(`
      SELECT s.*, COUNT(a.id) as arrangement_count
      FROM songs s LEFT JOIN arrangements a ON a.song_id = s.id
      GROUP BY s.id ORDER BY s.title ASC
    `);
    const result = await stmt.all();
    return json(result.results);
  }),

  route('GET', '/api/songs/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const song = await env.DB.prepare('SELECT * FROM songs WHERE id = ?').bind(id).first();
    if (!song) return notFound();
    const arrangements = await env.DB.prepare('SELECT * FROM arrangements WHERE song_id = ? ORDER BY name ASC').bind(id).all();
    return json({ ...song, arrangements: arrangements.results });
  }),

  route('PUT', '/api/arrangements/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const body = await getBody(request);
    if (!body) return badRequest('Corps JSON invalide');

    const existing = await env.DB.prepare('SELECT id FROM arrangements WHERE id = ?').bind(id).first();
    if (!existing) return notFound();

    const updates = [];
    const values = [];

    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name); }
    if (body.key !== undefined) { updates.push('key = ?'); values.push(body.key); }
    if (body.tempo !== undefined) { updates.push('tempo = ?'); values.push(body.tempo); }
    if (body.chord_chart !== undefined) { updates.push('chord_chart = ?'); values.push(body.chord_chart); }

    if (updates.length === 0) return badRequest('Aucun champ à mettre à jour');

    values.push(id);
    await env.DB.prepare(`UPDATE arrangements SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

    const updated = await env.DB.prepare('SELECT * FROM arrangements WHERE id = ?').bind(id).first();
    return json(updated);
  }),

  // ========================================
  // MEMBERS
  // ========================================
  route('GET', '/api/members', async (request, env) => {
    // Get all members
    const membersRes = await env.DB.prepare('SELECT * FROM members ORDER BY last_name ASC, first_name ASC').all();
    const members = membersRes.results;

    // Get team memberships for all members and build a map member_id -> teams[]
    const tmRes = await env.DB.prepare(`
      SELECT tm.member_id as member_id, t.id as team_id, t.name as team_name, t.description as team_description, tm.position as position
      FROM team_members tm JOIN teams t ON t.id = tm.team_id
    `).all();
    const map = {};
    for (const row of tmRes.results) {
      if (!map[row.member_id]) map[row.member_id] = [];
      map[row.member_id].push({ id: row.team_id, name: row.team_name, description: row.team_description, position: row.position });
    }

    // Attach teams array to each member
    const withTeams = members.map(m => ({ ...m, teams: map[m.id] || [] }));
    return json(withTeams);
  }),

  route('POST', '/api/members', async (request, env) => {
    const body = await getBody(request);
    if (!body) return badRequest('Corps JSON invalide');
    const err = validate({
      first_name: { required: true, maxLength: 100 },
      last_name: { required: true, maxLength: 100 },
    }, body);
    if (err) return badRequest(err);
    const stmt = env.DB.prepare(
      'INSERT INTO members (first_name, last_name, email, phone, birth_date, membership_type, baptism_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const result = await stmt.bind(
      body.first_name, body.last_name, body.email || null, body.phone || null,
      body.birth_date || null, body.membership_type || 'guest',
      body.baptism_date || null, body.notes || null
    ).run();
    const newMember = await env.DB.prepare('SELECT * FROM members WHERE id = ?').bind(result.meta.last_row_id).first();
    triggerWebhooks(env, 'member.created', newMember).catch(() => {});
    return json(newMember, 201);
  }),

  route('GET', '/api/members/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const member = await env.DB.prepare('SELECT * FROM members WHERE id = ?').bind(id).first();
    if (!member) return notFound();
    const teams = await env.DB.prepare(`
      SELECT t.*, tm.position FROM teams t
      JOIN team_members tm ON tm.team_id = t.id
      WHERE tm.member_id = ? ORDER BY t.name ASC
    `).bind(id).all();
    return json({ ...member, teams: teams.results });
  }),

  route('PUT', '/api/members/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const body = await getBody(request);
    if (!body) return badRequest('Corps JSON invalide');
    await env.DB.prepare(
      "UPDATE members SET first_name=?, last_name=?, email=?, phone=?, birth_date=?, membership_type=?, baptism_date=?, notes=?, updated_at=datetime('now') WHERE id=?"
    ).bind(
      body.first_name, body.last_name, body.email || null, body.phone || null,
      body.birth_date || null, body.membership_type || 'guest',
      body.baptism_date || null, body.notes || null, id
    ).run();
    const updated = await env.DB.prepare('SELECT * FROM members WHERE id = ?').bind(id).first();
    return json(updated);
  }),

  route('DELETE', '/api/members/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    await env.DB.prepare('DELETE FROM members WHERE id = ?').bind(id).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // ========================================
  // TEAMS
  // ========================================
  route('GET', '/api/teams', async (request, env) => {
    const result = await env.DB.prepare(`
      SELECT t.*, COUNT(tm.id) as member_count
      FROM teams t LEFT JOIN team_members tm ON tm.team_id = t.id
      GROUP BY t.id ORDER BY t.name ASC
    `).all();
    return json(result.results);
  }),

  route('POST', '/api/teams', async (request, env) => {
    const body = await getBody(request);
    if (!body) return badRequest('Corps JSON invalide');
    const err = validate({ name: { required: true, maxLength: 100 } }, body);
    if (err) return badRequest(err);
    const result = await env.DB.prepare('INSERT INTO teams (name, description, service_type) VALUES (?, ?, ?)')
      .bind(body.name, body.description || null, body.service_type || null).run();
    const newTeam = await env.DB.prepare('SELECT * FROM teams WHERE id = ?').bind(result.meta.last_row_id).first();
    return json(newTeam, 201);
  }),

  route('GET', '/api/teams/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const team = await env.DB.prepare('SELECT * FROM teams WHERE id = ?').bind(id).first();
    if (!team) return notFound();
    const members = await env.DB.prepare(`
      SELECT m.*, tm.position FROM members m
      JOIN team_members tm ON tm.member_id = m.id
      WHERE tm.team_id = ? ORDER BY m.last_name ASC, m.first_name ASC
    `).bind(id).all();
    return json({ ...team, members: members.results });
  }),

  route('PUT', '/api/teams/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const body = await getBody(request);
    if (!body) return badRequest('Corps JSON invalide');
    await env.DB.prepare('UPDATE teams SET name=?, description=?, service_type=? WHERE id=?')
      .bind(body.name, body.description || null, body.service_type || null, id).run();
    const updated = await env.DB.prepare('SELECT * FROM teams WHERE id = ?').bind(id).first();
    return json(updated);
  }),

  route('DELETE', '/api/teams/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    await env.DB.prepare('DELETE FROM teams WHERE id = ?').bind(id).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  route('POST', '/api/teams/:id/members', async (request, env, params) => {
    const teamId = requireId(params);
    if (!teamId) return badRequest('ID équipe invalide');
    const body = await getBody(request);
    if (!body || !body.member_id) return badRequest('member_id requis');
    // Prevent duplicate membership
    const exists = await env.DB.prepare('SELECT id FROM team_members WHERE team_id = ? AND member_id = ?').bind(teamId, body.member_id).first();
    if (exists) return json({ error: 'Member already in team' }, 409);
    await env.DB.prepare('INSERT INTO team_members (team_id, member_id, position) VALUES (?, ?, ?)')
      .bind(teamId, body.member_id, body.position || null).run();
    return new Response(null, { status: 201, headers: CORS });
  }),

  // Update team member (position)
  route('PUT', '/api/teams/:tid/members/:mid', async (request, env, params) => {
    const teamId = requireId({ id: params.tid });
    const memberId = requireId({ id: params.mid });
    if (!teamId || !memberId) return badRequest('ID invalide');
    const body = await getBody(request);
    if (!body) return badRequest('Corps JSON invalide');
    await env.DB.prepare('UPDATE team_members SET position = ? WHERE team_id = ? AND member_id = ?')
      .bind(body.position || null, teamId, memberId).run();
    const updated = await env.DB.prepare('SELECT m.*, tm.position FROM members m JOIN team_members tm ON tm.member_id = m.id WHERE tm.team_id = ? AND m.id = ?')
      .bind(teamId, memberId).first();
    return json(updated);
  }),

  route('DELETE', '/api/teams/:tid/members/:mid', async (request, env, params) => {
    const teamId = requireId({ id: params.tid });
    const memberId = requireId({ id: params.mid });
    if (!teamId || !memberId) return badRequest('ID invalide');
    await env.DB.prepare('DELETE FROM team_members WHERE team_id = ? AND member_id = ?').bind(teamId, memberId).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // ========================================
  // SERVICE TYPES
  // ========================================
  route('GET', '/api/service-types', async (request, env) => {
    const result = await env.DB.prepare('SELECT * FROM service_types ORDER BY name ASC').all();
    return json(result.results);
  }),

  // ========================================
  // PLANS (Calendrier & Services)
  // ========================================
  route('GET', '/api/plans', async (request, env, params, url) => {
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');

    let query = `
      SELECT p.*, st.name as service_type_name,
        COUNT(pi.id) as items_count,
        COUNT(sp.id) as people_count
      FROM plans p
      LEFT JOIN service_types st ON st.id = p.service_type_id
      LEFT JOIN plan_items pi ON pi.plan_id = p.id
      LEFT JOIN scheduled_people sp ON sp.plan_id = p.id
    `;
    const binds = [];
    const conditions = [];

    if (month && year) {
      conditions.push("strftime('%m', p.date) = ? AND strftime('%Y', p.date) = ?");
      binds.push(month.padStart(2, '0'), year);
    } else if (year) {
      conditions.push("strftime('%Y', p.date) = ?");
      binds.push(year);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY p.id ORDER BY p.date ASC';

    const result = await env.DB.prepare(query).bind(...binds).all();
    return json(result.results);
  }),

  route('GET', '/api/plans/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const plan = await env.DB.prepare(`
      SELECT p.*, st.name as service_type_name
      FROM plans p
      LEFT JOIN service_types st ON st.id = p.service_type_id
      WHERE p.id = ?
    `).bind(id).first();
    if (!plan) return notFound();
    return json(plan);
  }),

  route('POST', '/api/plans', async (request, env) => {
    const body = await getBody(request);
    if (!body) return badRequest('Corps JSON invalide');
    const err = validate({
      date: { required: true, maxLength: 20 },
      service_type_id: { type: 'int' },
    }, body);
    if (err) return badRequest(err);
    const result = await env.DB.prepare(
      'INSERT INTO plans (service_type_id, date, time, theme, notes, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      body.service_type_id || null, body.date, body.time || null,
      body.theme || null, body.notes || null, body.status || 'planned'
    ).run();
    const newPlan = await env.DB.prepare(`
      SELECT p.*, st.name as service_type_name
      FROM plans p LEFT JOIN service_types st ON st.id = p.service_type_id
      WHERE p.id = ?
    `).bind(result.meta.last_row_id).first();
    triggerWebhooks(env, 'plan.created', newPlan).catch(() => {});
    return json(newPlan, 201);
  }),

  route('PUT', '/api/plans/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const body = await getBody(request);
    if (!body) return badRequest('Corps JSON invalide');
    const existing = await env.DB.prepare('SELECT * FROM plans WHERE id = ?').bind(id).first();
    if (!existing) return notFound();
    await env.DB.prepare(
      'UPDATE plans SET service_type_id=?, date=?, time=?, theme=?, notes=?, status=? WHERE id=?'
    ).bind(
      body.service_type_id !== undefined ? body.service_type_id : existing.service_type_id,
      body.date || existing.date,
      body.time !== undefined ? body.time : existing.time,
      body.theme !== undefined ? body.theme : existing.theme,
      body.notes !== undefined ? body.notes : existing.notes,
      body.status || existing.status,
      id
    ).run();
    const updated = await env.DB.prepare(`
      SELECT p.*, st.name as service_type_name
      FROM plans p LEFT JOIN service_types st ON st.id = p.service_type_id
      WHERE p.id = ?
    `).bind(id).first();
    if (updated) triggerWebhooks(env, 'plan.updated', updated).catch(() => {});
    return json(updated);
  }),

  route('DELETE', '/api/plans/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    await env.DB.prepare('DELETE FROM plans WHERE id = ?').bind(id).run();
    triggerWebhooks(env, 'plan.deleted', { id }).catch(() => {});
    return new Response(null, { status: 204, headers: CORS });
  }),

  // ========================================
  // PLAN ITEMS
  // ========================================
  route('GET', '/api/plans/:id/items', async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest('ID plan invalide');
    const plan = await env.DB.prepare('SELECT id FROM plans WHERE id = ?').bind(planId).first();
    if (!plan) return notFound('Plan non trouvé');
    const items = await env.DB.prepare(`
      SELECT pi.*, ps.arrangement_id, ps.transposed_key,
        a.name as arrangement_name, a.key as arrangement_key, a.tempo,
        s.title as song_title, s.id as song_id
      FROM plan_items pi
      LEFT JOIN plan_songs ps ON ps.plan_item_id = pi.id
      LEFT JOIN arrangements a ON a.id = ps.arrangement_id
      LEFT JOIN songs s ON s.id = a.song_id
      WHERE pi.plan_id = ?
      ORDER BY pi.position ASC
    `).bind(planId).all();
    return json(items.results);
  }),

  route('POST', '/api/plans/:id/items', async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest('ID plan invalide');
    const plan = await env.DB.prepare('SELECT id FROM plans WHERE id = ?').bind(planId).first();
    if (!plan) return notFound('Plan non trouvé');
    const body = await getBody(request);
    if (!body) return badRequest('Corps JSON invalide');
    const err = validate({
      type: { required: true, maxLength: 50 },
      title: { required: true, maxLength: 200 },
    }, body);
    if (err) return badRequest(err);

    let position = body.position;
    if (position === undefined || position === null) {
      const maxPos = await env.DB.prepare('SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM plan_items WHERE plan_id = ?').bind(planId).first();
      position = maxPos.next_pos;
    }

    const result = await env.DB.prepare(
      'INSERT INTO plan_items (plan_id, type, title, description, position, length_minutes) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      planId, body.type, body.title, body.description || null,
      position, body.length_minutes || null
    ).run();

    const newItem = await env.DB.prepare('SELECT * FROM plan_items WHERE id = ?').bind(result.meta.last_row_id).first();

    if (body.type === 'song' && body.arrangement_id) {
      await env.DB.prepare(
        'INSERT INTO plan_songs (plan_item_id, arrangement_id, transposed_key) VALUES (?, ?, ?)'
      ).bind(newItem.id, body.arrangement_id, body.transposed_key || null).run();
    }

    return json(newItem, 201);
  }),

  route('PUT', '/api/plan-items/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const existing = await env.DB.prepare('SELECT * FROM plan_items WHERE id = ?').bind(id).first();
    if (!existing) return notFound();
    const body = await getBody(request);
    if (!body) return badRequest('Corps JSON invalide');
    await env.DB.prepare(
      'UPDATE plan_items SET type=?, title=?, description=?, position=?, length_minutes=? WHERE id=?'
    ).bind(
      body.type || existing.type,
      body.title || existing.title,
      body.description !== undefined ? body.description : existing.description,
      body.position !== undefined ? body.position : existing.position,
      body.length_minutes !== undefined ? body.length_minutes : existing.length_minutes,
      id
    ).run();

    if (body.type === 'song' || existing.type === 'song') {
      if (body.arrangement_id !== undefined) {
        const existingPs = await env.DB.prepare('SELECT id FROM plan_songs WHERE plan_item_id = ?').bind(id).first();
        if (existingPs) {
          if (body.arrangement_id === null) {
            await env.DB.prepare('DELETE FROM plan_songs WHERE plan_item_id = ?').bind(id).run();
          } else {
            await env.DB.prepare('UPDATE plan_songs SET arrangement_id=?, transposed_key=? WHERE plan_item_id=?')
              .bind(body.arrangement_id, body.transposed_key || null, id).run();
          }
        } else if (body.arrangement_id !== null) {
          await env.DB.prepare(
            'INSERT INTO plan_songs (plan_item_id, arrangement_id, transposed_key) VALUES (?, ?, ?)'
          ).bind(id, body.arrangement_id, body.transposed_key || null).run();
        }
      }
    }

    const updated = await env.DB.prepare(`
      SELECT pi.*, ps.arrangement_id, ps.transposed_key,
        a.name as arrangement_name, s.title as song_title
      FROM plan_items pi
      LEFT JOIN plan_songs ps ON ps.plan_item_id = pi.id
      LEFT JOIN arrangements a ON a.id = ps.arrangement_id
      LEFT JOIN songs s ON s.id = a.song_id
      WHERE pi.id = ?
    `).bind(id).first();
    return json(updated);
  }),

  route('DELETE', '/api/plan-items/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    await env.DB.prepare('DELETE FROM plan_items WHERE id = ?').bind(id).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // ========================================
  // SCHEDULED PEOPLE (Bénévoles planifiés)
  // ========================================
  route('GET', '/api/plans/:id/scheduled-people', async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest('ID plan invalide');
    const plan = await env.DB.prepare('SELECT id FROM plans WHERE id = ?').bind(planId).first();
    if (!plan) return notFound('Plan non trouvé');
    const people = await env.DB.prepare(`
      SELECT sp.*, m.first_name, m.last_name, m.email, m.phone,
        t.name as team_name
      FROM scheduled_people sp
      JOIN members m ON m.id = sp.member_id
      LEFT JOIN teams t ON t.id = sp.team_id
      WHERE sp.plan_id = ?
      ORDER BY sp.position ASC, m.last_name ASC
    `).bind(planId).all();
    return json(people.results);
  }),

    route('POST', '/api/plans/:id/scheduled-people', async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest('ID plan invalide');
    const plan = await env.DB.prepare('SELECT id FROM plans WHERE id = ?').bind(planId).first();
    if (!plan) return notFound('Plan non trouvé');
    const body = await getBody(request);
    if (!body) return badRequest('Corps JSON invalide');
    const err = validate({
      member_id: { required: true, type: 'int' },
    }, body);
    // authorization: need scheduling permission
    if (!await hasPermission(request, env, 'schedule')) return json({ error: 'Forbidden' }, 403);
    // if forcing, require force_schedule permission
    if (body.force && !await hasPermission(request, env, 'force_schedule')) return json({ error: 'Forbidden to force' }, 403);
    if (err) return badRequest(err);
    // Prevent scheduling the same member twice for the same plan (even on another team)
    const conflict = await env.DB.prepare('SELECT id, team_id, position FROM scheduled_people WHERE plan_id = ? AND member_id = ?').bind(planId, body.member_id).first();
    if (conflict && !body.force) {
      return json({ error: 'Member already scheduled for this plan', conflict }, 409);
    }

    // If forcing, log the conflict for audit
    if (conflict && body.force) {
      await env.DB.prepare(`
        INSERT INTO scheduled_conflict_logs (plan_id, member_id, existing_scheduled_id, forced_by, note)
        VALUES (?, ?, ?, ?, ?)
      `).bind(planId, body.member_id, conflict.id, body.forced_by || 'system', body.note || null).run();
    }

    const result = await env.DB.prepare(
      'INSERT INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      planId, body.member_id, body.team_id || null,
      body.position || null, body.status || 'pending'
    ).run();
    const newEntry = await env.DB.prepare(`
      SELECT sp.*, m.first_name, m.last_name
      FROM scheduled_people sp
      JOIN members m ON m.id = sp.member_id
      WHERE sp.id = ?
    `).bind(result.meta.last_row_id).first();

    // If we logged a conflict above we may want to notify admin by email
    try {
      if (conflict && body.force) {
        const admin = env.ADMIN_EMAIL || env.EMAIL_FROM || null;
        if (admin && env.RESEND_API_KEY) {
          const plan = await env.DB.prepare('SELECT date, time FROM plans WHERE id = ?').bind(planId).first();
          const member = await env.DB.prepare('SELECT first_name, last_name, email FROM members WHERE id = ?').bind(body.member_id).first();
          const existingTeam = await env.DB.prepare('SELECT t.name FROM teams t WHERE t.id = ?').bind(conflict.team_id).first();
          const subject = `Conflit planifié forcé pour ${member.first_name} ${member.last_name}`;
          const frontend = env.FRONTEND_URL || 'https://eglise-app.pages.dev';
          const planLink = `${frontend}/plans/${planId}`;
          const conflictsLink = `${frontend}/conflicts`;

          // Prefer to create a one-time DB token if possible; otherwise fallback to HMAC
          let oneclickLinkHtml = '';
          try {
            // create table if not exists (idempotent)
            await env.DB.prepare(`CREATE TABLE IF NOT EXISTS email_oneclicks (
              id INTEGER PRIMARY KEY,
              token TEXT UNIQUE,
              payload_json TEXT,
              used INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              used_at DATETIME
            )`).run();

            const payload = { action: 'revert_assignment', existing_scheduled_id: conflict.id, plan_id: planId, member_id: body.member_id, exp: Math.floor(Date.now()/1000) + 60*60*24 };
            const payloadJson = JSON.stringify(payload);
            const dbToken = generateSecureToken(32);
            await env.DB.prepare('INSERT INTO email_oneclicks (token, payload_json, used) VALUES (?, ?, 0)').bind(dbToken, payloadJson).run();
            const oneclickFrontend = `${frontend}/admin/oneclick?token=${encodeURIComponent(dbToken)}`;
            oneclickLinkHtml = `<p><a href="${oneclickFrontend}">Annuler l'assignation existante (un clic)</a></p>`;
          } catch (e) {
            // fallback to HMAC token
            if (env.ONECLICK_SECRET) {
              try {
                const payload = { action: 'revert_assignment', existing_scheduled_id: conflict.id, plan_id: planId, exp: Math.floor(Date.now()/1000) + 60*60*24 };
                const token = await signOneClickToken(JSON.stringify(payload), env.ONECLICK_SECRET);
                const oneclickFrontend = `${frontend}/admin/oneclick?token=${encodeURIComponent(token)}`;
                oneclickLinkHtml = `<p><a href="${oneclickFrontend}">Annuler l'assignation existante (un clic)</a></p>`;
              } catch (err) {
                // ignore
              }
            }
          }

          const html = `<p>Un ajout forcé a été effectué.</p>
            <ul>
              <li>Service: <a href="${planLink}">${plan.date} ${plan.time || ''}</a></li>
              <li>Membre: ${member.first_name} ${member.last_name} (${member.email || 'no email'})</li>
              <li>Assignation existante: ${existingTeam ? existingTeam.name : ('#'+conflict.team_id)} — ${conflict.position || '-'} (scheduled id ${conflict.id})</li>
              <li>Forcé par: ${body.forced_by || 'system'}</li>
              <li>Note: ${body.note || ''}</li>
            </ul>
            <p><a href="${conflictsLink}">Voir les logs</a></p>
            ${oneclickLinkHtml}`;

          // send via Resend
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.RESEND_API_KEY}` },
            body: JSON.stringify({ from: env.EMAIL_FROM || admin, to: admin, subject, html })
          });
          const text = await res.text();
          let remote = null;
          try { remote = JSON.parse(text); } catch { remote = text }
          const status = res.ok ? 'sent' : 'failed';
          await env.DB.prepare('INSERT INTO email_logs (template_id, subject, body, recipient_email, recipient_member_id, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .bind(null, subject, html, admin, null, status, res.ok ? null : JSON.stringify(remote)).run();
        }
      }
    } catch (e) {
      // ignore notification errors
    }
    // Send push notification to the scheduled member
    try {
      const planForNotif = await env.DB.prepare('SELECT date, time, theme FROM plans WHERE id = ?').bind(planId).first();
      const memberTokens = await env.DB.prepare('SELECT token FROM notification_tokens WHERE member_id = ?').bind(body.member_id).all();
      if (memberTokens.results.length > 0 && env.FCM_SERVER_KEY) {
        const title = 'Nouvelle assignation';
        const msg = `Tu es planifié(e) pour le ${planForNotif.date}${planForNotif.time ? ' à ' + planForNotif.time.slice(0,5) : ''}`;
        for (const t of memberTokens.results) {
          fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `key=${env.FCM_SERVER_KEY}` },
            body: JSON.stringify({ to: t.token, notification: { title, body: msg }, data: { plan_id: String(planId), action: 'view_plan' } }),
          }).catch(() => {});
        }
      }
    } catch (e) { /* ignore push errors */ }

    triggerWebhooks(env, 'schedule.created', newEntry).catch(() => {});
    return json(newEntry, 201);
  }),

  route('PUT', '/api/plans/:pid/scheduled-people/:sid', async (request, env, params) => {
    const planId = requireId({ id: params.pid });
    const scheduledId = requireId({ id: params.sid });
    if (!planId || !scheduledId) return badRequest('ID invalide');
    const existing = await env.DB.prepare('SELECT * FROM scheduled_people WHERE id = ? AND plan_id = ?').bind(scheduledId, planId).first();
    if (!existing) return notFound();
    const body = await getBody(request);
    if (!body) return badRequest('Corps JSON invalide');
    await env.DB.prepare(
      'UPDATE scheduled_people SET position=?, status=? WHERE id=? AND plan_id=?'
    ).bind(
      body.position !== undefined ? body.position : existing.position,
      body.status || existing.status,
      scheduledId, planId
    ).run();
    const updated = await env.DB.prepare(`
      SELECT sp.*, m.first_name, m.last_name, m.email, m.phone, t.name as team_name
      FROM scheduled_people sp
      JOIN members m ON m.id = sp.member_id
      LEFT JOIN teams t ON t.id = sp.team_id
      WHERE sp.id = ?
    `).bind(scheduledId).first();
    return json(updated);
  }),

    route('DELETE', '/api/plans/:pid/scheduled-people/:sid', async (request, env, params) => {
      const planId = requireId({ id: params.pid });
      const scheduledId = requireId({ id: params.sid });
      if (!planId || !scheduledId) return badRequest('ID invalide');
      await env.DB.prepare('DELETE FROM scheduled_people WHERE id = ? AND plan_id = ?').bind(scheduledId, planId).run();
      return new Response(null, { status: 204, headers: CORS });
    }),

    // Attendance endpoints
    route('GET', '/api/attendances', async (request, env) => {
      const attendances = await env.DB.prepare(`
        SELECT a.*, m.first_name, m.last_name, p.date as plan_date, p.time as plan_time
        FROM attendances a
        JOIN members m ON m.id = a.member_id
        JOIN plans p ON p.id = a.plan_id
        ORDER BY a.check_in_time DESC
      `).all();
      return json(attendances.results);
    }),

    route('POST', '/api/attendances', async (request, env) => {
      const body = await getBody(request);
      if (!body) return badRequest('Invalid JSON body');
      
      // Validate required fields
      if (!body.plan_id || !body.member_id) {
        return badRequest('plan_id and member_id are required');
      }

      // Check if already checked in for this plan
      const existing = await env.DB.prepare(
        'SELECT id FROM attendances WHERE plan_id = ? AND member_id = ?'
      ).bind(body.plan_id, body.member_id).first();
      
      if (existing) {
        return badRequest('Already checked in for this service');
      }

      const result = await env.DB.prepare(
        'INSERT INTO attendances (plan_id, member_id, status, notes) VALUES (?, ?, ?, ?)'
      ).bind(
        body.plan_id, 
        body.member_id, 
        body.status || 'present',
        body.notes || null
      ).run();

      const attendance = await env.DB.prepare(`
        SELECT a.*, m.first_name, m.last_name
        FROM attendances a
        JOIN members m ON m.id = a.member_id
        WHERE a.id = ?
      `).bind(result.meta.last_row_id).first();
      
      return json(attendance, 201);
    }),

    route('GET', '/api/attendances/:id', async (request, env, params) => {
      const attendanceId = requireId({ id: params.id });
      if (!attendanceId) return badRequest('Invalid ID');
      
      const attendance = await env.DB.prepare(`
        SELECT a.*, m.first_name, m.last_name, p.date as plan_date, p.time as plan_time
        FROM attendances a
        JOIN members m ON m.id = a.member_id
        JOIN plans p ON p.id = a.plan_id
        WHERE a.id = ?
      `).bind(attendanceId).first();
      
      if (!attendance) return notFound();
      return json(attendance);
    }),

    route('PUT', '/api/attendances/:id', async (request, env, params) => {
      const attendanceId = requireId({ id: params.id });
      if (!attendanceId) return badRequest('Invalid ID');
      
      const body = await getBody(request);
      if (!body) return badRequest('Invalid JSON body');
      
      await env.DB.prepare(
        'UPDATE attendances SET status=?, notes=? WHERE id=?'
      ).bind(
        body.status || null,
        body.notes || null,
        attendanceId
      ).run();
      
      const attendance = await env.DB.prepare(`
        SELECT a.*, m.first_name, m.last_name
        FROM attendances a
        JOIN members m ON m.id = a.member_id
        WHERE a.id = ?
      `).bind(attendanceId).first();
      
      return json(attendance);
    }),

    route('DELETE', '/api/attendances/:id', async (request, env, params) => {
      const attendanceId = requireId({ id: params.id });
      if (!attendanceId) return badRequest('Invalid ID');
      
      await env.DB.prepare('DELETE FROM attendances WHERE id = ?').bind(attendanceId).run();
      return new Response(null, { status: 204, headers: CORS });
    }),

    route('GET', '/api/plans/:pid/attendances', async (request, env, params) => {
      const planId = requireId({ id: params.pid });
      if (!planId) return badRequest('Invalid plan ID');
      
      const attendances = await env.DB.prepare(`
        SELECT a.*, m.first_name, m.last_name
        FROM attendances a
        JOIN members m ON m.id = a.member_id
        WHERE a.plan_id = ?
        ORDER BY a.check_in_time DESC
      `).bind(planId).all();
      
      return json(attendances.results);
    }),

    // House Groups endpoints
    route('GET', '/api/house-groups', async (request, env) => {
      const groups = await env.DB.prepare(`
        SELECT hg.*, m.first_name as leader_first, m.last_name as leader_last,
          COUNT(gm.id) as member_count
        FROM house_groups hg
        LEFT JOIN group_members gm ON gm.group_id = hg.id
        LEFT JOIN members m ON m.id = hg.leader_id
        GROUP BY hg.id
        ORDER BY hg.name ASC
      `).all();
      return json(groups.results);
    }),

    route('POST', '/api/house-groups', async (request, env) => {
      const body = await getBody(request);
      if (!body) return badRequest('Invalid JSON body');
      if (!body.name) return badRequest('Name is required');
      
      const result = await env.DB.prepare(`
        INSERT INTO house_groups (name, description, leader_id, meeting_day, meeting_time, location)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        body.name,
        body.description || null,
        body.leader_id || null,
        body.meeting_day || null,
        body.meeting_time || null,
        body.location || null
      ).run();
      
      const newGroup = await env.DB.prepare(`
        SELECT hg.*, m.first_name as leader_first, m.last_name as leader_last
        FROM house_groups hg
        LEFT JOIN members m ON m.id = hg.leader_id
        WHERE hg.id = ?
      `).bind(result.meta.last_row_id).first();
      
      return json(newGroup, 201);
    }),

    route('GET', '/api/house-groups/:id', async (request, env, params) => {
      const groupId = requireId({ id: params.id });
      if (!groupId) return badRequest('Invalid ID');
      
      const group = await env.DB.prepare(`
        SELECT hg.*, m.first_name as leader_first, m.last_name as leader_last
        FROM house_groups hg
        LEFT JOIN members m ON m.id = hg.leader_id
        WHERE hg.id = ?
      `).bind(groupId).first();
      
      if (!group) return notFound();
      
      // Get members
      group.members = (await env.DB.prepare(`
        SELECT gm.*, m.first_name, m.last_name
        FROM group_members gm
        JOIN members m ON m.id = gm.member_id
        WHERE gm.group_id = ?
        ORDER BY m.last_name ASC
      `).bind(groupId).all()).results;
      
      // Get meetings
      group.meetings = (await env.DB.prepare(`
        SELECT * FROM group_meetings
        WHERE group_id = ?
        ORDER BY date DESC
      `).bind(groupId).all()).results;
      
      return json(group);
    }),

    route('PUT', '/api/house-groups/:id', async (request, env, params) => {
      const groupId = requireId({ id: params.id });
      if (!groupId) return badRequest('Invalid ID');
      
      const existing = await env.DB.prepare('SELECT * FROM house_groups WHERE id = ?').bind(groupId).first();
      if (!existing) return notFound();
      
      const body = await getBody(request);
      if (!body) return badRequest('Invalid JSON body');
      
      await env.DB.prepare(`
        UPDATE house_groups SET name=?, description=?, leader_id=?, meeting_day=?, meeting_time=?, location=?
        WHERE id=?
      `).bind(
        body.name || existing.name,
        body.description !== undefined ? body.description : existing.description,
        body.leader_id !== undefined ? (body.leader_id || null) : existing.leader_id,
        body.meeting_day !== undefined ? (body.meeting_day || null) : existing.meeting_day,
        body.meeting_time !== undefined ? (body.meeting_time || null) : existing.meeting_time,
        body.location !== undefined ? (body.location || null) : existing.location,
        groupId
      ).run();
      
      const updated = await env.DB.prepare(`
        SELECT hg.*, m.first_name as leader_first, m.last_name as leader_last
        FROM house_groups hg
        LEFT JOIN members m ON m.id = hg.leader_id
        WHERE hg.id = ?
      `).bind(groupId).first();
      
      return json(updated);
    }),

    route('DELETE', '/api/house-groups/:id', async (request, env, params) => {
      const groupId = requireId({ id: params.id });
      if (!groupId) return badRequest('Invalid ID');
      
      await env.DB.prepare('DELETE FROM house_groups WHERE id = ?').bind(groupId).run();
      return new Response(null, { status: 204, headers: CORS });
    }),

    // Group members
    route('POST', '/api/house-groups/:gid/members', async (request, env, params) => {
      const groupId = requireId({ id: params.gid });
      if (!groupId) return badRequest('Invalid group ID');
      
      const body = await getBody(request);
      if (!body) return badRequest('Invalid JSON body');
      if (!body.member_id) return badRequest('member_id is required');
      
      await env.DB.prepare(`
        INSERT OR IGNORE INTO group_members (group_id, member_id, role)
        VALUES (?, ?, ?)
      `).bind(groupId, body.member_id, body.role || 'member').run();
      
      return json({ success: true }, 201);
    }),

    route('DELETE', '/api/house-groups/:gid/members/:mid', async (request, env, params) => {
      const groupId = requireId({ id: params.gid });
      const memberId = requireId({ id: params.mid });
      if (!groupId || !memberId) return badRequest('Invalid ID');
      
      await env.DB.prepare('DELETE FROM group_members WHERE group_id = ? AND member_id = ?').bind(groupId, memberId).run();
      return new Response(null, { status: 204, headers: CORS });
    }),

    // Group meetings
    route('GET', '/api/house-groups/:gid/meetings', async (request, env, params) => {
      const groupId = requireId({ id: params.gid });
      if (!groupId) return badRequest('Invalid group ID');
      
      const meetings = await env.DB.prepare(`
        SELECT * FROM group_meetings
        WHERE group_id = ?
        ORDER BY date DESC
      `).bind(groupId).all();
      
      return json(meetings.results);
    }),

    route('POST', '/api/house-groups/:gid/meetings', async (request, env, params) => {
      const groupId = requireId({ id: params.gid });
      if (!groupId) return badRequest('Invalid group ID');
      
      const body = await getBody(request);
      if (!body) return badRequest('Invalid JSON body');
      if (!body.date) return badRequest('date is required');
      
      const result = await env.DB.prepare(`
        INSERT INTO group_meetings (group_id, date, notes)
        VALUES (?, ?, ?)
      `).bind(groupId, body.date, body.notes || null).run();
      
      const meeting = await env.DB.prepare('SELECT * FROM group_meetings WHERE id = ?')
        .bind(result.meta.last_row_id).first();
      
      return json(meeting, 201);
    }),

    // Email Templates
    route('GET', '/api/email-templates', async (request, env) => {
      const templates = await env.DB.prepare(`
        SELECT et.*, COUNT(el.id) as usage_count
        FROM email_templates et
        LEFT JOIN email_logs el ON el.template_id = et.id
        GROUP BY et.id
        ORDER BY et.name ASC
      `).all();
      return json(templates.results);
    }),

    route('POST', '/api/email-templates', async (request, env) => {
      const body = await getBody(request);
      if (!body) return badRequest('Invalid JSON body');
      if (!body.name || !body.subject || !body.body) {
        return badRequest('name, subject and body are required');
      }
      
      const result = await env.DB.prepare(`
        INSERT INTO email_templates (name, subject, body, variables)
        VALUES (?, ?, ?, ?)
      `).bind(
        body.name,
        body.subject,
        body.body,
        body.variables || null
      ).run();
      
      const newTemplate = await env.DB.prepare(`
        SELECT * FROM email_templates WHERE id = ?
      `).bind(result.meta.last_row_id).first();
      
      return json(newTemplate, 201);
    }),

    route('GET', '/api/email-templates/:id', async (request, env, params) => {
      const templateId = requireId({ id: params.id });
      if (!templateId) return badRequest('Invalid ID');
      
      const template = await env.DB.prepare(`
        SELECT * FROM email_templates WHERE id = ?
      `).bind(templateId).first();
      
      if (!template) return notFound();
      return json(template);
    }),

    route('PUT', '/api/email-templates/:id', async (request, env, params) => {
      const templateId = requireId({ id: params.id });
      if (!templateId) return badRequest('Invalid ID');
      
      const existing = await env.DB.prepare('SELECT * FROM email_templates WHERE id = ?').bind(templateId).first();
      if (!existing) return notFound();
      
      const body = await getBody(request);
      if (!body) return badRequest('Invalid JSON body');
      
      await env.DB.prepare(`
        UPDATE email_templates SET name=?, subject=?, body=?, variables=?
        WHERE id=?
      `).bind(
        body.name || existing.name,
        body.subject || existing.subject,
        body.body || existing.body,
        body.variables !== undefined ? body.variables : existing.variables,
        templateId
      ).run();
      
      const updated = await env.DB.prepare(`
        SELECT * FROM email_templates WHERE id = ?
      `).bind(templateId).first();
      
      return json(updated);
    }),

    route('DELETE', '/api/email-templates/:id', async (request, env, params) => {
      const templateId = requireId({ id: params.id });
      if (!templateId) return badRequest('Invalid ID');
      
      await env.DB.prepare('DELETE FROM email_templates WHERE id = ?').bind(templateId).run();
      return new Response(null, { status: 204, headers: CORS });
    }),

    // Email Logs
    route('GET', '/api/email-logs', async (request, env) => {
      const logs = await env.DB.prepare(`
        SELECT el.*, et.name as template_name
        FROM email_logs el
        LEFT JOIN email_templates et ON et.id = el.template_id
        ORDER BY el.sent_at DESC
      `).all();
      return json(logs.results);
    }),

    // Member exceptions management (admin)
    route('GET', '/api/member-exceptions', async (request, env) => {
      if (!await hasPermission(request, env, 'manage_members')) return json({ error: 'Forbidden' }, 403);
      const rows = await env.DB.prepare('SELECT me.*, m.first_name, m.last_name FROM member_exceptions me LEFT JOIN members m ON m.id = me.member_id ORDER BY me.created_at DESC').all();
      return json(rows.results);
    }),

    route('POST', '/api/member-exceptions', async (request, env) => {
      if (!await hasPermission(request, env, 'manage_members')) return json({ error: 'Forbidden' }, 403);
      const body = await getBody(request);
      if (!body || !body.member_id || !body.permission) return badRequest('member_id and permission required');
      await env.DB.prepare('INSERT INTO member_exceptions (member_id, permission, granted) VALUES (?, ?, ?)').bind(body.member_id, body.permission, !!body.granted).run();
      return json({ success: true }, 201);
    }),

    route('DELETE', '/api/member-exceptions/:id', async (request, env, params) => {
      if (!await hasPermission(request, env, 'manage_members')) return json({ error: 'Forbidden' }, 403);
      const id = requireId(params);
      if (!id) return badRequest('Invalid ID');
      await env.DB.prepare('DELETE FROM member_exceptions WHERE id = ?').bind(id).run();
      return new Response(null, { status: 204, headers: CORS });
    }),

    // Admin: update member role
    route('PUT', '/api/members/:id/role', async (request, env, params) => {
      if (!await hasPermission(request, env, 'manage_members')) return json({ error: 'Forbidden' }, 403);
      const id = requireId(params);
      if (!id) return badRequest('Invalid ID');
      const body = await getBody(request);
      if (!body || !body.role) return badRequest('role required');
      await env.DB.prepare('UPDATE members SET role = ? WHERE id = ?').bind(body.role, id).run();
      const updated = await env.DB.prepare('SELECT * FROM members WHERE id = ?').bind(id).first();
      return json(updated);
    }),

    // ========================================
    // MEMBER PORTAL (self-service)
    // ========================================
    route('GET', '/api/me', async (request, env) => {
      const member = await getMemberFromRequest(request, env);
      if (!member) return json({ error: 'Not authenticated' }, 401);
      const teams = await env.DB.prepare(`
        SELECT t.*, tm.position FROM team_members tm
        JOIN teams t ON t.id = tm.team_id
        WHERE tm.member_id = ?
      `).bind(member.id).all();
      return json({ ...member, teams: teams.results });
    }),

    route('PUT', '/api/me', async (request, env) => {
      const member = await getMemberFromRequest(request, env);
      if (!member) return json({ error: 'Not authenticated' }, 401);
      const body = await getBody(request);
      if (!body) return badRequest('Invalid JSON');
      // Only allow updating safe fields
      const allowed = ['phone', 'notes', 'birth_date'];
      const updates = [];
      const values = [];
      for (const field of allowed) {
        if (body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(body[field]);
        }
      }
      if (updates.length === 0) return json(member);
      values.push(member.id);
      await env.DB.prepare(`UPDATE members SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
      const updated = await env.DB.prepare('SELECT * FROM members WHERE id = ?').bind(member.id).first();
      return json(updated);
    }),

    route('GET', '/api/me/schedule', async (request, env) => {
      const member = await getMemberFromRequest(request, env);
      if (!member) return json({ error: 'Not authenticated' }, 401);
      const rows = await env.DB.prepare(`
        SELECT sp.*, p.date, p.time, p.theme, p.status as plan_status,
               st.name as service_type_name
        FROM scheduled_people sp
        JOIN plans p ON p.id = sp.plan_id
        LEFT JOIN service_types st ON st.id = p.service_type_id
        WHERE sp.member_id = ? AND p.date >= date('now')
        ORDER BY p.date ASC, p.time ASC
      `).bind(member.id).all();
      return json(rows.results);
    }),

    // ========================================
    // VOLUNTEER PREFERENCES
    // ========================================
    route('GET', '/api/volunteer-preferences/:memberId', async (request, env, params) => {
      const memberId = parseInt(params.memberId, 10);
      if (!memberId) return badRequest('Invalid member ID');
      const prefs = await env.DB.prepare('SELECT * FROM volunteer_preferences WHERE member_id = ?').bind(memberId).first();
      return json(prefs || { member_id: memberId, unavailable_dates: '[]', max_services_per_month: 4, notes: '' });
    }),

    route('PUT', '/api/volunteer-preferences/:memberId', async (request, env, params) => {
      const memberId = parseInt(params.memberId, 10);
      if (!memberId) return badRequest('Invalid member ID');
      const body = await getBody(request);
      if (!body) return badRequest('Invalid JSON');
      const existing = await env.DB.prepare('SELECT id FROM volunteer_preferences WHERE member_id = ?').bind(memberId).first();
      const dates = JSON.stringify(body.unavailable_dates || []);
      const max = body.max_services_per_month ?? 4;
      const notes = body.notes || '';
      if (existing) {
        await env.DB.prepare('UPDATE volunteer_preferences SET unavailable_dates = ?, max_services_per_month = ?, notes = ? WHERE member_id = ?')
          .bind(dates, max, notes, memberId).run();
      } else {
        await env.DB.prepare('INSERT INTO volunteer_preferences (member_id, unavailable_dates, max_services_per_month, notes) VALUES (?, ?, ?, ?)')
          .bind(memberId, dates, max, notes).run();
      }
      const updated = await env.DB.prepare('SELECT * FROM volunteer_preferences WHERE member_id = ?').bind(memberId).first();
      return json(updated);
    }),

    // ========================================
    // PLAN TEMPLATES
    // ========================================
    route('GET', '/api/plan-templates', async (request, env) => {
      const rows = await env.DB.prepare(`
        SELECT pt.*, COUNT(pti.id) as item_count
        FROM plan_templates pt
        LEFT JOIN plan_template_items pti ON pti.plan_template_id = pt.id
        GROUP BY pt.id ORDER BY pt.name ASC
      `).all();
      return json(rows.results);
    }),

    route('POST', '/api/plan-templates', async (request, env) => {
      const body = await getBody(request);
      if (!body || !body.name) return badRequest('name required');
      const stmt = await env.DB.prepare('INSERT INTO plan_templates (name, description, service_type_id) VALUES (?, ?, ?)')
        .bind(body.name, body.description || null, body.service_type_id || null).run();
      const created = await env.DB.prepare('SELECT * FROM plan_templates WHERE id = ?').bind(stmt.meta.last_row_id).first();
      return json(created, 201);
    }),

    route('GET', '/api/plan-templates/:id', async (request, env, params) => {
      const id = requireId(params);
      if (!id) return badRequest('Invalid ID');
      const template = await env.DB.prepare('SELECT * FROM plan_templates WHERE id = ?').bind(id).first();
      if (!template) return notFound();
      const items = await env.DB.prepare('SELECT * FROM plan_template_items WHERE plan_template_id = ? ORDER BY position ASC').bind(id).all();
      template.items = items.results;
      return json(template);
    }),

    route('PUT', '/api/plan-templates/:id', async (request, env, params) => {
      const id = requireId(params);
      if (!id) return badRequest('Invalid ID');
      const body = await getBody(request);
      if (!body) return badRequest('Invalid JSON');
      await env.DB.prepare('UPDATE plan_templates SET name = COALESCE(?, name), description = COALESCE(?, description), service_type_id = COALESCE(?, service_type_id) WHERE id = ?')
        .bind(body.name || null, body.description ?? null, body.service_type_id ?? null, id).run();
      const updated = await env.DB.prepare('SELECT * FROM plan_templates WHERE id = ?').bind(id).first();
      return json(updated);
    }),

    route('DELETE', '/api/plan-templates/:id', async (request, env, params) => {
      const id = requireId(params);
      if (!id) return badRequest('Invalid ID');
      await env.DB.prepare('DELETE FROM plan_templates WHERE id = ?').bind(id).run();
      return new Response(null, { status: 204, headers: CORS });
    }),

    // Plan template items
    route('GET', '/api/plan-templates/:id/items', async (request, env, params) => {
      const id = requireId(params);
      if (!id) return badRequest('Invalid ID');
      const items = await env.DB.prepare('SELECT * FROM plan_template_items WHERE plan_template_id = ? ORDER BY position ASC').bind(id).all();
      return json(items.results);
    }),

    route('POST', '/api/plan-templates/:id/items', async (request, env, params) => {
      const templateId = requireId(params);
      if (!templateId) return badRequest('Invalid template ID');
      const body = await getBody(request);
      if (!body || !body.type || !body.title) return badRequest('type and title required');
      const maxPos = await env.DB.prepare('SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM plan_template_items WHERE plan_template_id = ?').bind(templateId).first();
      const stmt = await env.DB.prepare('INSERT INTO plan_template_items (plan_template_id, type, title, description, position, length_minutes, arrangement_id, transposed_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(templateId, body.type, body.title, body.description || null, body.position ?? maxPos.next_pos, body.length_minutes || null, body.arrangement_id || null, body.transposed_key || null).run();
      const created = await env.DB.prepare('SELECT * FROM plan_template_items WHERE id = ?').bind(stmt.meta.last_row_id).first();
      return json(created, 201);
    }),

    route('PUT', '/api/plan-template-items/:id', async (request, env, params) => {
      const id = requireId(params);
      if (!id) return badRequest('Invalid ID');
      const body = await getBody(request);
      if (!body) return badRequest('Invalid JSON');
      await env.DB.prepare(`UPDATE plan_template_items SET
        type = COALESCE(?, type), title = COALESCE(?, title), description = COALESCE(?, description),
        position = COALESCE(?, position), length_minutes = COALESCE(?, length_minutes),
        arrangement_id = COALESCE(?, arrangement_id), transposed_key = COALESCE(?, transposed_key)
        WHERE id = ?`)
        .bind(body.type || null, body.title || null, body.description ?? null, body.position ?? null, body.length_minutes ?? null, body.arrangement_id ?? null, body.transposed_key ?? null, id).run();
      const updated = await env.DB.prepare('SELECT * FROM plan_template_items WHERE id = ?').bind(id).first();
      return json(updated);
    }),

    route('DELETE', '/api/plan-template-items/:id', async (request, env, params) => {
      const id = requireId(params);
      if (!id) return badRequest('Invalid ID');
      await env.DB.prepare('DELETE FROM plan_template_items WHERE id = ?').bind(id).run();
      return new Response(null, { status: 204, headers: CORS });
    }),

    // Apply template: create a plan from a template
    route('POST', '/api/plan-templates/:id/apply', async (request, env, params) => {
      const templateId = requireId(params);
      if (!templateId) return badRequest('Invalid template ID');
      const template = await env.DB.prepare('SELECT * FROM plan_templates WHERE id = ?').bind(templateId).first();
      if (!template) return notFound('Template not found');
      const body = await getBody(request);
      if (!body || !body.date) return badRequest('date required');
      // Create the plan
      const planStmt = await env.DB.prepare('INSERT INTO plans (service_type_id, date, time, theme, notes, status) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(template.service_type_id, body.date, body.time || null, body.theme || null, body.notes || null, 'planned').run();
      const planId = planStmt.meta.last_row_id;
      // Copy items
      const items = await env.DB.prepare('SELECT * FROM plan_template_items WHERE plan_template_id = ? ORDER BY position ASC').bind(templateId).all();
      for (const item of items.results) {
        await env.DB.prepare('INSERT INTO plan_items (plan_id, type, title, description, position, length_minutes) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(planId, item.type, item.title, item.description, item.position, item.length_minutes).run();
        // If song item with arrangement, link it
        if (item.type === 'song' && item.arrangement_id) {
          const planItemId = (await env.DB.prepare('SELECT id FROM plan_items WHERE plan_id = ? ORDER BY id DESC LIMIT 1').bind(planId).first()).id;
          await env.DB.prepare('INSERT INTO plan_songs (plan_item_id, arrangement_id, transposed_key) VALUES (?, ?, ?)')
            .bind(planItemId, item.arrangement_id, item.transposed_key || null).run();
        }
      }
      const plan = await env.DB.prepare('SELECT * FROM plans WHERE id = ?').bind(planId).first();
      return json(plan, 201);
    }),

    // Scheduled conflict logs (audit)
    route('GET', '/api/scheduled-conflict-logs', async (request, env, params, url) => {
      // authorization
      if (!await hasPermission(request, env, 'view_conflicts')) return json({ error: 'Forbidden' }, 403);
      const planId = url.searchParams.get('plan_id');
      const member = url.searchParams.get('member');
      const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
      const per = Math.min(100, parseInt(url.searchParams.get('per') || '50', 10) || 50);
      const offset = (page - 1) * per;

      let query = `
        SELECT scl.*, m.first_name, m.last_name, t.name as existing_team_name
        FROM scheduled_conflict_logs scl
        LEFT JOIN members m ON m.id = scl.member_id
        LEFT JOIN scheduled_people sp ON sp.id = scl.existing_scheduled_id
        LEFT JOIN teams t ON t.id = sp.team_id
      `;
      const binds = [];
      const conditions = [];
      if (planId) {
        conditions.push('scl.plan_id = ?'); binds.push(planId);
      }
      if (member) {
        conditions.push('(m.first_name || " " || m.last_name) LIKE ?'); binds.push('%' + member + '%');
      }
      if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
      query += ' ORDER BY scl.created_at DESC LIMIT ? OFFSET ?';
      binds.push(per, offset);
      const rows = await env.DB.prepare(query).bind(...binds).all();
      return json({ rows: rows.results, page, per });
    }),

    // ========================================
    // BULK EMAIL
    // ========================================
    route('POST', '/api/send-bulk-email', async (request, env) => {
      const body = await getBody(request);
      if (!body || !body.subject || !body.body) return badRequest('subject and body required');
      if (!body.team_id && !body.plan_id && !body.member_ids) return badRequest('team_id, plan_id, or member_ids required');

      const apiKey = env.RESEND_API_KEY;
      const from = env.EMAIL_FROM || 'no-reply@example.com';
      if (!apiKey) return badRequest('RESEND_API_KEY not configured');

      let recipients = [];

      if (body.team_id) {
        const rows = await env.DB.prepare(`
          SELECT DISTINCT m.email, m.id as member_id FROM members m
          JOIN team_members tm ON tm.member_id = m.id
          WHERE tm.team_id = ? AND m.email IS NOT NULL AND m.email != ''
        `).bind(body.team_id).all();
        recipients = rows.results;
      } else if (body.plan_id) {
        const rows = await env.DB.prepare(`
          SELECT DISTINCT m.email, m.id as member_id FROM members m
          JOIN scheduled_people sp ON sp.member_id = m.id
          WHERE sp.plan_id = ? AND m.email IS NOT NULL AND m.email != ''
        `).bind(body.plan_id).all();
        recipients = rows.results;
      } else if (body.member_ids) {
        const placeholders = body.member_ids.map(() => '?').join(',');
        const rows = await env.DB.prepare(`
          SELECT email, id as member_id FROM members WHERE id IN (${placeholders}) AND email IS NOT NULL AND email != ''
        `).bind(...body.member_ids).all();
        recipients = rows.results;
      }

      if (recipients.length === 0) return json({ error: 'No recipients found' }, 400);

      const results = { sent: 0, failed: 0, errors: [] };

      for (const r of recipients) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ from, to: r.email, subject: body.subject, html: body.body }),
          });
          if (res.ok) {
            results.sent++;
            await env.DB.prepare('INSERT INTO email_logs (subject, body, recipient_email, recipient_member_id, status) VALUES (?, ?, ?, ?, ?)')
              .bind(body.subject, body.body, r.email, r.member_id || null, 'sent').run();
          } else {
            results.failed++;
            const err = await res.text();
            results.errors.push(`${r.email}: ${err}`);
          }
        } catch (e) {
          results.failed++;
          results.errors.push(`${r.email}: ${e.message}`);
        }
      }

      return json(results);
    }),

    // ========================================
    // STATS (for dashboard)
    // ========================================
    route('GET', '/api/stats', async (request, env) => {
      const [members, activeMembers, upcomingPlans, songs, pendingSchedule, teams] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as c FROM members').first(),
        env.DB.prepare("SELECT COUNT(*) as c FROM members WHERE membership_type = 'member'").first(),
        env.DB.prepare("SELECT COUNT(*) as c FROM plans WHERE date >= date('now') AND status = 'planned'").first(),
        env.DB.prepare('SELECT COUNT(*) as c FROM songs WHERE id IN (SELECT DISTINCT song_id FROM arrangements)').first(),
        env.DB.prepare("SELECT COUNT(*) as c FROM scheduled_people WHERE status = 'pending'").first(),
        env.DB.prepare('SELECT COUNT(*) as c FROM teams').first(),
      ]);
      return json({
        members: members.c,
        activeMembers: activeMembers.c,
        upcomingPlans: upcomingPlans.c,
        songsWithArrangements: songs.c,
        pendingConfirmations: pendingSchedule.c,
        teams: teams.c,
      });
    }),

    route('POST', '/api/email-logs', async (request, env) => {
      const body = await getBody(request);
      if (!body) return badRequest('Invalid JSON body');
      if (!body.subject || !body.body || !body.recipient_email) {
        return badRequest('subject, body and recipient_email are required');
      }
      
      const result = await env.DB.prepare(`
        INSERT INTO email_logs (template_id, subject, body, recipient_email, recipient_member_id, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        body.template_id || null,
        body.subject,
        body.body,
        body.recipient_email,
        body.recipient_member_id || null,
        body.status || 'sent'
      ).run();
      
      const log = await env.DB.prepare(`
        SELECT el.*, et.name as template_name
        FROM email_logs el
        LEFT JOIN email_templates et ON et.id = el.template_id
        WHERE el.id = ?
      `).bind(result.meta.last_row_id).first();
      
      return json(log, 201);
    }),

    // Send email via Resend (https://resend.com) and log result
    route('POST', '/api/send-email', async (request, env) => {
      const body = await getBody(request);
      if (!body) return badRequest('Invalid JSON body');

      // Required fields: recipient_email, subject, body (html)
      if (!body.recipient_email || !body.subject || !body.body) {
        return badRequest('recipient_email, subject and body are required');
      }

      // Provider configuration from environment
      const apiKey = env.RESEND_API_KEY;
      const from = env.EMAIL_FROM || 'no-reply@example.com';
      if (!apiKey) return badRequest('Email provider not configured (RESEND_API_KEY)');

      // Build the payload for Resend
      const payload = {
        from,
        to: body.recipient_email,
        subject: body.subject,
        html: body.body,
      };

      let sendStatus = 'pending';
      let errorMessage = null;
      let remoteResponse = null;

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        try { remoteResponse = JSON.parse(text); } catch { remoteResponse = text; }

        if (!res.ok) {
          sendStatus = 'failed';
          errorMessage = (remoteResponse && remoteResponse.error) ? JSON.stringify(remoteResponse) : `HTTP ${res.status}`;
        } else {
          sendStatus = 'sent';
        }
      } catch (e) {
        sendStatus = 'failed';
        errorMessage = e.message || String(e);
      }

      // Insert into email_logs
      try {
        await env.DB.prepare(`
          INSERT INTO email_logs (template_id, subject, body, recipient_email, recipient_member_id, status, error_message)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          body.template_id || null,
          body.subject,
          body.body,
          body.recipient_email,
          body.recipient_member_id || null,
          sendStatus,
          errorMessage
        ).run();
      } catch (e) {
        // If logging fails, return send failure
        return json({ success: false, error: 'Failed to write email log', details: e.message || String(e) }, 500);
      }

      return json({ success: sendStatus === 'sent', status: sendStatus, remote: remoteResponse, error: errorMessage });
    }),

    // One-click action endpoint — executes an admin action based on a token
    route('POST', '/api/oneclick', async (request, env) => {
      const body = await getBody(request);
      if (!body || !body.token) return badRequest('token required');
      if (!env.ONECLICK_SECRET) return json({ error: 'Not configured' }, 500);
      // If email_oneclicks table exists, prefer DB-driven one-time tokens
      let payload = null;
      try {
        const dbRow = await env.DB.prepare('SELECT * FROM email_oneclicks WHERE token = ?').bind(body.token).first();
        if (dbRow) {
          if (dbRow.used) return json({ error: 'Token already used' }, 400);
          payload = JSON.parse(dbRow.payload_json || '{}');
          // check expiry
          const now = Math.floor(Date.now()/1000);
          if (payload.exp && payload.exp < now) return json({ error: 'Token expired' }, 400);
          // mark used
          await env.DB.prepare("UPDATE email_oneclicks SET used = 1, used_at = datetime('now') WHERE id = ?").bind(dbRow.id).run();
        } else {
          payload = await verifyOneClickToken(body.token, env.ONECLICK_SECRET);
        }
      } catch (e) {
        payload = await verifyOneClickToken(body.token, env.ONECLICK_SECRET);
      }
      if (!payload) return json({ error: 'Invalid or expired token' }, 400);
      // check expiry field
      const now = Math.floor(Date.now()/1000);
      if (payload.exp && payload.exp < now) return json({ error: 'Token expired' }, 400);
      if (payload.action === 'revert_assignment' && payload.existing_scheduled_id) {
        try {
          // Delete the existing scheduled assignment
          await env.DB.prepare('DELETE FROM scheduled_people WHERE id = ?').bind(payload.existing_scheduled_id).run();
          // Log in scheduled_conflict_logs that revert was performed via one-click
          await env.DB.prepare('INSERT INTO scheduled_conflict_logs (plan_id, member_id, existing_scheduled_id, forced_by, note) VALUES (?, ?, ?, ?, ?)')
            .bind(payload.plan_id || null, payload.member_id || null, payload.existing_scheduled_id, 'oneclick', 'Reverted via one-click email').run();
          return json({ success: true });
        } catch (e) {
          return json({ error: 'Action failed', details: e.message || String(e) }, 500);
        }
      }
      return badRequest('Unknown action');
    }),

    // Communication Preferences
    route('GET', '/api/communication-preferences/:memberId', async (request, env, params) => {
      const memberId = requireId({ id: params.memberId });
      if (!memberId) return badRequest('Invalid member ID');
      
      const prefs = await env.DB.prepare(`
        SELECT * FROM communication_preferences WHERE member_id = ?
      `).bind(memberId).first();
      
      if (!prefs) {
        return json({ member_id: memberId, receive_emails: true, receive_sms: true, email_types: null });
      }
      return json(prefs);
    }),

    route('POST', '/api/communication-preferences', async (request, env) => {
      const body = await getBody(request);
      if (!body) return badRequest('Invalid JSON body');
      if (!body.member_id) return badRequest('member_id is required');
      
      await env.DB.prepare(`
        INSERT OR REPLACE INTO communication_preferences (member_id, receive_emails, receive_sms, email_types)
        VALUES (?, ?, ?, ?)
      `).bind(
        body.member_id,
        body.receive_emails !== undefined ? body.receive_emails : 1,
        body.receive_sms !== undefined ? body.receive_sms : 1,
        body.email_types || null
      ).run();
      
      const prefs = await env.DB.prepare(`
        SELECT * FROM communication_preferences WHERE member_id = ?
      `).bind(body.member_id).first();
      
      return json(prefs, 201);
    }),
  ];

// ========================================
// FCM NOTIFICATIONS
// ========================================
const routes2 = [
  // Register a push notification token
  route('POST', '/api/fcm/register', async (request, env) => {
    const body = await getBody(request);
    if (!body) return badRequest('Invalid JSON body');
    if (!body.member_id || !body.token) return badRequest('member_id and token are required');

    await env.DB.prepare(`
      INSERT OR REPLACE INTO notification_tokens (member_id, token, device_type, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(body.member_id, body.token, body.device_type || 'web').run();

    return json({ success: true });
  }),

  // Send push notification to a member (or to a plan's scheduled people)
  route('POST', '/api/fcm/send', async (request, env) => {
    const body = await getBody(request);
    if (!body) return badRequest('Invalid JSON body');

    const serverKey = env.FCM_SERVER_KEY;
    if (!serverKey) return badRequest('FCM not configured (FCM_SERVER_KEY)');

    let tokens = [];
    if (body.member_id) {
      const result = await env.DB.prepare('SELECT token FROM notification_tokens WHERE member_id = ?').bind(body.member_id).all();
      tokens = result.results.map(r => r.token);
    } else if (body.plan_id) {
      const result = await env.DB.prepare(`
        SELECT DISTINCT nt.token FROM notification_tokens nt
        JOIN scheduled_people sp ON sp.member_id = nt.member_id
        WHERE sp.plan_id = ?
      `).bind(body.plan_id).all();
      tokens = result.results.map(r => r.token);
    } else if (body.tokens) {
      tokens = body.tokens;
    }

    if (!tokens.length) return json({ success: true, sent: 0, error: 'No tokens' });

    const title = body.title || 'Église App';
    const message = body.message || '';

    let sent = 0;
    let failed = 0;
    const errors = [];

    for (const token of tokens) {
      try {
        const payload = {
          to: token,
          notification: { title, body: message },
          data: body.data || {},
        };

        const res = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${serverKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) sent++;
        else { failed++; errors.push({ token: token.slice(0, 20) + '...', status: res.status }); }
      } catch (e) {
        failed++;
        errors.push({ token: token.slice(0, 20) + '...', error: e.message });
      }
    }

    return json({ success: true, sent, failed, errors: errors.length ? errors : undefined });
  }),

  // ========================================
  // MEDIA (Attachments)
  // ========================================
  route('GET', '/api/arrangements/:id/media', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('Invalid arrangement ID');
    const result = await dbAll(env.DB,
      'SELECT * FROM attachments WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC',
      'arrangement', id
    );
    return json(result.results);
  }),

  // ========================================
  // ANNOTATIONS (partagées/privées)
  // ========================================
  route('GET', '/api/arrangements/:id/annotations', async (request, env, params) => {
    const arrId = requireId(params);
    if (!arrId) return badRequest('Invalid arrangement ID');
    const member = await getMemberFromRequest(request, env);
    if (!member) return unauthorized();
    const annotations = await env.DB.prepare(`
      SELECT aa.*, m.first_name, m.last_name
      FROM arrangement_annotations aa
      LEFT JOIN members m ON m.id = aa.member_id
      WHERE aa.arrangement_id = ?
        AND (aa.is_shared = 1 OR aa.member_id = ?)
      ORDER BY aa.created_at ASC
    `).bind(arrId, member.id).all();
    return json(annotations.results);
  }),

  route('POST', '/api/arrangements/:id/annotations', async (request, env, params) => {
    const arrId = requireId(params);
    if (!arrId) return badRequest('Invalid arrangement ID');
    const member = await getMemberFromRequest(request, env);
    if (!member) return unauthorized();
    const body = await getBody(request);
    if (!body || !body.content) return badRequest('content is required');
    const result = await env.DB.prepare(
      'INSERT INTO arrangement_annotations (arrangement_id, member_id, content, is_shared) VALUES (?, ?, ?, ?)'
    ).bind(arrId, member.id, body.content, body.is_shared ? 1 : 0).run();
    const annotation = await env.DB.prepare(`
      SELECT aa.*, m.first_name, m.last_name
      FROM arrangement_annotations aa
      LEFT JOIN members m ON m.id = aa.member_id
      WHERE aa.id = ?
    `).bind(result.meta.last_row_id).first();
    return json(annotation, 201);
  }),

  route('PUT', '/api/annotations/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('Invalid annotation ID');
    const member = await getMemberFromRequest(request, env);
    if (!member) return unauthorized();
    const body = await getBody(request);
    if (!body) return badRequest();
    const annotation = await env.DB.prepare('SELECT * FROM arrangement_annotations WHERE id = ?').bind(id).first();
    if (!annotation) return notFound('Annotation not found');
    if (annotation.member_id !== member.id && member.role !== 'admin') return unauthorized();
    const updates = [];
    const values = [];
    if (body.content !== undefined) { updates.push('content = ?'); values.push(body.content); }
    if (body.is_shared !== undefined) { updates.push('is_shared = ?'); values.push(body.is_shared ? 1 : 0); }
    if (updates.length === 0) return badRequest('No fields to update');
    updates.push("updated_at = datetime('now')");
    values.push(id);
    await env.DB.prepare(`UPDATE arrangement_annotations SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
    const updated = await env.DB.prepare(`
      SELECT aa.*, m.first_name, m.last_name
      FROM arrangement_annotations aa
      LEFT JOIN members m ON m.id = aa.member_id
      WHERE aa.id = ?
    `).bind(id).first();
    return json(updated);
  }),

  route('DELETE', '/api/annotations/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('Invalid annotation ID');
    const member = await getMemberFromRequest(request, env);
    if (!member) return unauthorized();
    const annotation = await env.DB.prepare('SELECT * FROM arrangement_annotations WHERE id = ?').bind(id).first();
    if (!annotation) return notFound('Annotation not found');
    if (annotation.member_id !== member.id && member.role !== 'admin') return unauthorized();
    await env.DB.prepare('DELETE FROM arrangement_annotations WHERE id = ?').bind(id).run();
    return json({ success: true });
  }),

  // ========================================
  // RESOURCE PERMISSIONS (RBAC fin)
  // ========================================
  route('GET', '/api/resource-permissions', async (request, env, params) => {
    const member = await getMemberFromRequest(request, env);
    if (!member || member.role !== 'admin') return unauthorized();
    const perms = await env.DB.prepare('SELECT * FROM resource_permissions ORDER BY created_at DESC').all();
    return json(perms.results);
  }),

  route('POST', '/api/resource-permissions', async (request, env, params) => {
    const member = await getMemberFromRequest(request, env);
    if (!member || member.role !== 'admin') return unauthorized();
    const body = await getBody(request);
    if (!body || !body.member_id || !body.resource_type || !body.resource_id || !body.permission)
      return badRequest('member_id, resource_type, resource_id, permission required');
    const existing = await env.DB.prepare(
      'SELECT id FROM resource_permissions WHERE member_id = ? AND resource_type = ? AND resource_id = ? AND permission = ?'
    ).bind(body.member_id, body.resource_type, body.resource_id, body.permission).first();
    if (existing) {
      await env.DB.prepare('UPDATE resource_permissions SET granted = ? WHERE id = ?').bind(body.granted !== false ? 1 : 0, existing.id).run();
    } else {
      await env.DB.prepare(
        'INSERT INTO resource_permissions (member_id, resource_type, resource_id, permission, granted) VALUES (?, ?, ?, ?, ?)'
      ).bind(body.member_id, body.resource_type, body.resource_id, body.permission, body.granted !== false ? 1 : 0).run();
    }
    const perms = await env.DB.prepare('SELECT * FROM resource_permissions WHERE member_id = ?').bind(body.member_id).all();
    return json(perms.results, 201);
  }),

  route('DELETE', '/api/resource-permissions/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('Invalid permission ID');
    const member = await getMemberFromRequest(request, env);
    if (!member || member.role !== 'admin') return unauthorized();
    await env.DB.prepare('DELETE FROM resource_permissions WHERE id = ?').bind(id).run();
    return json({ success: true });
  }),

  route('POST', '/api/upload', async (request, env, params) => {
    const member = await getMemberFromRequest(request, env);
    if (!member) return unauthorized();
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return badRequest('Invalid multipart form data');
    }

    const file = formData.get('file');
    const arrangementId = formData.get('arrangement_id');
    const fileType = formData.get('file_type') || 'audio';

    if (!file || !arrangementId) return badRequest('file and arrangement_id are required');

    let kdriveFile;
    try {
      kdriveFile = await kdriveUpload(env, file, file.name);
    } catch (e) {
      return json({ error: e.message }, 500);
    }

    const fileUrl = `kdrive:${kdriveFile.id}`;

    const stmt = await env.DB.prepare(`
      INSERT INTO attachments (entity_type, entity_id, filename, file_url, file_type)
      VALUES (?, ?, ?, ?, ?)
    `).bind('arrangement', Number(arrangementId), file.name, fileUrl, fileType).run();

    const attachment = await dbFirst(env.DB, 'SELECT * FROM attachments WHERE id = ?', stmt.meta.last_row_id);
    return json(attachment, 201);
  }),

  route('GET', '/api/attachments/:id/file', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('Invalid attachment ID');

    const attachment = await dbFirst(env.DB, 'SELECT * FROM attachments WHERE id = ?', id);
    if (!attachment) return notFound();

    const fileId = parseKdriveFileId(attachment.file_url);
    if (!fileId) return notFound();

    const kdriveResp = await kdriveGetFile(env, fileId);
    if (!kdriveResp) return notFound();

    const headers = new Headers(kdriveResp.headers);
    headers.set('Cache-Control', 'public, max-age=31536000');

    return new Response(kdriveResp.body, { headers });
  }),

  route('DELETE', '/api/attachments/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('Invalid attachment ID');
    const existing = await dbFirst(env.DB, 'SELECT id, file_url FROM attachments WHERE id = ?', id);
    if (!existing) return notFound();

    const fileId = parseKdriveFileId(existing.file_url);
    if (fileId) await kdriveDelete(env, fileId).catch(() => {});

    await env.DB.prepare('DELETE FROM attachments WHERE id = ?').bind(id).run();
    return json({ success: true });
  }),
];

const router = createRouter([...routes0, ...routes2]);

const routes3 = [
  // ========================================
  // iCal EXPORT
  // ========================================
  route('GET', '/api/plans/:id/ical', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const plan = await env.DB.prepare(`
      SELECT p.*, st.name as service_type_name
      FROM plans p LEFT JOIN service_types st ON st.id = p.service_type_id WHERE p.id = ?
    `).bind(id).first();
    if (!plan) return notFound();

    const scheduled = await env.DB.prepare(`
      SELECT sp.*, m.first_name, m.last_name, m.email, t.name as team_name
      FROM scheduled_people sp
      JOIN members m ON m.id = sp.member_id
      LEFT JOIN teams t ON t.id = sp.team_id
      WHERE sp.plan_id = ?
    `).bind(id).all();

    const dtStart = plan.time
      ? `${plan.date.replace(/-/g, '')}T${plan.time.replace(/:/g, '')}00`
      : `${plan.date.replace(/-/g, '')}T100000`;
    const dtEnd = plan.time
      ? `${plan.date.replace(/-/g, '')}T${String(parseInt(plan.time.replace(/:/g, '')) + 100).padStart(6, '0')}00`
      : `${plan.date.replace(/-/g, '')}T120000`;

    let desc = `Service: ${plan.service_type_name || 'Général'}\nThème: ${plan.theme || '-'}\n\nParticipants:\n`;
    for (const s of scheduled.results) {
      desc += `${s.team_name ? `[${s.team_name}] ` : ''}${s.first_name} ${s.last_name}${s.position ? ` (${s.position})` : ''}\n`;
    }

    const ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Église App//FR',
      'BEGIN:VEVENT',
      `UID:plan-${id}@eglise-app`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${plan.service_type_name || 'Service'}${plan.theme ? ` - ${plan.theme}` : ''}`,
      `DESCRIPTION:${desc.replace(/\n/g, '\\n')}`,
      `LOCATION:Église`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return new Response(ical, {
      headers: {
        ...CORS,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="service-${plan.id}.ics"`,
      },
    });
  }),

  // ========================================
  // DIRECTORY (annuaire en ligne)
  // ========================================
  route('GET', '/api/directory', async (request, env) => {
    const members = await env.DB.prepare(`
      SELECT m.id, m.first_name, m.last_name, m.email, m.phone,
        COALESCE(
          (SELECT GROUP_CONCAT(t.name, ', ') FROM team_members tm2 JOIN teams t ON t.id = tm2.team_id WHERE tm2.member_id = m.id),
          ''
        ) as team_names
      FROM members m
      WHERE m.membership_type IN ('member', 'inactive')
        AND m.phone IS NOT NULL AND m.phone != ''
      ORDER BY m.last_name ASC, m.first_name ASC
    `).all();
    return json(members.results);
  }),

  // ========================================
  // CHECKLIST PAR POSTE
  // ========================================
  route('GET', '/api/checklist-templates', async (request, env, params, url) => {
    const serviceTypeId = url.searchParams.get('service_type_id');
    let rows;
    if (serviceTypeId) {
      rows = await env.DB.prepare('SELECT * FROM checklist_templates WHERE service_type_id = ? ORDER BY position ASC').bind(Number(serviceTypeId)).all();
    } else {
      rows = await env.DB.prepare('SELECT ct.*, st.name as service_type_name FROM checklist_templates ct LEFT JOIN service_types st ON st.id = ct.service_type_id ORDER BY ct.label ASC').all();
    }
    const templates = rows.results;
    for (const t of templates) {
      const items = await env.DB.prepare('SELECT * FROM checklist_template_items WHERE checklist_id = ? ORDER BY position ASC').bind(t.id).all();
      t.items = items.results;
    }
    return json(templates);
  }),

  route('POST', '/api/checklist-templates', async (request, env) => {
    const body = await getBody(request);
    if (!body || !body.position || !body.label) return badRequest('position and label required');
    const result = await env.DB.prepare('INSERT INTO checklist_templates (service_type_id, position, label) VALUES (?, ?, ?)')
      .bind(body.service_type_id || null, body.position, body.label).run();
    const created = await env.DB.prepare('SELECT * FROM checklist_templates WHERE id = ?').bind(result.meta.last_row_id).first();
    return json(created, 201);
  }),

  route('DELETE', '/api/checklist-templates/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    await env.DB.prepare('DELETE FROM checklist_templates WHERE id = ?').bind(id).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // Checklist template items
  route('POST', '/api/checklist-templates/:id/items', async (request, env, params) => {
    const checklistId = requireId(params);
    if (!checklistId) return badRequest('ID invalide');
    const body = await getBody(request);
    if (!body || !body.label) return badRequest('label required');
    const maxPos = await env.DB.prepare('SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM checklist_template_items WHERE checklist_id = ?').bind(checklistId).first();
    const result = await env.DB.prepare('INSERT INTO checklist_template_items (checklist_id, label, position) VALUES (?, ?, ?)')
      .bind(checklistId, body.label, body.position ?? maxPos.next_pos).run();
    const created = await env.DB.prepare('SELECT * FROM checklist_template_items WHERE id = ?').bind(result.meta.last_row_id).first();
    return json(created, 201);
  }),

  route('DELETE', '/api/checklist-template-items/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    await env.DB.prepare('DELETE FROM checklist_template_items WHERE id = ?').bind(id).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // Plan checklists (per-service checklist state)
  route('GET', '/api/plans/:id/checklist', async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest('ID invalide');
    const items = await env.DB.prepare('SELECT * FROM plan_checklists WHERE plan_id = ? ORDER BY id ASC').bind(planId).all();
    return json(items.results);
  }),

  route('POST', '/api/plans/:id/checklist', async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest('ID invalide');
    const body = await getBody(request);
    if (!body || !body.position || !body.label) return badRequest('position and label required');
    const result = await env.DB.prepare('INSERT INTO plan_checklists (plan_id, member_id, position, done, label) VALUES (?, ?, ?, 0, ?)')
      .bind(planId, body.member_id || null, body.position, body.label).run();
    const created = await env.DB.prepare('SELECT * FROM plan_checklists WHERE id = ?').bind(result.meta.last_row_id).first();
    return json(created, 201);
  }),

  route('PUT', '/api/plan-checklists/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const body = await getBody(request);
    if (!body) return badRequest('Corps requis');
    await env.DB.prepare(`UPDATE plan_checklists SET done = ?, done_at = CASE WHEN ? THEN datetime('now') ELSE NULL END WHERE id = ?`)
      .bind(body.done ? 1 : 0, body.done ? 1 : 0, id).run();
    const updated = await env.DB.prepare('SELECT * FROM plan_checklists WHERE id = ?').bind(id).first();
    return json(updated);
  }),

  route('DELETE', '/api/plan-checklists/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    await env.DB.prepare('DELETE FROM plan_checklists WHERE id = ?').bind(id).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // ========================================
  // SERMON AUDIO (attachments on plans)
  // ========================================
  route('POST', '/api/plans/:id/audio', async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest('ID plan invalide');
    const plan = await env.DB.prepare('SELECT id FROM plans WHERE id = ?').bind(planId).first();
    if (!plan) return notFound('Plan non trouvé');

    let formData;
    try {
      formData = await request.formData();
    } catch {
      return badRequest('Invalid multipart form data');
    }

    const file = formData.get('file');
    const title = formData.get('title') || 'Enregistrement';

    if (!file) return badRequest('file required');

    let fileUrl;
    if (env.INFOMANIAK_TOKEN && env.INFOMANIAK_TOKEN !== 'changeme') {
      try {
        const kdriveFile = await kdriveUpload(env, file, `sermon-${planId}-${file.name}`);
        fileUrl = `kdrive:${kdriveFile.id}`;
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    } else {
      fileUrl = `local:${file.name}`;
    }

    // Store in attachments table
    if (fileUrl.startsWith('kdrive:')) {
      await env.DB.prepare('INSERT INTO attachments (entity_type, entity_id, filename, file_url, file_type) VALUES (?, ?, ?, ?, ?)')
        .bind('plan', planId, file.name, fileUrl, 'audio').run();
    }

    // Also set audio_url on plans for convenience
    await env.DB.prepare('UPDATE plans SET audio_url = ?, audio_title = ? WHERE id = ?')
      .bind(fileUrl, title, planId).run();

    let segmentsResult = null;
    try {
      const splitterResult = await callAudioSplitter(env, file, planId);
      if (splitterResult && splitterResult.segments) {
        const s = splitterResult.segments;
        const songs = splitterResult.summary?.chants || [];
        await env.DB.prepare('DELETE FROM plan_audio_segments WHERE plan_id = ?').bind(planId).run();
        await env.DB.prepare('DELETE FROM plan_audio_songs WHERE plan_id = ?').bind(planId).run();
        for (let i = 0; i < s.length; i++) {
          const seg = s[i];
          await env.DB.prepare('INSERT INTO plan_audio_segments (plan_id, segment_index, start_seconds, end_seconds, segment_type, title, text, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(planId, i, seg.start, seg.end, seg.type, seg.title || null, seg.text || null, seg.confidence || null).run();
        }
        for (let i = 0; i < songs.length; i++) {
          const c = songs[i];
          await env.DB.prepare('INSERT INTO plan_audio_songs (plan_id, song_index, title, start_seconds, end_seconds) VALUES (?, ?, ?, ?, ?)')
            .bind(planId, i, c.title || null, c.start, c.end).run();
        }
        segmentsResult = { segments: s.length, songs: songs.length };
      }
    } catch (e) {
      segmentsResult = { error: e.message };
    }

    return json({ success: true, file_url: fileUrl, title, audio_splitter: segmentsResult }, 201);
  }),

  route('GET', '/api/plans/:id/audio', async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest('ID plan invalide');
    const plan = await env.DB.prepare('SELECT audio_url, audio_title FROM plans WHERE id = ?').bind(planId).first();
    if (!plan) return notFound();
    const attachments = await env.DB.prepare("SELECT * FROM attachments WHERE entity_type = 'plan' AND entity_id = ? AND file_type = 'audio' ORDER BY created_at DESC")
      .bind(planId).all();
    return json({ audio_url: plan.audio_url, audio_title: plan.audio_title, attachments: attachments.results });
  }),

  route('GET', '/api/plans/:id/audio/stream', async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest('ID plan invalide');
    const plan = await env.DB.prepare('SELECT audio_url FROM plans WHERE id = ?').bind(planId).first();
    if (!plan || !plan.audio_url) return notFound('Aucun audio');
    const fileId = parseKdriveFileId(plan.audio_url);
    if (!fileId) return notFound();
    const attachment = await dbFirst(env.DB, "SELECT id FROM attachments WHERE entity_type = 'plan' AND entity_id = ? AND file_type = 'audio' ORDER BY created_at DESC LIMIT 1", planId);
    if (!attachment) return notFound();
    const resp = await kdriveGetFile(env, fileId);
    if (!resp) return notFound();
    const headers = new Headers(resp.headers);
    headers.set('Cache-Control', 'public, max-age=31536000');
    return new Response(resp.body, { headers });
  }),

  route('DELETE', '/api/plans/:id/audio', async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest('ID plan invalide');
    const attachments = await env.DB.prepare("SELECT * FROM attachments WHERE entity_type = 'plan' AND entity_id = ? AND file_type = 'audio'").bind(planId).all();
    for (const a of attachments.results) {
      const fileId = parseKdriveFileId(a.file_url);
      if (fileId) await kdriveDelete(env, fileId).catch(() => {});
      await env.DB.prepare('DELETE FROM attachments WHERE id = ?').bind(a.id).run();
    }
    await env.DB.prepare('UPDATE plans SET audio_url = NULL, audio_title = NULL WHERE id = ?').bind(planId).run();
    return json({ success: true });
  }),

  // ========================================
  // AUDIO SEGMENTS (audio-splitter integration)
  // ========================================
  route('GET', '/api/plans/:id/audio-segments', async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest('ID plan invalide');
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: 'Not authenticated' }, 401);
    const segments = await env.DB.prepare('SELECT * FROM plan_audio_segments WHERE plan_id = ? ORDER BY segment_index').bind(planId).all();
    const songs = await env.DB.prepare('SELECT * FROM plan_audio_songs WHERE plan_id = ? ORDER BY song_index').bind(planId).all();
    return json({ segments: segments.results, songs: songs.results });
  }),

  route('POST', '/api/plans/:id/audio-segments', async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest('ID plan invalide');
    const body = await getBody(request).catch(() => null);
    if (!body || !body.segments) return badRequest('segments requis');
    const token = request.headers.get('x-audio-token');
    if (token !== env.AUDIO_SPLITTER_TOKEN) return json({ error: 'Invalid token' }, 401);
    const plan = await env.DB.prepare('SELECT id FROM plans WHERE id = ?').bind(planId).first();
    if (!plan) return notFound('Plan non trouvé');
    await env.DB.prepare('DELETE FROM plan_audio_segments WHERE plan_id = ?').bind(planId).run();
    await env.DB.prepare('DELETE FROM plan_audio_songs WHERE plan_id = ?').bind(planId).run();
    for (let i = 0; i < body.segments.length; i++) {
      const s = body.segments[i];
      await env.DB.prepare('INSERT INTO plan_audio_segments (plan_id, segment_index, start_seconds, end_seconds, segment_type, title, text, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(planId, i, s.start, s.end, s.type, s.title || null, s.text || null, s.confidence || null).run();
    }
    if (body.songs) {
      for (let i = 0; i < body.songs.length; i++) {
        const s = body.songs[i];
        await env.DB.prepare('INSERT INTO plan_audio_songs (plan_id, song_index, title, start_seconds, end_seconds) VALUES (?, ?, ?, ?, ?)')
          .bind(planId, i, s.title || null, s.start, s.end).run();
      }
    }
    return json({ success: true });
  }),

  // ========================================
  // REPLACEMENT SUGGESTION (quand un bénévole refuse)
  // ========================================
  route('GET', '/api/plans/:id/replacements/:scheduledId', async (request, env, params) => {
    const planId = requireId({ id: params.id });
    const scheduledId = requireId({ id: params.scheduledId });
    if (!planId || !scheduledId) return badRequest('ID invalide');
    const sp = await env.DB.prepare('SELECT * FROM scheduled_people WHERE id = ? AND plan_id = ?').bind(scheduledId, planId).first();
    if (!sp) return notFound();

    // Find same team members not already scheduled for this plan, with email
    const candidates = await env.DB.prepare(`
      SELECT DISTINCT m.id, m.first_name, m.last_name, m.email, m.phone,
        tm.position as member_position
      FROM members m
      JOIN team_members tm ON tm.member_id = m.id
      WHERE tm.team_id = ?
        AND m.id != ?
        AND m.id NOT IN (SELECT member_id FROM scheduled_people WHERE plan_id = ?)
        AND m.email IS NOT NULL AND m.email != ''
      ORDER BY m.last_name ASC
    `).bind(sp.team_id, sp.member_id, planId).all();
    return json(candidates.results);
  }),

  route('POST', '/api/plans/:id/replacements/:scheduledId', async (request, env, params) => {
    const planId = requireId({ id: params.id });
    const scheduledId = requireId({ id: params.scheduledId });
    if (!planId || !scheduledId) return badRequest('ID invalide');
    const body = await getBody(request);
    if (!body || !body.new_member_id) return badRequest('new_member_id required');

    const sp = await env.DB.prepare('SELECT * FROM scheduled_people WHERE id = ? AND plan_id = ?').bind(scheduledId, planId).first();
    if (!sp) return notFound();

    // Update the scheduled person to the new member
    await env.DB.prepare('UPDATE scheduled_people SET member_id = ?, status = ? WHERE id = ?')
      .bind(body.new_member_id, 'pending', scheduledId).run();

    // Notify the new member via email
    try {
      const plan = await env.DB.prepare('SELECT date, time, theme FROM plans WHERE id = ?').bind(planId).first();
      const newMember = await env.DB.prepare('SELECT first_name, last_name, email FROM members WHERE id = ?').bind(body.new_member_id).first();
      const apiKey = env.RESEND_API_KEY;
      const from = env.EMAIL_FROM || 'no-reply@example.com';
      if (apiKey && newMember && newMember.email) {
        const frontend = env.FRONTEND_URL || 'https://eglise-app.pages.dev';
        const html = `<p>Bonjour ${newMember.first_name},</p>
          <p>Tu as été ajouté(e) comme remplaçant(e) pour le service du <strong>${plan.date} ${plan.time || ''}</strong>.</p>
          <p>Merci de confirmer ta disponibilité: <a href="${frontend}/mon-compte">Mon compte</a></p>`;
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ from, to: newMember.email, subject: `Remplacement — Service ${plan.date}`, html }),
        });
      }
    } catch (e) { /* ignore notification errors */ }

    const updated = await env.DB.prepare(`
      SELECT sp.*, m.first_name, m.last_name, m.email, t.name as team_name
      FROM scheduled_people sp
      JOIN members m ON m.id = sp.member_id
      LEFT JOIN teams t ON t.id = sp.team_id
      WHERE sp.id = ?
    `).bind(scheduledId).first();
    return json(updated);
  }),
  // Attendance stats
  route('GET', '/api/attendance-stats', async (request, env, params, url) => {
    const year = url.searchParams.get('year') || String(new Date().getFullYear());
    const memberId = url.searchParams.get('member_id');

    let where = "strftime('%Y', a.check_in_time) = ?";
    const binds = [year];
    if (memberId) { where += ' AND a.member_id = ?'; binds.push(Number(memberId)); }

    // Total attendances
    const total = await env.DB.prepare(`SELECT COUNT(*) as c FROM attendances a WHERE ${where}`).bind(...binds).first();

    // Per member stats
    const perMember = await env.DB.prepare(`
      SELECT a.member_id, m.first_name, m.last_name, COUNT(*) as count
      FROM attendances a JOIN members m ON m.id = a.member_id
      WHERE ${where} GROUP BY a.member_id ORDER BY count DESC
    `).bind(...binds).all();

    // Per month breakdown
    const perMonth = await env.DB.prepare(`
      SELECT strftime('%m', a.check_in_time) as month, COUNT(*) as count
      FROM attendances a WHERE ${where}
      GROUP BY month ORDER BY month ASC
    `).bind(...binds).all();

    // Top recent
    const recent = await env.DB.prepare(`
      SELECT a.*, m.first_name, m.last_name, p.date as plan_date
      FROM attendances a JOIN members m ON m.id = a.member_id JOIN plans p ON p.id = a.plan_id
      WHERE ${where} ORDER BY a.check_in_time DESC LIMIT 20
    `).bind(...binds).all();

    return json({
      total: total.c,
      perMember: perMember.results,
      perMonth: perMonth.results,
      recent: recent.results,
    });
  }),

  // ========================================
  // INVITATION SYSTEM
  // ========================================
  route('POST', '/api/invitations', async (request, env) => {
    const body = await getBody(request);
    if (!body || !body.email) return badRequest('email required');
    if (!await hasPermission(request, env, 'manage_members')) return json({ error: 'Forbidden' }, 403);

    const member = await env.DB.prepare('SELECT * FROM members WHERE email = ?').bind(body.email).first();
    if (!member) return badRequest('Aucun membre avec cet email');

    const token = generateSecureToken(48);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await env.DB.prepare('CREATE TABLE IF NOT EXISTS invitation_tokens (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id INTEGER REFERENCES members(id), token TEXT UNIQUE, expires_at TEXT, used INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime(\'now\')))').run();
    await env.DB.prepare('INSERT INTO invitation_tokens (member_id, token, expires_at) VALUES (?, ?, ?)').bind(member.id, token, expires_at).run();

    // Send email
    try {
      const frontend = env.FRONTEND_URL || 'https://eglise-app.pages.dev';
      const link = `${frontend}/invitation?token=${token}`;
      const html = `<p>Bonjour ${member.first_name},</p>
        <p>Tu as été invité(e) à rejoindre l'application Église.</p>
        <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">Activer mon compte</a></p>
        <p>Ce lien expire dans 7 jours.</p>`;
      const apiKey = env.RESEND_API_KEY;
      const from = env.EMAIL_FROM || 'no-reply@example.com';
      if (apiKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ from, to: body.email, subject: 'Invitation à rejoindre Église App', html }),
        });
      }
    } catch (e) { /* ignore */ }

    return json({ success: true, email: body.email }, 201);
  }),

  route('GET', '/api/invitations/:token', async (request, env, params) => {
    const token = params.token;
    const row = await env.DB.prepare('SELECT it.*, m.first_name, m.last_name, m.email FROM invitation_tokens it JOIN members m ON m.id = it.member_id WHERE it.token = ?').bind(token).first();
    if (!row) return badRequest('Token invalide');
    if (row.used) return badRequest('Token déjà utilisé');
    if (row.expires_at < new Date().toISOString()) return badRequest('Token expiré');
    return json({ member_id: row.member_id, first_name: row.first_name, last_name: row.last_name, email: row.email });
  }),

  route('POST', '/api/invitations/:token/redeem', async (request, env, params) => {
    const token = params.token;
    const body = await getBody(request);
    if (!body || !body.firebase_uid) return badRequest('firebase_uid required');

    const row = await env.DB.prepare('SELECT * FROM invitation_tokens WHERE token = ?').bind(token).first();
    if (!row) return badRequest('Token invalide');
    if (row.used) return badRequest('Token déjà utilisé');
    if (row.expires_at < new Date().toISOString()) return badRequest('Token expiré');

    // Check no other member has this firebase_uid
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS member_firebase (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id INTEGER UNIQUE REFERENCES members(id), firebase_uid TEXT UNIQUE, created_at TEXT DEFAULT (datetime(\'now\')))').run();
    const existing = await env.DB.prepare('SELECT member_id FROM member_firebase WHERE firebase_uid = ?').bind(body.firebase_uid).first();
    if (existing) return badRequest('Ce compte Firebase est déjà lié à un membre');

    await env.DB.prepare('INSERT INTO member_firebase (member_id, firebase_uid) VALUES (?, ?)').bind(row.member_id, body.firebase_uid).run();
    await env.DB.prepare('UPDATE invitation_tokens SET used = 1 WHERE id = ?').bind(row.id).run();

    return json({ success: true, member_id: row.member_id });
  }),

  // Verify firebase link for member portal
  route('GET', '/api/me/firebase-status', async (request, env) => {
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: 'Not authenticated' }, 401);
    const fb = await env.DB.prepare('SELECT firebase_uid FROM member_firebase WHERE member_id = ?').bind(member.id).first();
    return json({ linked: !!fb, firebase_uid: fb?.firebase_uid || null });
  }),

  // QR check-in token for a plan
  route('GET', '/api/plans/:id/qr-checkin', async (request, env, params) => {
    const planId = requireId(params);
    if (!planId) return badRequest('ID plan invalide');
    const plan = await env.DB.prepare('SELECT id, date FROM plans WHERE id = ?').bind(planId).first();
    if (!plan) return notFound();
    // Generate a short-lived token for check-in
    const token = generateSecureToken(16);
    const payload = JSON.stringify({ action: 'qr_checkin', plan_id: planId, exp: Math.floor(Date.now()/1000) + 3600 });
    const signed = await signOneClickToken(payload, env.ONECLICK_SECRET || 'default-secret');
    return json({ checkin_url: `${env.FRONTEND_URL || 'https://eglise-app.pages.dev'}/checkin?plan=${planId}&token=${encodeURIComponent(signed)}`, plan_id: planId, date: plan.date });
  }),

  // ========================================
  // SONDAGES (Polls)
  // ========================================
  route('GET', '/api/polls', async (request, env) => {
    const rows = await env.DB.prepare(`
      SELECT p.*, (SELECT COUNT(*) FROM poll_votes pv WHERE pv.poll_id = p.id) as vote_count
      FROM polls p ORDER BY p.created_at DESC
    `).all();
    const polls = rows.results;
    for (const poll of polls) {
      poll.options = (await env.DB.prepare('SELECT * FROM poll_options WHERE poll_id = ? ORDER BY position ASC').bind(poll.id).all()).results;
      const member = await getMemberFromRequest(request, env);
      if (member) {
        const myVotes = await env.DB.prepare('SELECT poll_option_id FROM poll_votes WHERE poll_id = ? AND member_id = ?').bind(poll.id, member.id).all();
        poll.my_votes = myVotes.results.map(v => v.poll_option_id);
      }
    }
    return json(polls);
  }),

  route('POST', '/api/polls', async (request, env) => {
    if (!await hasPermission(request, env, 'edit_members')) return json({ error: 'Forbidden' }, 403);
    const body = await getBody(request);
    if (!body || !body.question) return badRequest('question required');
    const maxVotes = body.max_votes || 1;
    const expiresAt = body.expires_at || null;
    const result = await env.DB.prepare('INSERT INTO polls (question, max_votes, expires_at) VALUES (?, ?, ?)').bind(body.question, maxVotes, expiresAt).run();
    const poll = await env.DB.prepare('SELECT * FROM polls WHERE id = ?').bind(result.meta.last_row_id).first();
    return json(poll, 201);
  }),

  route('DELETE', '/api/polls/:id', async (request, env, params) => {
    if (!await hasPermission(request, env, 'edit_members')) return json({ error: 'Forbidden' }, 403);
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    await env.DB.prepare('DELETE FROM polls WHERE id = ?').bind(id).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  route('POST', '/api/polls/:id/options', async (request, env, params) => {
    if (!await hasPermission(request, env, 'edit_members')) return json({ error: 'Forbidden' }, 403);
    const pollId = requireId(params);
    if (!pollId) return badRequest('ID sondage invalide');
    const body = await getBody(request);
    if (!body || !body.label) return badRequest('label required');
    const maxPos = await env.DB.prepare('SELECT COALESCE(MAX(position), 0) + 1 as next FROM poll_options WHERE poll_id = ?').bind(pollId).first();
    const result = await env.DB.prepare('INSERT INTO poll_options (poll_id, label, position) VALUES (?, ?, ?)').bind(pollId, body.label, body.position ?? maxPos.next).run();
    const opt = await env.DB.prepare('SELECT * FROM poll_options WHERE id = ?').bind(result.meta.last_row_id).first();
    return json(opt, 201);
  }),

  route('DELETE', '/api/poll-options/:id', async (request, env, params) => {
    if (!await hasPermission(request, env, 'edit_members')) return json({ error: 'Forbidden' }, 403);
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    await env.DB.prepare('DELETE FROM poll_options WHERE id = ?').bind(id).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  route('POST', '/api/polls/:id/vote', async (request, env, params) => {
    const pollId = requireId(params);
    if (!pollId) return badRequest('ID sondage invalide');
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: 'Not authenticated' }, 401);
    const body = await getBody(request);
    if (!body || !body.option_id) return badRequest('option_id required');

    const poll = await env.DB.prepare('SELECT * FROM polls WHERE id = ?').bind(pollId).first();
    if (!poll) return notFound('Sondage non trouvé');
    if (poll.expires_at && poll.expires_at < new Date().toISOString()) return badRequest('Sondage expiré');

    const myVotes = await env.DB.prepare('SELECT id FROM poll_votes WHERE poll_id = ? AND member_id = ?').bind(pollId, member.id).all();
    if (myVotes.results.length >= poll.max_votes) return badRequest(`Maximum ${poll.max_votes} vote(s) atteint`);

    const existing = await env.DB.prepare('SELECT id FROM poll_votes WHERE poll_id = ? AND member_id = ? AND poll_option_id = ?').bind(pollId, member.id, body.option_id).first();
    if (existing) return badRequest('Tu as déjà voté pour cette option');

    await env.DB.prepare('INSERT INTO poll_votes (poll_id, member_id, poll_option_id) VALUES (?, ?, ?)').bind(pollId, member.id, body.option_id).run();
    return json({ success: true }, 201);
  }),

  route('DELETE', '/api/polls/:id/vote', async (request, env, params) => {
    const pollId = requireId(params);
    if (!pollId) return badRequest('ID sondage invalide');
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: 'Not authenticated' }, 401);
    const body = await getBody(request);
    if (!body || !body.option_id) return badRequest('option_id required');
    await env.DB.prepare('DELETE FROM poll_votes WHERE poll_id = ? AND member_id = ? AND poll_option_id = ?').bind(pollId, member.id, body.option_id).run();
    return json({ success: true });
  }),

  // ========================================
  // ANNONCES & POINTS DE PRIÈRE
  // ========================================
  route('GET', '/api/announcements', async (request, env, params, url) => {
    const type = url.searchParams.get('type');
    let query = 'SELECT a.*, m.first_name as author_first, m.last_name as author_last FROM announcements a LEFT JOIN members m ON m.id = a.author_id';
    const binds = [];
    if (type === 'prayer') {
      query += " WHERE a.type = 'prayer'";
    } else if (type === 'announcement') {
      query += " WHERE a.type = 'announcement'";
    }
    query += ' ORDER BY a.created_at DESC LIMIT 50';
    const rows = await env.DB.prepare(query).bind(...binds).all();
    return json(rows.results);
  }),

  route('POST', '/api/announcements', async (request, env) => {
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: 'Not authenticated' }, 401);
    const body = await getBody(request);
    if (!body || !body.content) return badRequest('content required');
    const type = body.type || 'announcement';
    const result = await env.DB.prepare('INSERT INTO announcements (type, content, author_id, plan_id) VALUES (?, ?, ?, ?)')
      .bind(type, body.content, member.id, body.plan_id || null).run();
    const created = await env.DB.prepare('SELECT a.*, m.first_name as author_first, m.last_name as author_last FROM announcements a LEFT JOIN members m ON m.id = a.author_id WHERE a.id = ?')
      .bind(result.meta.last_row_id).first();
    return json(created, 201);
  }),

  route('PUT', '/api/announcements/:id', async (request, env, params) => {
    if (!await hasPermission(request, env, 'edit_members')) return json({ error: 'Forbidden' }, 403);
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const body = await getBody(request);
    if (!body) return badRequest('Corps requis');
    await env.DB.prepare('UPDATE announcements SET content = ?, type = ? WHERE id = ?')
      .bind(body.content, body.type || 'announcement', id).run();
    const updated = await env.DB.prepare('SELECT a.*, m.first_name as author_first, m.last_name as author_last FROM announcements a LEFT JOIN members m ON m.id = a.author_id WHERE a.id = ?').bind(id).first();
    return json(updated);
  }),

  route('DELETE', '/api/announcements/:id', async (request, env, params) => {
    if (!await hasPermission(request, env, 'edit_members')) return json({ error: 'Forbidden' }, 403);
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    await env.DB.prepare('DELETE FROM announcements WHERE id = ?').bind(id).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // ========================================
  // MESSAGERIE INTERNE
  // ========================================
  route('POST', '/api/messages', async (request, env) => {
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: 'Not authenticated' }, 401);
    const body = await getBody(request);
    if (!body || !body.content) return badRequest('content required');
    const subject = body.subject || null;
    const recipients = Array.isArray(body.recipients) ? body.recipients : [];
    const res = await env.DB.prepare('INSERT INTO messages (sender_id, subject, content) VALUES (?, ?, ?)').bind(member.id, subject, body.content).run();
    const messageId = res.meta.last_row_id;
    for (const rid of recipients) {
      await env.DB.prepare('INSERT INTO message_recipients (message_id, recipient_id) VALUES (?, ?)').bind(messageId, rid).run();
    }
    // also create a recipient copy for the sender
    await env.DB.prepare('INSERT INTO message_recipients (message_id, recipient_id) VALUES (?, ?)').bind(messageId, member.id).run();
    const created = await env.DB.prepare('SELECT m.*, mr.* FROM messages m WHERE m.id = ?').bind(messageId).first();
    return json(created, 201);
  }),

  route('GET', '/api/messages/inbox', async (request, env) => {
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: 'Not authenticated' }, 401);
    const rows = await env.DB.prepare(`
      SELECT m.id, m.sender_id, m.subject, m.content, m.created_at, mr.read_at, mem.first_name as sender_first, mem.last_name as sender_last
      FROM message_recipients mr
      JOIN messages m ON m.id = mr.message_id
      LEFT JOIN members mem ON mem.id = m.sender_id
      WHERE mr.recipient_id = ?
      ORDER BY m.created_at DESC
    `).bind(member.id).all();
    return json(rows.results);
  }),

  route('GET', '/api/messages/:id', async (request, env, params) => {
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: 'Not authenticated' }, 401);
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const allowed = await env.DB.prepare('SELECT 1 FROM message_recipients WHERE message_id = ? AND recipient_id = ? LIMIT 1').bind(id, member.id).first();
    if (!allowed) return json({ error: 'Forbidden' }, 403);
    const msg = await env.DB.prepare('SELECT m.*, mem.first_name as sender_first, mem.last_name as sender_last FROM messages m LEFT JOIN members mem ON mem.id = m.sender_id WHERE m.id = ?').bind(id).first();
    const recipients = (await env.DB.prepare('SELECT recipient_id, read_at FROM message_recipients WHERE message_id = ?').bind(id).all()).results;
    return json({ ...msg, recipients });
  }),

  route('POST', '/api/messages/:id/read', async (request, env, params) => {
    const member = await getMemberFromRequest(request, env);
    if (!member) return json({ error: 'Not authenticated' }, 401);
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    await env.DB.prepare('UPDATE message_recipients SET read_at = datetime(\'now\') WHERE message_id = ? AND recipient_id = ?').bind(id, member.id).run();
    return json({ success: true });
  }),

  // ========================================
  // IMPORT / EXPORT CSV
  // ========================================
  route('GET', '/api/export/:entity', async (request, env, params) => {
    const entity = params.entity;
    let rows;
    let columns;
    let filename;

    if (entity === 'members') {
      rows = await env.DB.prepare('SELECT id, first_name, last_name, email, phone, membership_type, notes FROM members ORDER BY last_name ASC').all();
      columns = ['id', 'first_name', 'last_name', 'email', 'phone', 'membership_type', 'notes'];
      filename = 'membres.csv';
    } else if (entity === 'songs') {
      rows = await env.DB.prepare(`
        SELECT s.id, s.title, s.author, s.ccli_number, s.copyright, a.name as arrangement_name, a.key, a.tempo
        FROM songs s LEFT JOIN arrangements a ON a.song_id = s.id ORDER BY s.title ASC
      `).all();
      columns = ['id', 'title', 'author', 'ccli_number', 'copyright', 'arrangement_name', 'key', 'tempo'];
      filename = 'chants.csv';
    } else if (entity === 'plans') {
      rows = await env.DB.prepare(`
        SELECT p.id, p.date, p.time, p.theme, p.status, st.name as service_type
        FROM plans p LEFT JOIN service_types st ON st.id = p.service_type_id ORDER BY p.date DESC
      `).all();
      columns = ['id', 'date', 'time', 'theme', 'status', 'service_type'];
      filename = 'services.csv';
    } else {
      return badRequest('Entité invalide. Utilise members, songs, ou plans');
    }

    const csv = toCsv(rows.results, columns);
    return new Response(csv, {
      headers: {
        ...CORS,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }),

  route('POST', '/api/import/:entity', async (request, env, params) => {
    if (!await hasPermission(request, env, 'edit_members')) return json({ error: 'Forbidden' }, 403);
    const entity = params.entity;
    let body;
    try {
      body = await request.text();
    } catch {
      return badRequest('Corps requis');
    }
    const lines = body.split('\n').filter(l => l.trim());
    if (lines.length < 2) return badRequest('CSV doit avoir un en-tête et au moins une ligne');

    const headers = lines[0].split(',').map(h => h.trim());
    let imported = 0;
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || null; });

        if (entity === 'members') {
          await env.DB.prepare('INSERT OR IGNORE INTO members (first_name, last_name, email, phone, membership_type, notes) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(row.first_name, row.last_name, row.email || null, row.phone || null, row.membership_type || 'guest', row.notes || null).run();
          imported++;
        } else if (entity === 'songs') {
          await env.DB.prepare('INSERT OR IGNORE INTO songs (title, author, ccli_number, copyright, notes) VALUES (?, ?, ?, ?, ?)')
            .bind(row.title, row.author || null, row.ccli_number || null, row.copyright || null, row.notes || null).run();
          imported++;
        } else {
          return badRequest('Entité invalide. Utilise members ou songs');
        }
      } catch (e) {
        errors.push({ line: i + 1, error: e.message });
      }
    }

    return json({ imported, errors: errors.length ? errors : undefined });
  }),

  // API logs view (admin only)
  route('GET', '/api/logs', async (request, env, params, url) => {
    if (!await hasPermission(request, env, 'manage_members')) return json({ error: 'Forbidden' }, 403);
    const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
    const per = Math.min(100, parseInt(url.searchParams.get('per') || '50', 10) || 50);
    const offset = (page - 1) * per;

    const rows = await env.DB.prepare(`SELECT * FROM api_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(per, offset).all();
    const total = await env.DB.prepare('SELECT COUNT(*) as c FROM api_logs').first();
    return json({ rows: rows.results, total: total.c, page, per });
  }),

  route('DELETE', '/api/logs', async (request, env) => {
    if (!await hasPermission(request, env, 'manage_members')) return json({ error: 'Forbidden' }, 403);
    await env.DB.prepare("DELETE FROM api_logs WHERE created_at < datetime('now', '-7 days')").run();
    return json({ success: true });
  }),

  // ========================================
  // PCO SYNC
  // ========================================
  route('POST', '/api/pco-sync', async (request, env) => {
    if (!await hasPermission(request, env, 'manage_members')) return json({ error: 'Forbidden' }, 403);

    const token_id = env.PCO_TOKEN_ID;
    const token_secret = env.PCO_TOKEN_SECRET;
    if (!token_id || !token_secret) return json({ error: 'PCO credentials not configured' }, 500);

    const auth = btoa(`${token_id}:${token_secret}`);
    const PCO_API = 'https://api.planningcenteronline.com';

    const results = { services: 0, people: 0, songs: 0, arrangements: 0, errors: [] };

    try {
      // Fetch upcoming services (next 4 weeks)
      const today = new Date().toISOString().slice(0, 10);
      const fourWeeks = new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10);
      const servicesRes = await fetch(`${PCO_API}/services/v2/service_types`, {
        headers: { 'Authorization': `Basic ${auth}`, 'User-Agent': 'EgliseApp/1.0' },
      });
      if (!servicesRes.ok) throw new Error(`PCO service_types failed: ${servicesRes.status}`);
      const serviceTypesData = await servicesRes.json();

      // Sync service types
      for (const st of serviceTypesData.data || []) {
        const existing = await env.DB.prepare('SELECT id FROM service_types WHERE name = ?').bind(st.attributes.name).first();
        if (!existing) {
          await env.DB.prepare('INSERT INTO service_types (name) VALUES (?)').bind(st.attributes.name).run();
        }
      }

      // Fetch plans for each service type
      for (const st of serviceTypesData.data || []) {
        const plansRes = await fetch(`${PCO_API}/services/v2/service_types/${st.id}/plan_times?filter[starts_at]=${today}..${fourWeeks}`, {
          headers: { 'Authorization': `Basic ${auth}`, 'User-Agent': 'EgliseApp/1.0' },
        });
        if (!plansRes.ok) continue;
        const plansData = await plansRes.json();

        for (const pt of plansData.data || []) {
          const startsAt = pt.attributes.starts_at;
          if (!startsAt) continue;
          const date = startsAt.slice(0, 10);
          const time = startsAt.slice(11, 16);
          const title = pt.attributes.title || '';

          // Check if plan already exists
          const existing = await env.DB.prepare('SELECT id FROM plans WHERE date = ? AND time = ?').bind(date, time).first();
          if (existing) continue;

          // Find matching service_type
          const stLocal = await env.DB.prepare('SELECT id FROM service_types WHERE name = ?').bind(st.attributes.name).first();

          await env.DB.prepare('INSERT INTO plans (service_type_id, date, time, theme, status) VALUES (?, ?, ?, ?, ?)')
            .bind(stLocal ? stLocal.id : null, date, time, title || null, 'planned').run();
          results.services++;

          // Fetch plan people
          const planId = (await env.DB.prepare('SELECT id FROM plans WHERE date = ? AND time = ? ORDER BY id DESC LIMIT 1').bind(date, time).first())?.id;
          if (planId) {
            try {
              const peopleRes = await fetch(`${PCO_API}/services/v2/plans/${pt.id}/people`, {
                headers: { 'Authorization': `Basic ${auth}`, 'User-Agent': 'EgliseApp/1.0' },
              });
              if (peopleRes.ok) {
                const peopleData = await peopleRes.json();
                for (const p of peopleData.data || []) {
                  const personName = p.attributes.name || '';
                  const [firstName, ...lastNameParts] = personName.split(' ');
                  const lastName = lastNameParts.join(' ') || '';
                  const status = p.attributes.status || 'pending';
                  const teamName = p.attributes.team || '';

                  // Find or create member
                  let member = await env.DB.prepare('SELECT id FROM members WHERE first_name = ? AND last_name = ?').bind(firstName, lastName).first();
                  if (!member && firstName) {
                    await env.DB.prepare('INSERT INTO members (first_name, last_name) VALUES (?, ?)').bind(firstName, lastName).run();
                    member = await env.DB.prepare('SELECT id FROM members WHERE first_name = ? AND last_name = ?').bind(firstName, lastName).first();
                  }

                  if (member) {
                    // Find or create team
                    let team = null;
                    if (teamName) {
                      team = await env.DB.prepare('SELECT id FROM teams WHERE name = ?').bind(teamName).first();
                      if (!team) {
                        await env.DB.prepare('INSERT INTO teams (name) VALUES (?)').bind(teamName).run();
                        team = await env.DB.prepare('SELECT id FROM teams WHERE name = ?').bind(teamName).first();
                      }
                    }

                    // Schedule the person
                    const position = p.attributes.role || '';
                    await env.DB.prepare('INSERT OR IGNORE INTO scheduled_people (plan_id, member_id, team_id, position, status) VALUES (?, ?, ?, ?, ?)')
                      .bind(planId, member.id, team ? team.id : null, position, status).run();
                    results.people++;
                  }
                }
              }
            } catch (e) { results.errors.push(`Plan ${pt.id} people: ${e.message}`); }
          }
        }
      }

      // Fetch songs + arrangements (with chord_chart)
      try {
        let offset = 0;
        const perPage = 100;
        while (true) {
          const songsRes = await fetch(`${PCO_API}/services/v2/songs?per_page=${perPage}&offset=${offset}`, {
            headers: { 'Authorization': `Basic ${auth}`, 'User-Agent': 'EgliseApp/1.0' },
          });
          if (!songsRes.ok) { results.errors.push(`Songs page offset ${offset}: ${songsRes.status}`); break; }
          const songsData = await songsRes.json();
          const songsList = songsData.data || [];
          if (songsList.length === 0) break;

          for (const s of songsList) {
            const title = s.attributes.title;
            if (!title) continue;

            let songId;
            const existing = await env.DB.prepare('SELECT id FROM songs WHERE title = ?').bind(title).first();
            if (!existing) {
              const ins = await env.DB.prepare('INSERT INTO songs (title, author, ccli_number) VALUES (?, ?, ?)')
                .bind(title, s.attributes.author || null, s.attributes.ccli_number || null).run();
              songId = ins.meta.last_row_id;
              results.songs++;
            } else {
              songId = existing.id;
            }

            // Fetch arrangements for this song (includes chord_chart)
            try {
              await new Promise(r => setTimeout(r, 50)); // small throttle
              const arrRes = await fetch(`${PCO_API}/services/v2/songs/${s.id}/arrangements`, {
                headers: { 'Authorization': `Basic ${auth}`, 'User-Agent': 'EgliseApp/1.0' },
              });
              if (arrRes.ok) {
                const arrData = await arrRes.json();
                for (const arr of arrData.data || []) {
                  const attrs = arr.attributes;
                  if (!attrs.chord_chart) continue;
                  // Check if this arrangement already exists (by name for this song)
                  const existingArr = await env.DB.prepare(
                    'SELECT id FROM arrangements WHERE song_id = ? AND name = ?'
                  ).bind(songId, attrs.name || 'default').first();
                  if (!existingArr) {
                    await env.DB.prepare(
                      'INSERT INTO arrangements (song_id, name, key, tempo, chord_chart) VALUES (?, ?, ?, ?, ?)'
                    ).bind(songId, attrs.name || 'default', attrs.key || null, attrs.tempo || null, attrs.chord_chart).run();
                    results.arrangements++;
                  } else if (attrs.chord_chart && (!existingArr.chord_chart || existingArr.chord_chart === '')) {
                    // Update if existing arrangement has no chord_chart
                    await env.DB.prepare(
                      'UPDATE arrangements SET name = COALESCE(?, name), key = COALESCE(?, key), tempo = COALESCE(?, tempo), chord_chart = COALESCE(?, chord_chart) WHERE id = ?'
                    ).bind(attrs.name || 'default', attrs.key || null, attrs.tempo || null, attrs.chord_chart, existingArr.id).run();
                  }
                }
              }
            } catch (e) { results.errors.push(`Arrangements for song ${s.id}: ${e.message}`); }
          }

          offset += perPage;
          if (songsList.length < perPage) break;
        }
      } catch (e) { results.errors.push(`Songs sync: ${e.message}`); }

    } catch (e) {
      return json({ error: e.message, results }, 500);
    }

    return json({ success: true, results });
  }),

  // Backup (dump data as JSON)
  route('GET', '/api/backup', async (request, env) => {
    if (!await hasPermission(request, env, 'manage_members')) return json({ error: 'Forbidden' }, 403);
    const tables = ['members', 'teams', 'team_members', 'service_types', 'plans', 'plan_items', 'songs', 'arrangements', 'plan_songs', 'scheduled_people', 'attendances', 'house_groups', 'group_members', 'group_meetings', 'email_templates', 'email_logs', 'communication_preferences', 'notification_tokens', 'plan_templates', 'plan_template_items', 'volunteer_preferences', 'polls', 'poll_options', 'poll_votes', 'announcements', 'church_events'];
    const backup = {};
    for (const table of tables) {
      try {
        const rows = await env.DB.prepare(`SELECT * FROM ${table}`).all();
        backup[table] = rows.results;
      } catch (e) { backup[table] = []; }
    }
    return new Response(JSON.stringify(backup, null, 2), {
      headers: {
        ...CORS,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="eglise-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }),

  // ========================================
  // CHURCH EVENTS (external scraped events)
  // ========================================
  route('GET', '/api/church-events', async (request, env, params, url) => {
    const source = url.searchParams.get('source');
    const includeExceptions = url.searchParams.get('include_exceptions') === '1';
    let query = `SELECT ce.*, 
      (SELECT COUNT(*) FROM church_event_exceptions cee WHERE cee.event_id = ce.id) as exception_count
      FROM church_events ce`;
    const binds = [];
    const conditions = [];
    if (source) {
      conditions.push('ce.source = ?');
      binds.push(source);
    }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY ce.start_date ASC, ce.start_time ASC';
    const rows = await env.DB.prepare(query).bind(...binds).all();

    if (includeExceptions) {
      // Fetch all exceptions in a single query and attach to events
      const eventIds = rows.results.map(r => r.id);
      let exceptions = [];
      if (eventIds.length > 0) {
        const placeholders = eventIds.map(() => '?').join(',');
        const exQuery = `SELECT * FROM church_event_exceptions WHERE event_id IN (${placeholders}) ORDER BY exception_date ASC`;
        const exRows = await env.DB.prepare(exQuery).bind(...eventIds).all();
        exceptions = exRows.results;
      }
      // Build a map: event_id -> exceptions[]
      const exMap = {};
      for (const ex of exceptions) {
        if (!exMap[ex.event_id]) exMap[ex.event_id] = [];
        exMap[ex.event_id].push(ex);
      }
      const resultsWithExceptions = rows.results.map(ev => ({
        ...ev,
        exceptions: exMap[ev.id] || [],
      }));
      return json(resultsWithExceptions);
    }

    return json(rows.results);
  }),

  route('GET', '/api/church-events/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const event = await env.DB.prepare('SELECT * FROM church_events WHERE id = ?').bind(id).first();
    if (!event) return notFound();
    const exceptions = await env.DB.prepare('SELECT * FROM church_event_exceptions WHERE event_id = ? ORDER BY created_at DESC').bind(id).all();
    return json({ ...event, exceptions: exceptions.results });
  }),

  route('GET', '/api/church-events/:id/exceptions', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const exceptions = await env.DB.prepare('SELECT * FROM church_event_exceptions WHERE event_id = ? ORDER BY exception_date ASC').bind(id).all();
    return json(exceptions.results);
  }),

  route('PUT', '/api/church-events/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const body = await getBody(request);
    if (!body) return badRequest('Corps JSON invalide');

    const updates = [];
    const values = [];
    if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }
    if (body.repeat_period !== undefined) { updates.push('repeat_period = ?'); values.push(body.repeat_period || null); }
    if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
    if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description || null); }
    if (body.location !== undefined) { updates.push('location = ?'); values.push(body.location || null); }
    if (body.start_time !== undefined) { updates.push('start_time = ?'); values.push(body.start_time || null); }
    if (body.end_time !== undefined) { updates.push('end_time = ?'); values.push(body.end_time || null); }

    if (updates.length === 0) return badRequest('Aucun champ à mettre à jour');
    values.push(id);
    await env.DB.prepare(`UPDATE church_events SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
    const updated = await env.DB.prepare('SELECT * FROM church_events WHERE id = ?').bind(id).first();
    return json(updated);
  }),

  route('POST', '/api/church-events/:id/exceptions', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const body = await getBody(request);
    if (!body || !body.type) return badRequest('type requis (cancelled, moved, periodicity_changed)');

    await env.DB.prepare(
      'INSERT INTO church_event_exceptions (event_id, exception_date, type, new_date, new_repeat_period, reason) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      body.exception_date || null,
      body.type,
      body.new_date || null,
      body.new_repeat_period || null,
      body.reason || null
    ).run();

    return json({ success: true });
  }),

  route('DELETE', '/api/church-events/:id/exceptions/:eid', async (request, env, params) => {
    const id = requireId(params);
    const eid = parseInt(params.eid, 10);
    if (!id || isNaN(eid)) return badRequest('ID invalide');
    await env.DB.prepare('DELETE FROM church_event_exceptions WHERE id = ? AND event_id = ?').bind(eid, id).run();
    return json({ success: true });
  }),

  // ========================================
  // GLOBAL SEARCH
  // ========================================
  route('GET', '/api/search', async (request, env, params, url) => {
    const q = url.searchParams.get('q');
    if (!q || q.length < 2) return json({ results: [] });

    const term = '%' + q + '%';
    const [members, songs, plans, teams, announcements, churchEvents] = await Promise.all([
      env.DB.prepare("SELECT id, first_name, last_name, email, phone, 'member' as type FROM members WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? LIMIT 10")
        .bind(term, term, term).all(),
      env.DB.prepare("SELECT id, title, author, 'song' as type FROM songs WHERE title LIKE ? OR author LIKE ? LIMIT 10")
        .bind(term, term).all(),
      env.DB.prepare("SELECT p.id, p.date, p.theme, p.notes, st.name as service_type, 'plan' as type FROM plans p LEFT JOIN service_types st ON st.id = p.service_type_id WHERE p.theme LIKE ? OR p.notes LIKE ? OR st.name LIKE ? LIMIT 10")
        .bind(term, term, term).all(),
      env.DB.prepare("SELECT id, name, description, 'team' as type FROM teams WHERE name LIKE ? OR description LIKE ? LIMIT 10")
        .bind(term, term).all(),
      env.DB.prepare("SELECT id, content, type, 'announcement' as type FROM announcements WHERE content LIKE ? LIMIT 10")
        .bind(term).all(),
      env.DB.prepare("SELECT id, title, location, start_date, 'church_event' as type FROM church_events WHERE title LIKE ? OR location LIKE ? OR description LIKE ? LIMIT 10")
        .bind(term, term, term).all(),
    ]);

    return json({
      results: [
        ...members.results,
        ...songs.results,
        ...plans.results,
        ...teams.results,
        ...announcements.results,
        ...churchEvents.results,
      ],
      query: q,
    });
  }),

  // ========================================
  // WEBHOOKS
  // ========================================
  // CRUD for webhook configurations
  route('GET', '/api/webhooks', async (request, env) => {
    if (!await hasPermission(request, env, 'manage_members')) return json({ error: 'Forbidden' }, 403);
    const rows = await env.DB.prepare('SELECT * FROM webhooks ORDER BY created_at DESC').all();
    return json(rows.results);
  }),

  route('POST', '/api/webhooks', async (request, env) => {
    if (!await hasPermission(request, env, 'manage_members')) return json({ error: 'Forbidden' }, 403);
    const body = await getBody(request);
    if (!body || !body.url || !body.events) return badRequest('url and events required');
    const result = await env.DB.prepare('INSERT INTO webhooks (url, events, secret, label) VALUES (?, ?, ?, ?)')
      .bind(body.url, JSON.stringify(body.events), body.secret || null, body.label || null).run();
    const created = await env.DB.prepare('SELECT * FROM webhooks WHERE id = ?').bind(result.meta.last_row_id).first();
    return json(created, 201);
  }),

  route('PUT', '/api/webhooks/:id', async (request, env, params) => {
    if (!await hasPermission(request, env, 'manage_members')) return json({ error: 'Forbidden' }, 403);
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    const body = await getBody(request);
    if (!body) return badRequest('Corps requis');
    await env.DB.prepare('UPDATE webhooks SET url = COALESCE(?, url), events = COALESCE(?, events), secret = COALESCE(?, secret), label = COALESCE(?, label) WHERE id = ?')
      .bind(body.url || null, body.events ? JSON.stringify(body.events) : null, body.secret ?? null, body.label ?? null, id).run();
    const updated = await env.DB.prepare('SELECT * FROM webhooks WHERE id = ?').bind(id).first();
    return json(updated);
  }),

  route('DELETE', '/api/webhooks/:id', async (request, env, params) => {
    if (!await hasPermission(request, env, 'manage_members')) return json({ error: 'Forbidden' }, 403);
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    await env.DB.prepare('DELETE FROM webhooks WHERE id = ?').bind(id).run();
    return new Response(null, { status: 204, headers: CORS });
  }),

  // Webhook logs
  route('GET', '/api/webhook-logs', async (request, env, params, url) => {
    if (!await hasPermission(request, env, 'manage_members')) return json({ error: 'Forbidden' }, 403);
    const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
    const per = Math.min(100, parseInt(url.searchParams.get('per') || '50', 10) || 50);
    const offset = (page - 1) * per;
    const rows = await env.DB.prepare('SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(per, offset).all();
    const total = await env.DB.prepare('SELECT COUNT(*) as c FROM webhook_logs').first();
    return json({ rows: rows.results, total: total.c, page, per });
  }),

  // Generic incoming webhook (for Zapier/Make/Calendly to push data)
  route('POST', '/api/webhook/incoming/:token', async (request, env, params) => {
    const token = params.token;
    const wh = await env.DB.prepare('SELECT * FROM webhooks WHERE secret = ?').bind(token).first();
    if (!wh) return json({ error: 'Invalid token' }, 401);

    let body;
    try { body = await request.json(); } catch { body = await request.text().catch(() => ''); }

    // Log the incoming webhook
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS webhook_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      webhook_id INTEGER, event TEXT, status INTEGER, response TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`).run();
    await env.DB.prepare('INSERT INTO webhook_logs (webhook_id, event, status, response) VALUES (?, ?, ?, ?)')
      .bind(wh.id, 'incoming', 200, typeof body === 'string' ? body.slice(0, 500) : JSON.stringify(body).slice(0, 500)).run();

    // For Zapier/Make: just acknowledge receipt
    return json({ success: true, received: true });
  }),
];

const allRoutes = [...routes0, ...routes2, ...routes3];
const router2 = createRouter(allRoutes);

// Simple in-memory rate limiter
const rateLimitMap = new Map();
function rateLimit(request) {
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
  const key = ip + ':' + request.url;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReqs = 100;
  let entry = rateLimitMap.get(key);
  if (!entry || entry.reset < now) {
    entry = { count: 0, reset: now + windowMs };
    rateLimitMap.set(key, entry);
  }
  entry.count++;
  if (entry.count > maxReqs) return true;
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap) {
      if (v.reset < now) rateLimitMap.delete(k);
    }
  }
  return false;
}

async function logApiCall(request, env, response, duration, error) {
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS api_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT, path TEXT, status INTEGER, duration INTEGER,
      error TEXT, created_at TEXT DEFAULT (datetime('now'))
    )`).run();
    const status = response ? response.status : 500;
    const errMsg = error ? error.message : (response && response.status >= 400 ? await response.clone().text().catch(() => '') : null);
    await env.DB.prepare('INSERT INTO api_logs (method, path, status, duration, error) VALUES (?, ?, ?, ?, ?)')
      .bind(request.method, new URL(request.url).pathname, status, duration, errMsg)
      .run();
  } catch (e) { /* ignore */ }
}

async function triggerWebhooks(env, event, payload) {
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS webhooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL, events TEXT, secret TEXT, label TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`).run();
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS webhook_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      webhook_id INTEGER, event TEXT, status INTEGER, response TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`).run();

    const webhooks = await env.DB.prepare('SELECT * FROM webhooks').all();
    for (const wh of webhooks.results) {
      let events;
      try { events = JSON.parse(wh.events || '[]'); } catch { events = []; }
      if (!events.includes(event) && !events.includes('*')) continue;

      try {
        const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
        const res = await fetch(wh.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': wh.secret || '',
            'X-Event': event,
          },
          body,
        });
        const resText = await res.text().catch(() => '').then(t => t.slice(0, 500));
        if (res.ok) {
          await env.DB.prepare('INSERT INTO webhook_logs (webhook_id, event, status, response) VALUES (?, ?, ?, ?)')
            .bind(wh.id, event, res.status, resText).run();
        } else {
          const nextRetry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
          await env.DB.prepare('INSERT INTO webhook_logs (webhook_id, event, status, response, retry_count, max_retries, next_retry_at) VALUES (?, ?, ?, ?, 0, 6, ?)')
            .bind(wh.id, event, res.status, resText, nextRetry).run();
        }
      } catch (e) {
        const nextRetry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        await env.DB.prepare('INSERT INTO webhook_logs (webhook_id, event, status, response, retry_count, max_retries, next_retry_at) VALUES (?, ?, ?, ?, 0, 6, ?)')
          .bind(wh.id, event, 0, e.message, nextRetry).run();
      }
    }
  } catch (e) { /* ignore webhook errors */ }
}

async function processWebhookRetries(env) {
  try {
    const due = await env.DB.prepare(`
      SELECT wl.*, w.url, w.secret
      FROM webhook_logs wl
      JOIN webhooks w ON w.id = wl.webhook_id
      WHERE wl.next_retry_at IS NOT NULL
        AND wl.next_retry_at <= datetime('now')
        AND wl.retry_count < wl.max_retries
      ORDER BY wl.next_retry_at ASC
      LIMIT 20
    `).all();

    for (const log of due.results) {
      try {
        const body = JSON.stringify({ event: JSON.parse(log.event || '{}') });
        const res = await fetch(log.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(log.secret ? { 'X-Webhook-Secret': log.secret } : {}),
          },
          body,
        });
        const resText = await res.text().catch(() => '').then(t => t.slice(0, 500));
        if (res.ok) {
          await env.DB.prepare('UPDATE webhook_logs SET status = ?, response = ?, next_retry_at = NULL, retry_count = retry_count + 1 WHERE id = ?')
            .bind(res.status, resText, log.id).run();
        } else {
          const backoff = [5, 15, 45, 120, 360, 1080];
          const nextDelay = (backoff[log.retry_count + 1] || 1080) * 60 * 1000;
          const nextRetry = new Date(Date.now() + nextDelay).toISOString();
          await env.DB.prepare('UPDATE webhook_logs SET status = ?, response = ?, next_retry_at = ?, retry_count = retry_count + 1 WHERE id = ?')
            .bind(res.status, resText, nextRetry, log.id).run();
        }
      } catch (e) {
        const backoff = [5, 15, 45, 120, 360, 1080];
        const nextDelay = (backoff[log.retry_count + 1] || 1080) * 60 * 1000;
        const nextRetry = new Date(Date.now() + nextDelay).toISOString();
        await env.DB.prepare('UPDATE webhook_logs SET status = 0, response = ?, next_retry_at = ?, retry_count = retry_count + 1 WHERE id = ?')
          .bind(e.message, nextRetry, log.id).run();
      }
    }
  } catch (e) { /* ignore retry errors */ }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }
    if (rateLimit(request)) {
      return new Response('Too Many Requests', { status: 429, headers: CORS });
    }
    const startTime = Date.now();
    try {
      const response = await router2(request, env);
      logApiCall(request, env, response, Date.now() - startTime);
      return response;
    } catch (e) {
      logApiCall(request, env, null, Date.now() - startTime, e);
      throw e;
    }
  },

  // Scheduled handler for reminders + webhook retries (cron trigger)
  async scheduled(event, env) {
    await processWebhookRetries(env);

    const apiKey = env.RESEND_API_KEY;
    const from = env.EMAIL_FROM || 'no-reply@example.com';
    const frontend = env.FRONTEND_URL || 'https://eglise-app.pages.dev';

    async function sendReminders(daysBefore, columnFlag) {
      const plans = await env.DB.prepare(`
        SELECT p.id, p.date, p.time, p.theme, st.name as service_type_name
        FROM plans p
        LEFT JOIN service_types st ON st.id = p.service_type_id
        WHERE p.date = date('now', '+${daysBefore} days')
          AND p.status = 'planned'
          AND p.${columnFlag} = 0
      `).all();

      for (const plan of plans.results) {
        const participants = await env.DB.prepare(`
          SELECT m.first_name, m.last_name, m.email, sp.status, sp.position, t.name as team_name
          FROM scheduled_people sp
          JOIN members m ON m.id = sp.member_id
          LEFT JOIN teams t ON t.id = sp.team_id
          WHERE sp.plan_id = ?
        `).bind(plan.id).all();

        for (const p of participants.results) {
          if (!p.email) continue;
          if (p.status === 'declined') continue;
          const dayLabel = daysBefore === 2 ? 'J-2' : 'rappel';
          const html = `<p>Bonjour ${p.first_name},</p>
            <p>Ceci est un ${dayLabel} : tu es planifié(e) pour le service du <strong>${plan.date} à ${plan.time || '10:00'}</strong>.</p>
            ${p.team_name ? `<p>Équipe: ${p.team_name}${p.position ? ` (${p.position})` : ''}</p>` : ''}
            <p>Merci de confirmer ta présence sur <a href="${frontend}/mon-compte">ton compte</a>.</p>
            <p>Merci !</p>`;
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({ from, to: p.email, subject: `Rappel: Service ${plan.date}`, html }),
            });
          } catch (e) { /* ignore */ }
        }

        await env.DB.prepare(`UPDATE plans SET ${columnFlag} = 1 WHERE id = ?`).bind(plan.id).run();
      }
    }

    await sendReminders(2, 'reminder_j2_sent');
    await sendReminders(1, 'reminder_j1_sent');
  },
};
