import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eventsRoutes } from '../../src/routes/events.js'

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind, first, all, run }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('eventsRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('route metadata', () => {
    it('exports an array with 8 routes', () => {
      expect(Array.isArray(eventsRoutes)).toBe(true)
      expect(eventsRoutes).toHaveLength(8)
    })

    it('each route has method, pattern, names, and handler', () => {
      for (const route of eventsRoutes) {
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

  describe('GET /api/church-events', () => {
    it('returns flat list when no page/size', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 3 })
      all.mockResolvedValueOnce({ results: [{ id: 1, title: 'Event A' }, { id: 2, title: 'Event B' }] })
      const route = eventsRoutes.find(r => r.method === 'GET' && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/church-events'),
        { DB },
        {},
        new URL('http://localhost/api/church-events'),
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(2)
    })

    it('returns paginated response with page/size', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 3 })
      all.mockResolvedValueOnce({ results: [{ id: 1, title: 'Event' }] })
      const route = eventsRoutes.find(r => r.method === 'GET' && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/church-events?page=2&size=10'),
        { DB },
        {},
        new URL('http://localhost/api/church-events?page=2&size=10'),
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveLength(1)
    })

    it('filters by source and date range', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 1 })
      all.mockResolvedValueOnce({ results: [{ id: 1, title: 'Filtered', source: 'calendly' }] })
      const route = eventsRoutes.find(r => r.method === 'GET' && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/church-events?source=calendly&from=2026-01-01&to=2026-12-31'),
        { DB },
        {},
        new URL('http://localhost/api/church-events?source=calendly&from=2026-01-01&to=2026-12-31'),
      )
      expect(response.status).toBe(200)
    })

    it('includes exceptions when include_exceptions=1', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 2 })
      all.mockResolvedValueOnce({ results: [{ id: 1, title: 'With Exceptions' }, { id: 2, title: 'Other' }] })
      all.mockResolvedValueOnce({ results: [{ id: 10, event_id: 1, exception_date: '2026-06-15', type: 'cancelled' }] })
      const route = eventsRoutes.find(r => r.method === 'GET' && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/church-events?include_exceptions=1'),
        { DB },
        {},
        new URL('http://localhost/api/church-events?include_exceptions=1'),
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveLength(2)
      expect(body[0].exceptions).toHaveLength(1)
      expect(body[1].exceptions).toHaveLength(0)
    })

    it('caps size at 100', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 0 })
      all.mockResolvedValueOnce({ results: [] })
      const route = eventsRoutes.find(r => r.method === 'GET' && r.names.length === 0)!
      await route.handler(
        new Request('http://localhost/api/church-events?size=500'),
        { DB },
        {},
        new URL('http://localhost/api/church-events?size=500'),
      )
      const prepareCalls = DB.prepare.mock.calls
      const dataQuery = prepareCalls.find(c => c[0].includes('LIMIT ? OFFSET ?'))
      expect(dataQuery).toBeDefined()
    })
  })

  describe('POST /api/church-events', () => {
    it('creates event and returns 201', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 42 } })
      first.mockResolvedValueOnce({ id: 42, title: 'Concert', start_date: '2026-07-01' })
      const route = eventsRoutes.find(r => r.method === 'POST' && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/church-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Concert', start_date: '2026-07-01' }),
        }),
        { DB },
      )
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.id).toBe(42)
      expect(body.title).toBe('Concert')
    })

    it('returns 400 for missing title', async () => {
      const { DB } = createMockDb()
      const route = eventsRoutes.find(r => r.method === 'POST' && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/church-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start_date: '2026-07-01' }),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
    })

    it('returns 400 for missing start_date', async () => {
      const { DB } = createMockDb()
      const route = eventsRoutes.find(r => r.method === 'POST' && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/church-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Event' }),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/church-events/:id', () => {
    it('returns event with exceptions', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, title: 'Sunday Service', start_date: '2026-06-21' })
      all.mockResolvedValueOnce({ results: [{ id: 10, event_id: 1, exception_date: '2026-06-28', type: 'cancelled' }] })
      const route = eventsRoutes.find(r => r.method === 'GET' && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/church-events/1'),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.id).toBe(1)
      expect(body.exceptions).toHaveLength(1)
    })

    it('returns 400 for invalid id', async () => {
      const { DB } = createMockDb()
      const route = eventsRoutes.find(r => r.method === 'GET' && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/church-events/0'),
        { DB },
        { id: '0' },
      )
      expect(response.status).toBe(400)
    })

    it('returns 404 when event not found', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = eventsRoutes.find(r => r.method === 'GET' && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/church-events/999'),
        { DB },
        { id: '999' },
      )
      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/church-events/:id', () => {
    it('updates event fields and returns updated', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({})
      first.mockResolvedValueOnce({ id: 1, title: 'Updated', status: 'cancelled', start_date: '2026-07-01' })
      const route = eventsRoutes.find(r => r.method === 'PUT')!
      const response = await route.handler(
        new Request('http://localhost/api/church-events/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Updated', status: 'cancelled' }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.title).toBe('Updated')
      expect(body.status).toBe('cancelled')
    })

    it('returns 400 for no fields to update', async () => {
      const { DB } = createMockDb()
      const route = eventsRoutes.find(r => r.method === 'PUT')!
      const response = await route.handler(
        new Request('http://localhost/api/church-events/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/church-events/:id', () => {
    it('deletes event and returns 204', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValue({})
      const route = eventsRoutes.find(r => r.method === 'DELETE' && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/church-events/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(204)
    })

    it('returns 400 for invalid id', async () => {
      const { DB } = createMockDb()
      const route = eventsRoutes.find(r => r.method === 'DELETE' && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/church-events/0', { method: 'DELETE' }),
        { DB },
        { id: '0' },
      )
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/church-events/:id/exceptions', () => {
    it('returns exceptions for event', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 10, event_id: 1, exception_date: '2026-06-28', type: 'cancelled' }] })
      const route = eventsRoutes.find(r => r.method === 'GET' && r.names.includes('id') && r.pattern.test('/api/church-events/1/exceptions'))!
      const response = await route.handler(
        new Request('http://localhost/api/church-events/1/exceptions'),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveLength(1)
    })
  })

  describe('POST /api/church-events/:id/exceptions', () => {
    it('creates an exception and returns success', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})
      const route = eventsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/church-events/1/exceptions'))!
      const response = await route.handler(
        new Request('http://localhost/api/church-events/1/exceptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'cancelled', exception_date: '2026-06-28' }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
    })

    it('returns 400 for missing type', async () => {
      const { DB } = createMockDb()
      const route = eventsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/church-events/1/exceptions'))!
      const response = await route.handler(
        new Request('http://localhost/api/church-events/1/exceptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/church-events/:id/exceptions/:eid', () => {
    it('deletes an exception and returns success', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})
      const route = eventsRoutes.find(r => r.method === 'DELETE' && r.names.length === 2)!
      const response = await route.handler(
        new Request('http://localhost/api/church-events/1/exceptions/5', { method: 'DELETE' }),
        { DB },
        { id: '1', eid: '5' },
      )
      expect(response.status).toBe(200)
    })
  })
})
