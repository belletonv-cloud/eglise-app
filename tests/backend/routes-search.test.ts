import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchRoutes } from '../../src/routes/search.js'

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind, first, all, run }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('searchRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('route metadata', () => {
    it('exports an array with 1 route', () => {
      expect(Array.isArray(searchRoutes)).toBe(true)
      expect(searchRoutes).toHaveLength(1)
    })

    it('has method, pattern, names, and handler', () => {
      const [route] = searchRoutes
      expect(route).toHaveProperty('method', 'GET')
      expect(route).toHaveProperty('pattern')
      expect(route.pattern).toBeInstanceOf(RegExp)
      expect(route.pattern.test('/api/search')).toBe(true)
      expect(route).toHaveProperty('names')
      expect(route).toHaveProperty('handler')
      expect(typeof route.handler).toBe('function')
    })
  })

  describe('GET /api/search', () => {
    it('returns search results across all entity types', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 1, first_name: 'John', last_name: 'Doe', type: 'member' }] })
      all.mockResolvedValueOnce({ results: [{ id: 1, title: 'Amazing Grace', author: 'John Newton', type: 'song' }] })
      all.mockResolvedValueOnce({ results: [{ id: 1, date: '2026-07-01', theme: 'Summer', type: 'plan', service_type: 'Sunday' }] })
      all.mockResolvedValueOnce({ results: [{ id: 1, name: 'Worship Team', type: 'team' }] })
      all.mockResolvedValueOnce({ results: [{ id: 1, content: 'Church picnic', type: 'announcement' }] })
      all.mockResolvedValueOnce({ results: [{ id: 1, title: 'Summer Camp', location: 'Park', type: 'church_event' }] })

      const [route] = searchRoutes
      const response = await route.handler(
        new Request('http://localhost/api/search?q=john'),
        { DB },
        {},
        new URL('http://localhost/api/search?q=john'),
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.query).toBe('john')
      expect(body.results).toHaveLength(6)
      expect(body.results[0].type).toBe('member')
      expect(body.results[1].type).toBe('song')
      expect(body.results[2].type).toBe('plan')
      expect(body.results[3].type).toBe('team')
      expect(body.results[4].type).toBe('announcement')
      expect(body.results[5].type).toBe('church_event')
    })

    it('returns empty results when query is missing', async () => {
      const [route] = searchRoutes
      const response = await route.handler(
        new Request('http://localhost/api/search'),
        { DB: createMockDb().DB },
        {},
        new URL('http://localhost/api/search'),
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.results).toEqual([])
    })

    it('returns empty results when query is too short', async () => {
      const [route] = searchRoutes
      const response = await route.handler(
        new Request('http://localhost/api/search?q=a'),
        { DB: createMockDb().DB },
        {},
        new URL('http://localhost/api/search?q=a'),
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.results).toEqual([])
    })

    it('returns empty arrays when no matches found', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [] })
      all.mockResolvedValueOnce({ results: [] })
      all.mockResolvedValueOnce({ results: [] })
      all.mockResolvedValueOnce({ results: [] })
      all.mockResolvedValueOnce({ results: [] })
      all.mockResolvedValueOnce({ results: [] })

      const [route] = searchRoutes
      const response = await route.handler(
        new Request('http://localhost/api/search?q=zzzzz'),
        { DB },
        {},
        new URL('http://localhost/api/search?q=zzzzz'),
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.results).toEqual([])
    })
  })
})
