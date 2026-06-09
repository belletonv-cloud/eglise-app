// Authentication and Authorization for Église App
import { json, unauthorized } from './lib.js'

export const ROLE_PERMISSIONS = {
  admin: ['*'],
  // member: base role for any church member — can read everything,
  // edit own profile, annotate charts, respond to scheduling requests
  member: ['annotate', 'respond_schedule', 'edit_own_profile'],
  scheduler: ['schedule', 'view_conflicts', 'force_schedule'],
  // editor can manage members/teams AND publish content (announcements, polls)
  editor: ['edit_members', 'edit_teams', 'manage_members', 'edit_announcements'],
  music_director: ['schedule', 'edit_music', 'view_conflicts', 'edit_announcements'],
  tech_director: ['schedule', 'view_conflicts', 'edit_tech'],
  volunteer: [],
  viewer: [],
}

// In-memory caches for Firebase token verification
const tokenCache = new Map()
const TOKEN_CACHE_MAX = 500

const SECURETOKEN_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

const jwksCache = {
  expiresAtMs: 0,
  jwksByKid: new Map(),
}

const verifyKeyCache = new Map() // kid -> CryptoKey

function parseMaxAgeSeconds(cacheControl) {
  if (!cacheControl) return null
  const m = cacheControl.match(/max-age=(\d+)/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

function base64UrlToBytes(s) {
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  const padded = pad === 0 ? base64 : base64 + '='.repeat(4 - pad)
  const bin = atob(padded)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function base64UrlToJson(s) {
  const bytes = base64UrlToBytes(s)
  const json = new TextDecoder().decode(bytes)
  return JSON.parse(json)
}

async function getSecureTokenJwksByKid() {
  if (Date.now() < jwksCache.expiresAtMs && jwksCache.jwksByKid.size) {
    return jwksCache.jwksByKid
  }

  const res = await fetch(SECURETOKEN_JWKS_URL)
  if (!res.ok) throw new Error('Failed to fetch SecureToken JWKS')

  const maxAge = parseMaxAgeSeconds(res.headers.get('Cache-Control')) ?? 60 * 60
  const data = await res.json()
  const map = new Map()
  for (const jwk of data.keys || []) {
    if (jwk?.kid) map.set(jwk.kid, jwk)
  }

  jwksCache.jwksByKid = map
  jwksCache.expiresAtMs = Date.now() + maxAge * 1000
  verifyKeyCache.clear()

  return jwksCache.jwksByKid
}

async function getVerifyKeyForKid(kid) {
  const cached = verifyKeyCache.get(kid)
  if (cached) return cached

  const jwksByKid = await getSecureTokenJwksByKid()
  const jwk = jwksByKid.get(kid)
  if (!jwk) return null

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  )

  verifyKeyCache.set(kid, key)
  return key
}

async function verifyFirebaseToken(token, env) {
  const cached = tokenCache.get(token)
  if (cached && cached.exp > Math.floor(Date.now() / 1000)) {
    return cached.payload
  }

  if (tokenCache.size > TOKEN_CACHE_MAX) {
    const entries = [...tokenCache.entries()]
    const half = Math.floor(entries.length / 2)
    for (let i = 0; i < half; i++) tokenCache.delete(entries[i][0])
  }

  try {
    const [h, p, s] = token.split('.')
    if (!h || !p || !s) return null

    const header = base64UrlToJson(h)
    if (header.alg !== 'RS256' || !header.kid) return null

    const payload = base64UrlToJson(p)

    // FIREBASE_PROJECT_ID is not a secret (it's the public Firebase project id),
    // but Cloudflare secrets may be missing/misconfigured in some environments.
    // Use a safe fallback to avoid rejecting valid tokens due to env drift.
    const projectId = env.FIREBASE_PROJECT_ID || 'eglise-app-b81b0'

    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null
    if (payload.aud !== projectId) return null

    const now = Math.floor(Date.now() / 1000)
    if (!payload.exp || Number(payload.exp) <= now) return null

    const key = await getVerifyKeyForKid(header.kid)
    if (!key) return null

    const data = new TextEncoder().encode(`${h}.${p}`)
    const sig = base64UrlToBytes(s)

    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, data)
    if (!ok) return null

    tokenCache.set(token, { payload, exp: Number(payload.exp) })
    return payload
  } catch (e) {
    console.error('auth: Firebase token verification failed', e);
    return null
  }
}

export async function getMemberFromRequest(request, env) {
  // Demo mode: allow demo email header
  const demoEmail = request.headers.get('x-demo-email') || request.headers.get('X-Demo-Email')
  if (demoEmail) {
    const m = await env.DB.prepare('SELECT * FROM members WHERE email = ?').bind(demoEmail).first()
    if (m) return m
    // Auto-create member for demo — derive role from email
    try {
      const roleHint = demoEmail.split('@')[0]  // e.g. "admin", "member", "scheduler"
      const knownRoles = ['admin', 'scheduler', 'editor', 'music_director', 'volunteer', 'viewer', 'member', 'guest']
      const role = knownRoles.includes(roleHint) ? roleHint : 'member'
      const nameParts = roleHint === 'admin' ? ['Admin', 'Démo'] : [roleHint.charAt(0).toUpperCase() + roleHint.slice(1), '']
      await env.DB.prepare(
        'INSERT INTO members (first_name, last_name, email, role, membership_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))'
      ).bind(nameParts[0], nameParts[1], demoEmail, role, role === 'admin' ? 'staff' : 'member').run()
      return await env.DB.prepare('SELECT * FROM members WHERE email = ?').bind(demoEmail).first()
    } catch (e) { console.error('demo auto-create failed:', e); return null }
  }

  // Firebase ID token
  const auth = request.headers.get('Authorization') || ''
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7)
    const payload = await verifyFirebaseToken(token, env)
    if (payload && payload.email) {
      const m = await env.DB.prepare('SELECT * FROM members WHERE email = ?').bind(payload.email).first()
      if (m) {
        // Safety: ensure the primary admin email is always admin, even if the member was created earlier.
        if (payload.email === 'belletonv@gmail.com' && m.role !== 'admin') {
          await env.DB.prepare(
            "UPDATE members SET role = 'admin', membership_type = 'staff', updated_at = datetime('now') WHERE id = ?",
          )
            .bind(m.id)
            .run();
          return await env.DB.prepare('SELECT * FROM members WHERE id = ?').bind(m.id).first();
        }
        return m
      }
      // Auto-create member for first-time Firebase users
      try {
        const name = payload.name || payload.email.split('@')[0] || ''
        const parts = name.split(' ')
        const firstName = parts[0] || name
        const lastName = parts.slice(1).join(' ') || ''
        const role = payload.email === 'belletonv@gmail.com' ? 'admin' : 'member'
        await env.DB.prepare(
          "INSERT INTO members (first_name, last_name, email, role, membership_type, created_at, updated_at) VALUES (?, ?, ?, ?, 'member', datetime('now'), datetime('now'))"
        ).bind(firstName, lastName, payload.email, role).run()
        return await env.DB.prepare('SELECT * FROM members WHERE email = ?').bind(payload.email).first()
      } catch (e) {
        console.error('Auto-create Firebase member failed', e)
        return null
      }
    }
  }

  // Dev fallback (only if DEV_AUTH_SECRET is set)
  const devSecret = request.headers.get('X-Auth-Secret')
  const devEmail = request.headers.get('x-user-email')
  if (devSecret && devEmail && env.DEV_AUTH_SECRET && devSecret === env.DEV_AUTH_SECRET) {
    const m = await env.DB.prepare('SELECT * FROM members WHERE email = ?').bind(devEmail).first()
    if (m) return m
  }

  return null
}

export async function hasPermission(request, env, permission) {
  if (!permission) return false
  const member = await getMemberFromRequest(request, env)
  if (!member) return false
  if (member.role === 'admin') return true

  const rolePerms = ROLE_PERMISSIONS[member.role] || []
  let allowed = rolePerms.includes('*') || rolePerms.includes(permission)

  // Check per-member exceptions (most recent entry wins over role default)
  // Note: resource_permissions table stores per-resource overrides (e.g. access to plan #42)
  // and is NOT consulted here — use hasResourcePermission() when that granularity is needed.
  const ex = await env.DB.prepare(
    'SELECT granted FROM member_exceptions WHERE member_id = ? AND permission = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(member.id, permission).first()
  if (ex) {
    allowed = !!ex.granted
  }

  return !!allowed
}

// RBAC guard middleware: returns a 403 response if not permitted, or null if allowed
export async function requirePermission(request, env, permission) {
  if (!await hasPermission(request, env, permission)) {
    return unauthorized('Permission refusée')
  }
  return null
}
