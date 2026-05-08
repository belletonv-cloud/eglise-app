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

async function getBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// Authorization helpers (lightweight)
const ROLE_PERMISSIONS = {
  admin: ['*'],
  scheduler: ['schedule', 'view_conflicts'],
  editor: ['edit_members', 'edit_teams'],
  viewer: [],
};

async function getMemberFromRequest(request, env) {
  // Prefer Firebase ID token in Authorization header (Bearer)
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
  // If FIREBASE_PROJECT_ID is configured, require Authorization bearer token for identification.
  if (env.FIREBASE_PROJECT_ID) return null
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
  const crypto = globalThis.crypto || require('crypto')
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
      const hmac = require('crypto').createHmac('sha256', secret).update(payloadJson).digest('base64');
      return Buffer.from(payloadJson).toString('base64') + '.' + hmac;
    }
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
    const buf = require('crypto').randomBytes(bytes);
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    // last fallback
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
}

async function verifyOneClickToken(token, secret) {
  try {
    const [b64payload, b64sig] = token.split('.')
    const payloadJson = Buffer.from(b64payload, 'base64').toString('utf8')
    if (crypto.subtle) {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
      const sig = Uint8Array.from(atob(b64sig), c=>c.charCodeAt(0));
      const ok = await crypto.subtle.verify('HMAC', key, sig, enc.encode(payloadJson));
      if (!ok) return null
      return JSON.parse(payloadJson)
    }
    const expected = require('crypto').createHmac('sha256', secret).update(payloadJson).digest('base64')
    if (expected !== b64sig) return null
    return JSON.parse(payloadJson)
  } catch (e) { return null }
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
    return json(updated);
  }),

  route('DELETE', '/api/plans/:id', async (request, env, params) => {
    const id = requireId(params);
    if (!id) return badRequest('ID invalide');
    await env.DB.prepare('DELETE FROM plans WHERE id = ?').bind(id).run();
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
        a.name as arrangement_name, a.key as arrangement_key,
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
          await env.DB.prepare('UPDATE email_oneclicks SET used = 1, used_at = datetime('"'now'"') WHERE id = ?').bind(dbRow.id).run();
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

  route('POST', '/api/upload', async (request, env, params) => {
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

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }
    return router(request, env);
  },
};
