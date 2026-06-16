import { describe, it, expect, vi, beforeEach } from 'vitest'
import { replacementRoutes } from '../../src/routes/replacement.js'

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind, first, all, run }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('replacementRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('route metadata', () => {
    it('exports an array with 3 routes', () => {
      expect(Array.isArray(replacementRoutes)).toBe(true)
      expect(replacementRoutes).toHaveLength(3)
    })

    it('each route has method, pattern, names, and handler', () => {
      for (const route of replacementRoutes) {
        expect(route).toHaveProperty('method')
        expect(route).toHaveProperty('pattern')
        expect(route.pattern).toBeInstanceOf(RegExp)
        expect(route).toHaveProperty('names')
        expect(route).toHaveProperty('handler')
        expect(typeof route.handler).toBe('function')
      }
    })
  })

  describe('GET /api/plans/:id/replacements/:scheduledId', () => {
    it('returns replacement candidates for a scheduled person', async () => {
      const { DB, all, first } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, plan_id: 10, member_id: 5, team_id: 3, status: 'pending' })
      all.mockResolvedValueOnce({ results: [
        { id: 2, first_name: 'Jane', last_name: 'Doe', email: 'jane@test.com', phone: '012345', member_position: 'Member' },
      ] })

      const route = replacementRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/plans/10/replacements/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/10/replacements/1'),
        { DB },
        { id: '10', scheduledId: '1' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveLength(1)
      expect(body[0].first_name).toBe('Jane')
    })

    it('returns 404 when scheduled person not found', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)

      const route = replacementRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/plans/10/replacements/999'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/10/replacements/999'),
        { DB },
        { id: '10', scheduledId: '999' },
      )

      expect(response.status).toBe(404)
    })

    it('returns 400 when plan ID is invalid', async () => {
      const route = replacementRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/plans/abc/replacements/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/abc/replacements/1'),
        { DB: createMockDb().DB },
        { id: 'abc', scheduledId: '1' },
      )

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/plans/:id/replacements/:scheduledId', () => {
    it('replaces a scheduled person and sends notification email', async () => {
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => '{}' })

      try {
        const { DB, first, run } = createMockDb()
        first.mockResolvedValueOnce({ id: 1, plan_id: 10, member_id: 5, team_id: 3 })
        run.mockResolvedValueOnce({})
        first.mockResolvedValueOnce({ date: '2026-07-01', time: '10:00', theme: 'Morning' })
        first.mockResolvedValueOnce({ id: 2, first_name: 'Jane', last_name: 'Doe', email: 'jane@test.com' })
        first.mockResolvedValueOnce({ id: 1, member_id: 2, first_name: 'Jane', last_name: 'Doe', email: 'jane@test.com', team_name: 'Worship', status: 'pending', plan_id: 10 })

        const route = replacementRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plans/10/replacements/1'))!
        const response = await route.handler(
          new Request('http://localhost/api/plans/10/replacements/1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_id: 10, new_member_id: 2 }),
          }),
          { DB, RESEND_API_KEY: 're_test', EMAIL_FROM: 'church@test.com', FRONTEND_URL: 'https://app.test.com' },
          { id: '10', scheduledId: '1' },
        )

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.member_id).toBe(2)
        expect(global.fetch).toHaveBeenCalled()
      } finally {
        global.fetch = originalFetch
      }
    })

    it('replaces a scheduled person without email if RESEND_API_KEY is missing', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, plan_id: 10, member_id: 5, team_id: 3 })
      run.mockResolvedValueOnce({})
      first.mockResolvedValueOnce({ date: '2026-07-01', time: '10:00', theme: 'Morning' })
      first.mockResolvedValueOnce({ id: 2, first_name: 'Jane', last_name: 'Doe', email: 'jane@test.com' })
      first.mockResolvedValueOnce({ id: 1, member_id: 2, first_name: 'Jane', last_name: 'Doe', email: 'jane@test.com', team_name: 'Worship', status: 'pending', plan_id: 10 })

      const route = replacementRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plans/10/replacements/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/10/replacements/1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: 10, new_member_id: 2 }),
        }),
        { DB },
        { id: '10', scheduledId: '1' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.member_id).toBe(2)
    })

    it('returns 404 when scheduled person not found', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)

      const route = replacementRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plans/10/replacements/999'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/10/replacements/999', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: 10, new_member_id: 2 }),
        }),
        { DB },
        { id: '10', scheduledId: '999' },
      )

      expect(response.status).toBe(404)
    })

    it('returns 400 when new_member_id is missing', async () => {
      const route = replacementRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plans/10/replacements/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/10/replacements/1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB: createMockDb().DB },
        { id: '10', scheduledId: '1' },
      )

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/attendance-stats', () => {
    it('returns attendance stats for current year', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ c: 100 })
      all.mockResolvedValueOnce({ results: [{ member_id: 1, first_name: 'John', last_name: 'Doe', count: 20 }] })
      all.mockResolvedValueOnce({ results: [{ month: '06', count: 15 }] })
      all.mockResolvedValueOnce({ results: [{ id: 1, member_id: 1, plan_date: '2026-06-01', first_name: 'John', last_name: 'Doe' }] })

      const route = replacementRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/attendance-stats'))!
      const response = await route.handler(
        new Request('http://localhost/api/attendance-stats'),
        { DB },
        {},
        new URL('http://localhost/api/attendance-stats'),
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.total).toBe(100)
      expect(body.perMember).toHaveLength(1)
      expect(body.perMonth).toHaveLength(1)
      expect(body.recent).toHaveLength(1)
    })

    it('filters by year and member_id', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ c: 5 })
      all.mockResolvedValueOnce({ results: [] })
      all.mockResolvedValueOnce({ results: [] })
      all.mockResolvedValueOnce({ results: [] })

      const route = replacementRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/attendance-stats'))!
      const response = await route.handler(
        new Request('http://localhost/api/attendance-stats?year=2025&member_id=3'),
        { DB },
        {},
        new URL('http://localhost/api/attendance-stats?year=2025&member_id=3'),
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.total).toBe(5)
    })
  })
})
