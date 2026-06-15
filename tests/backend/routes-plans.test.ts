import { describe, it, expect, vi, beforeEach } from 'vitest'
import { plansRoutes } from '../../src/routes/plans.js'

vi.mock('../../src/auth.js')

vi.mock('../../src/webhooks.js', () => ({
  triggerWebhooks: vi.fn(() => Promise.resolve()),
}))

import { hasPermission } from '../../src/auth.js'
const mockedHasPermission = vi.mocked(hasPermission)

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('plansRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
  })

  describe('route metadata', () => {
    it('exports an array with 12 routes', () => {
      expect(Array.isArray(plansRoutes)).toBe(true)
      // 12 routes: GET plans, GET plan:id, GET public/plans/:token,
      // POST share, DELETE share, POST plan, PUT plan, DELETE plan,
      // GET plan items, POST plan items, PUT plan-item, DELETE plan-item
      expect(plansRoutes).toHaveLength(12)
    })

    it('each route has method, pattern, names, and handler', () => {
      for (const route of plansRoutes) {
        expect(route).toHaveProperty('method')
        expect(route).toHaveProperty('pattern')
        expect(route.pattern).toBeInstanceOf(RegExp)
        expect(route).toHaveProperty('names')
        expect(Array.isArray(route.names)).toBe(true)
        expect(route).toHaveProperty('handler')
        expect(typeof route.handler).toBe('function')
      }
    })
  })

  describe('GET /api/plans', () => {
    it('returns paginated response with service_type_name', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 3 })
      all.mockResolvedValueOnce({
        results: [
          { id: 1, date: '2026-06-15', service_type_name: 'Sunday Morning', items_count: 5, people_count: 8 },
          { id: 2, date: '2026-06-22', service_type_name: 'Sunday Morning', items_count: 4, people_count: 6 },
        ],
      })
      const route = plansRoutes.find(r => r.method === 'GET' && !r.names.length)!
      const url = new URL('http://localhost/api/plans')
      const response = await route.handler(
        new Request('http://localhost/api/plans'),
        { DB },
        {},
        url,
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('page', 1)
      expect(body).toHaveProperty('totalCount', 3)
      expect(body.data).toHaveLength(2)
      expect(body.data[0].service_type_name).toBe('Sunday Morning')
    })

    it('filters by month and year', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 1 })
      all.mockResolvedValueOnce({ results: [{ id: 1, date: '2026-06-15' }] })
      const route = plansRoutes.find(r => r.method === 'GET' && !r.names.length)!
      const url = new URL('http://localhost/api/plans?month=6&year=2026')
      const response = await route.handler(
        new Request('http://localhost/api/plans?month=6&year=2026'),
        { DB },
        {},
        url,
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.data).toHaveLength(1)
    })

    it('filters by year only', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 2 })
      all.mockResolvedValueOnce({ results: [{ id: 1, date: '2026-01-01' }, { id: 2, date: '2026-06-15' }] })
      const route = plansRoutes.find(r => r.method === 'GET' && !r.names.length)!
      const url = new URL('http://localhost/api/plans?year=2026')
      const response = await route.handler(
        new Request('http://localhost/api/plans?year=2026'),
        { DB },
        {},
        url,
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.totalCount).toBe(2)
    })
  })

  describe('GET /api/plans/:id', () => {
    it('returns plan by id with service_type_name', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, date: '2026-06-15', service_type_name: 'Sunday Morning', theme: 'Love' })
      const route = plansRoutes.find(r => r.method === 'GET' && r.names.length === 1 && r.pattern.test('/api/plans/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/1'),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.id).toBe(1)
      expect(body.service_type_name).toBe('Sunday Morning')
      expect(body.theme).toBe('Love')
    })

    it('returns 400 for invalid id', async () => {
      const { DB } = createMockDb()
      const route = plansRoutes.find(r => r.method === 'GET' && r.names.length === 1 && r.pattern.test('/api/plans/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/abc'),
        { DB },
        { id: 'abc' },
      )
      expect(response.status).toBe(400)
    })

    it('returns 404 when plan not found', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = plansRoutes.find(r => r.method === 'GET' && r.names.length === 1 && r.pattern.test('/api/plans/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/999'),
        { DB },
        { id: '999' },
      )
      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/plans', () => {
    it('creates a plan and returns 201', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 5 } })
      first.mockResolvedValueOnce({ id: 5, date: '2026-06-15', service_type_id: 1, service_type_name: 'Sunday Morning' })
      const route = plansRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plans'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: '2026-06-15', service_type_id: 1 }),
        }),
        { DB },
      )
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.id).toBe(5)
      expect(body.date).toBe('2026-06-15')
      expect(body.service_type_name).toBe('Sunday Morning')
    })

    it('returns 403 without schedule permission', async () => {
      mockedHasPermission.mockResolvedValue(false)
      const { DB } = createMockDb()
      const route = plansRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plans'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: '2026-06-15' }),
        }),
        { DB },
      )
      expect(response.status).toBe(403)
    })

    it('returns 400 for missing date', async () => {
      const { DB } = createMockDb()
      const route = plansRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plans'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
    })
  })
})
