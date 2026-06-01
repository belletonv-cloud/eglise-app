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

// In-memory cache for Firebase token verification
const tokenCache = new Map()
const TOKEN_CACHE_MAX = 500

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
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`)
    if (!res.ok) return null
    const payload = await res.json()

    if (payload.iss !== `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`) return null
    if (payload.aud !== env.FIREBASE_PROJECT_ID) return null

    tokenCache.set(token, { payload, exp: payload.exp })
    return payload
  } catch {
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
    } catch { return null }
  }

  // Firebase ID token
  const auth = request.headers.get('Authorization') || ''
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7)
    const payload = await verifyFirebaseToken(token, env)
    if (payload && payload.email) {
      const m = await env.DB.prepare('SELECT * FROM members WHERE email = ?').bind(payload.email).first()
      if (m) return m
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
