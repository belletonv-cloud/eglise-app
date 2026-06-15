import { describe, it, expect, vi, beforeEach } from 'vitest'
import { teamsRoutes } from '../../src/routes/teams.js'

vi.mock('../../src/auth.js')
import { hasPermission } from '../../src/auth.js'
const mockedHasPermission = vi.mocked(hasPermission)

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind, first, all, run }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('teamsRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
  })

  describe('route metadata', () => {
    it('exports an array with 9 routes', () => {
      expect(Array.isArray(teamsRoutes)).toBe(true)
      expect(teamsRoutes).toHaveLength(9)
    })

    it('each route has method, pattern, names, and handler', () => {
      for (const route of teamsRoutes) {
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

  describe('GET /api/teams', () => {
    it('returns paginated response with page/size params', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 5 })
      all.mockResolvedValueOnce({
        results: [
          { id: 1, name: 'Worship', member_count: 3 },
          { id: 2, name: 'Tech', member_count: 2 },
        ],
      })
      const route = teamsRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/teams'))!
      const response = await route.handler(
        new Request('http://localhost/api/teams?page=1&size=10'),
        { DB },
        {},
        new URL('http://localhost/api/teams?page=1&size=10'),
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual({
        data: [
          { id: 1, name: 'Worship', member_count: 3 },
          { id: 2, name: 'Tech', member_count: 2 },
        ],
        page: 1,
        size: 10,
        totalCount: 5,
      })
    })

    it('uses default size of 25', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 10 })
      all.mockResolvedValueOnce({ results: [] })
      const route = teamsRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/teams'))!
      await route.handler(
        new Request('http://localhost/api/teams'),
        { DB },
        {},
        new URL('http://localhost/api/teams'),
      )
      const bindCall = DB.prepare.mock.results[1].value.bind.mock.calls[0]
      expect(bindCall[0]).toBe(25)
    })

    it('caps size at 100', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 10 })
      all.mockResolvedValueOnce({ results: [] })
      const route = teamsRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/teams'))!
      await route.handler(
        new Request('http://localhost/api/teams?page=1&size=500'),
        { DB },
        {},
        new URL('http://localhost/api/teams?page=1&size=500'),
      )
      const bindCall = DB.prepare.mock.results[1].value.bind.mock.calls[0]
      expect(bindCall[0]).toBe(100)
    })
  })

  describe('GET /api/teams/:id', () => {
    it('returns team with members', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, name: 'Worship', description: 'Worship team' })
      all.mockResolvedValueOnce({
        results: [
          { id: 10, first_name: 'John', last_name: 'Doe', position: 'Leader' },
        ],
      })
      const route = teamsRoutes.find(r => r.method === 'GET' && r.names.includes('id') && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/teams/1'),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.name).toBe('Worship')
      expect(body.members).toHaveLength(1)
      expect(body.members[0].first_name).toBe('John')
    })

    it('returns 400 for invalid id', async () => {
      const { DB } = createMockDb()
      const route = teamsRoutes.find(r => r.method === 'GET' && r.names.includes('id') && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/teams/0'),
        { DB },
        { id: '0' },
      )
      expect(response.status).toBe(400)
    })

    it('returns 404 when team not found', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = teamsRoutes.find(r => r.method === 'GET' && r.names.includes('id') && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/teams/999'),
        { DB },
        { id: '999' },
      )
      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/teams', () => {
    it('creates a team and returns 201', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 42 } })
      first.mockResolvedValueOnce({ id: 42, name: 'New Team', description: 'Desc', service_type: 'worship' })
      const route = teamsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/teams'))!
      const response = await route.handler(
        new Request('http://localhost/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'New Team', description: 'Desc', service_type: 'worship' }),
        }),
        { DB },
      )
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.id).toBe(42)
      expect(body.name).toBe('New Team')
    })

    it('returns 403 without manage_members permission', async () => {
      mockedHasPermission.mockResolvedValue(false)
      const { DB } = createMockDb()
      const route = teamsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/teams'))!
      const response = await route.handler(
        new Request('http://localhost/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'New Team' }),
        }),
        { DB },
      )
      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.error).toBe('Forbidden')
    })

    it('returns 400 for missing name', async () => {
      const { DB } = createMockDb()
      const route = teamsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/teams'))!
      const response = await route.handler(
        new Request('http://localhost/api/teams', {
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
