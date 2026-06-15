import { describe, it, expect, vi, beforeEach } from 'vitest'
import { portalRoutes } from '../../src/routes/portal.js'

vi.mock('../../src/auth.js')

import { getMemberFromRequest, hasPermission, requirePermission } from '../../src/auth.js'
const mockedGetMember = vi.mocked(getMemberFromRequest)
const mockedHasPermission = vi.mocked(hasPermission)
const mockedRequirePermission = vi.mocked(requirePermission)

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind, first, all, run }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

const mockMember = { id: 1, first_name: 'Test', last_name: 'User', email: 'test@test.com', role: 'admin', phone: null, notes: null, birth_date: null }

describe('portalRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('route metadata', () => {
    it('exports an array with 5 routes', () => {
      expect(Array.isArray(portalRoutes)).toBe(true)
      expect(portalRoutes).toHaveLength(5)
    })

    it('each route has method, pattern, names, and handler', () => {
      for (const route of portalRoutes) {
        expect(route).toHaveProperty('method')
        expect(route).toHaveProperty('pattern')
        expect(route.pattern).toBeInstanceOf(RegExp)
        expect(route).toHaveProperty('names')
        expect(route).toHaveProperty('handler')
        expect(typeof route.handler).toBe('function')
      }
    })
  })

  describe('GET /api/me', () => {
    it('returns authenticated member with teams', async () => {
      mockedGetMember.mockResolvedValue(mockMember)
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 1, name: 'Worship', position: 'Member' }] })

      const route = portalRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/me'))!
      const response = await route.handler(new Request('http://localhost/api/me'), { DB })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.first_name).toBe('Test')
      expect(body.teams).toHaveLength(1)
      expect(body.teams[0].name).toBe('Worship')
    })

    it('returns 401 when not authenticated', async () => {
      mockedGetMember.mockResolvedValue(null)
      const { DB } = createMockDb()

      const route = portalRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/me'))!
      const response = await route.handler(new Request('http://localhost/api/me'), { DB })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Not authenticated')
    })
  })

  describe('PUT /api/me', () => {
    it('updates allowed fields and returns updated member', async () => {
      mockedGetMember.mockResolvedValue(mockMember)
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, first_name: 'Test', last_name: 'User', phone: '0123456789', notes: 'Updated', birth_date: '1990-01-01', role: 'admin', email: 'test@test.com' })

      const route = portalRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/me'))!
      const response = await route.handler(
        new Request('http://localhost/api/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: '0123456789', notes: 'Updated', birth_date: '1990-01-01' }),
        }),
        { DB },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.phone).toBe('0123456789')
    })

    it('returns 401 when not authenticated', async () => {
      mockedGetMember.mockResolvedValue(null)
      const { DB } = createMockDb()

      const route = portalRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/me'))!
      const response = await route.handler(
        new Request('http://localhost/api/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: '0123456789' }),
        }),
        { DB },
      )

      expect(response.status).toBe(401)
    })

    it('returns 400 for invalid JSON', async () => {
      mockedGetMember.mockResolvedValue(mockMember)
      const { DB } = createMockDb()

      const route = portalRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/me'))!
      const response = await route.handler(
        new Request('http://localhost/api/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: 'not json',
        }),
        { DB },
      )

      expect(response.status).toBe(400)
    })

    it('returns member unchanged when no allowed fields provided', async () => {
      mockedGetMember.mockResolvedValue(mockMember)
      const { DB } = createMockDb()

      const route = portalRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/me'))!
      const response = await route.handler(
        new Request('http://localhost/api/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'admin' }),
        }),
        { DB },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.first_name).toBe('Test')
    })
  })

  describe('GET /api/me/schedule', () => {
    it('returns upcoming schedule', async () => {
      mockedGetMember.mockResolvedValue(mockMember)
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 1, plan_id: 10, date: '2026-07-01', theme: 'Morning Service' }] })

      const route = portalRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/me/schedule'))!
      const response = await route.handler(new Request('http://localhost/api/me/schedule'), { DB })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveLength(1)
      expect(body[0].theme).toBe('Morning Service')
    })

    it('returns 401 when not authenticated', async () => {
      mockedGetMember.mockResolvedValue(null)
      const { DB } = createMockDb()

      const route = portalRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/me/schedule'))!
      const response = await route.handler(new Request('http://localhost/api/me/schedule'), { DB })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/volunteer-preferences/:memberId', () => {
    it('returns own preferences', async () => {
      mockedGetMember.mockResolvedValue(mockMember)
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, member_id: 1, unavailable_dates: '[]', max_services_per_month: 4, notes: '' })

      const route = portalRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/volunteer-preferences/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/volunteer-preferences/1'),
        { DB },
        { memberId: '1' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.member_id).toBe(1)
    })

    it('returns default preferences when none exist', async () => {
      mockedGetMember.mockResolvedValue(mockMember)
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)

      const route = portalRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/volunteer-preferences/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/volunteer-preferences/1'),
        { DB },
        { memberId: '1' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.unavailable_dates).toBe('[]')
      expect(body.max_services_per_month).toBe(4)
    })

    it('returns 401 when not authenticated', async () => {
      mockedGetMember.mockResolvedValue(null)
      const { DB } = createMockDb()

      const route = portalRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/volunteer-preferences/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/volunteer-preferences/1'),
        { DB },
        { memberId: '1' },
      )

      expect(response.status).toBe(401)
    })

    it('returns 403 when viewing others without permission', async () => {
      mockedGetMember.mockResolvedValue({ ...mockMember, id: 2, role: 'member' })
      mockedHasPermission.mockResolvedValue(false)

      const { DB } = createMockDb()

      const route = portalRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/volunteer-preferences/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/volunteer-preferences/1'),
        { DB },
        { memberId: '1' },
      )

      expect(response.status).toBe(403)
    })

    it('returns 400 for invalid member ID', async () => {
      mockedGetMember.mockResolvedValue(mockMember)
      const { DB } = createMockDb()

      const route = portalRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/volunteer-preferences/abc'))!
      const response = await route.handler(
        new Request('http://localhost/api/volunteer-preferences/abc'),
        { DB },
        { memberId: 'abc' },
      )

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/volunteer-preferences/:memberId', () => {
    it('creates preferences when none exist', async () => {
      mockedGetMember.mockResolvedValue(mockMember)
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce(null)  // no existing prefs
      first.mockResolvedValueOnce({ id: 1, member_id: 1, unavailable_dates: '["2026-07-01"]', max_services_per_month: 2, notes: 'Test' })

      const route = portalRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/volunteer-preferences/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/volunteer-preferences/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unavailable_dates: ['2026-07-01'], max_services_per_month: 2, notes: 'Test' }),
        }),
        { DB },
        { memberId: '1' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.max_services_per_month).toBe(2)
    })

    it('updates existing preferences', async () => {
      mockedGetMember.mockResolvedValue(mockMember)
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1 })  // existing prefs
      first.mockResolvedValueOnce({ id: 1, member_id: 1, unavailable_dates: '[]', max_services_per_month: 6, notes: 'Updated' })

      const route = portalRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/volunteer-preferences/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/volunteer-preferences/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ max_services_per_month: 6, notes: 'Updated' }),
        }),
        { DB },
        { memberId: '1' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.max_services_per_month).toBe(6)
      expect(body.notes).toBe('Updated')
    })

    it('returns 400 for invalid member ID', async () => {
      mockedGetMember.mockResolvedValue(mockMember)
      const { DB } = createMockDb()

      const route = portalRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/volunteer-preferences/abc'))!
      const response = await route.handler(
        new Request('http://localhost/api/volunteer-preferences/abc', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ max_services_per_month: 2 }),
        }),
        { DB },
        { memberId: 'abc' },
      )

      expect(response.status).toBe(400)
    })

    it('returns 400 for invalid JSON', async () => {
      mockedGetMember.mockResolvedValue(mockMember)
      const { DB } = createMockDb()

      const route = portalRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/volunteer-preferences/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/volunteer-preferences/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: 'not json',
        }),
        { DB },
        { memberId: '1' },
      )

      expect(response.status).toBe(400)
    })

    it('allows self-service and rejects others without permission', async () => {
      mockedGetMember.mockResolvedValue({ ...mockMember, id: 2, role: 'member' })
      mockedRequirePermission.mockResolvedValue(new Response(JSON.stringify({ error: 'Permission refusée' }), { status: 403 }))
      const { DB } = createMockDb()

      const route = portalRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/volunteer-preferences/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/volunteer-preferences/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ max_services_per_month: 2 }),
        }),
        { DB },
        { memberId: '1' },
      )

      expect(response.status).toBe(403)
    })
  })
})
