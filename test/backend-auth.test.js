import { describe, it, expect, vi, beforeAll } from 'vitest'

describe('Token generation', () => {
  function generateSecureToken(bytes = 32) {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint8Array(bytes);
      crypto.getRandomValues(arr);
      let s = '';
      for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
      const b64 = btoa(s);
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }

  it('generates URL-safe base64 tokens', () => {
    const token = generateSecureToken(32)
    expect(token).not.toContain('+')
    expect(token).not.toContain('/')
    expect(token).not.toContain('=')
  })

  it('generates tokens of variable length based on bytes param', () => {
    const short = generateSecureToken(16)
    const long = generateSecureToken(64)
    expect(long.length).toBeGreaterThan(short.length)
  })
})

describe('Authorization header parsing', () => {
  function extractBearerToken(request) {
    const auth = request.headers.get('Authorization') || ''
    if (auth.startsWith('Bearer ')) return auth.slice(7)
    return null
  }

  it('extracts Bearer token from Authorization header', () => {
    const req = new Request('https://example.test', {
      headers: { Authorization: 'Bearer test-token-123' },
    })
    expect(extractBearerToken(req)).toBe('test-token-123')
  })

  it('returns null for missing Authorization header', () => {
    const req = new Request('https://example.test')
    expect(extractBearerToken(req)).toBeNull()
  })

  it('returns null for non-Bearer authorization', () => {
    const req = new Request('https://example.test', {
      headers: { Authorization: 'Basic dGVzdDp0ZXN0' },
    })
    expect(extractBearerToken(req)).toBeNull()
  })
})

describe('CORS headers', () => {
  function corsHeaders(origin) {
    const allowed = ['https://eglise-app.pages.dev', 'https://eglise-cieux-ouverts.pages.dev', 'http://localhost:5173', 'http://localhost:8787']
    if (allowed.includes(origin)) {
      return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-demo-email, x-user-email, X-Auth-Secret',
        'Access-Control-Max-Age': '86400',
      }
    }
    return { 'Access-Control-Allow-Origin': origin }
  }

  it('allows known origins', () => {
    const headers = corsHeaders('https://eglise-app.pages.dev')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://eglise-app.pages.dev')
    expect(headers['Access-Control-Allow-Methods']).toBeDefined()
  })

  it('allows localhost origins for development', () => {
    const headers = corsHeaders('http://localhost:5173')
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173')
  })

  it('returns origin for unknown origins (passthrough)', () => {
    const headers = corsHeaders('https://evil-site.com')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://evil-site.com')
    expect(headers['Access-Control-Allow-Methods']).toBeUndefined()
  })
})

describe('OneClick token', () => {
  function signOneClickToken(payload, secret) {
    return btoa(JSON.stringify(payload)) + '.' + btoa(secret)
  }

  function verifyOneClickToken(token, secret) {
    const parts = token.split('.')
    if (parts.length !== 2) return null
    const payload = JSON.parse(atob(parts[0]))
    const sig = atob(parts[1])
    return sig === secret ? payload : null
  }

  it('signs and verifies a one-click token', () => {
    const payload = { action: 'confirm', member_id: 42, email: 'test@test.com' }
    const secret = 'my-secret-key'
    const token = signOneClickToken(payload, secret)
    const result = verifyOneClickToken(token, secret)
    expect(result).toEqual(payload)
  })

  it('rejects invalid signature', () => {
    const payload = { action: 'confirm', member_id: 42 }
    const token = signOneClickToken(payload, 'real-secret')
    const result = verifyOneClickToken(token, 'wrong-secret')
    expect(result).toBeNull()
  })

  it('rejects malformed tokens', () => {
    expect(verifyOneClickToken('invalid', 'secret')).toBeNull()
    expect(verifyOneClickToken('', 'secret')).toBeNull()
  })
})

describe('RBAC role hierarchy', () => {
  const ROLE_PERMISSIONS = {
    admin: ['*'],
    scheduler: ['schedule', 'view_conflicts', 'force_schedule'],
    editor: ['edit_members', 'edit_teams', 'manage_members'],
    music_director: ['schedule', 'edit_music', 'view_conflicts'],
    volunteer: [],
    viewer: [],
  }

  function hasPermission(member, permission) {
    if (!member) return false
    const role = member.role || 'viewer'
    const perms = ROLE_PERMISSIONS[role] || []
    if (perms.includes('*')) return true
    return perms.includes(permission)
  }

  it('admin has all permissions', () => {
    expect(hasPermission({ role: 'admin' }, 'anything')).toBe(true)
    expect(hasPermission({ role: 'admin' }, 'edit_members')).toBe(true)
  })

  it('scheduler has schedule permissions', () => {
    expect(hasPermission({ role: 'scheduler' }, 'schedule')).toBe(true)
    expect(hasPermission({ role: 'scheduler' }, 'edit_members')).toBe(false)
  })

  it('volunteer has no permissions', () => {
    expect(hasPermission({ role: 'volunteer' }, 'schedule')).toBe(false)
    expect(hasPermission({ role: 'volunteer' }, 'view_conflicts')).toBe(false)
  })

  it('viewer has no permissions', () => {
    expect(hasPermission({ role: 'viewer' }, 'schedule')).toBe(false)
  })

  it('returns false for null member', () => {
    expect(hasPermission(null, 'schedule')).toBe(false)
  })

  it('returns false for undefined role', () => {
    expect(hasPermission({}, 'schedule')).toBe(false)
  })
})
