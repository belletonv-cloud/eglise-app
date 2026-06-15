import { describe, it, expect, vi, beforeEach } from 'vitest'
import { membersRoutes } from '../../src/routes/members.js'

vi.mock('../../src/auth.js')

vi.mock('../../src/webhooks.js', () => ({
  triggerWebhooks: vi.fn(() => Promise.resolve()),
}))

import { hasPermission, getMemberFromRequest } from '../../src/auth.js'
const mockedHasPermission = vi.mocked(hasPermission)
const mockedGetMemberFromRequest = vi.mocked(getMemberFromRequest)

const mockCaller = { id: 1, role: 'admin', first_name: 'Admin', last_name: 'User', email: 'admin@test.com' }

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('membersRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
    mockedGetMemberFromRequest.mockResolvedValue(mockCaller)
  })

  describe('route metadata', () => {
    it('exports an array with 8 routes', () => {
      expect(Array.isArray(membersRoutes)).toBe(true)
      expect(membersRoutes).toHaveLength(8)
    })

    it('each route has method, pattern, names, and handler', () => {
      for (const route of membersRoutes) {
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

  describe('GET /api/members', () => {
    it('returns paginated response with teams attached', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 1 })
      all.mockResolvedValueOnce({ results: [{ id: 1, first_name: 'Jane', last_name: 'Doe' }] })
      all.mockResolvedValueOnce({ results: [{ member_id: 1, team_id: 5, team_name: 'Worship', team_description: null, position: 'Lead' }] })
      const route = membersRoutes.find(r => r.method === 'GET' && !r.names.length)!
      const url = new URL('http://localhost/api/members')
      const response = await route.handler(
        new Request('http://localhost/api/members'),
        { DB },
        {},
        url,
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('page', 1)
      expect(body).toHaveProperty('totalCount', 1)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].teams).toHaveLength(1)
      expect(body.data[0].teams[0].name).toBe('Worship')
    })

    it('returns 401 when not authenticated', async () => {
      mockedGetMemberFromRequest.mockResolvedValue(null)
      const { DB } = createMockDb()
      const route = membersRoutes.find(r => r.method === 'GET' && !r.names.length)!
      const url = new URL('http://localhost/api/members')
      const response = await route.handler(
        new Request('http://localhost/api/members'),
        { DB },
        {},
        url,
      )
      expect(response.status).toBe(401)
    })

    it('strips sensitive fields for non-admin callers', async () => {
      const caller = { id: 2, role: 'member', first_name: 'Regular', last_name: 'User', email: 'member@test.com' }
      mockedGetMemberFromRequest.mockResolvedValue(caller)
      mockedHasPermission.mockResolvedValue(false)
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 1 })
      all.mockResolvedValueOnce({ results: [{ id: 1, first_name: 'Jane', last_name: 'Doe', birth_date: '1990-01-01', notes: 'secret', pco_id: '123' }] })
      all.mockResolvedValueOnce({ results: [] })
      const route = membersRoutes.find(r => r.method === 'GET' && !r.names.length)!
      const url = new URL('http://localhost/api/members')
      const response = await route.handler(
        new Request('http://localhost/api/members'),
        { DB },
        {},
        url,
      )
      const body = await response.json()
      expect(body.data[0].birth_date).toBeUndefined()
      expect(body.data[0].notes).toBeUndefined()
      expect(body.data[0].pco_id).toBeUndefined()
      expect(body.data[0].first_name).toBe('Jane')
    })

    it('filters by search query', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 1 })
      all.mockResolvedValueOnce({ results: [{ id: 1, first_name: 'John', last_name: 'Doe' }] })
      all.mockResolvedValueOnce({ results: [] })
      const route = membersRoutes.find(r => r.method === 'GET' && !r.names.length)!
      const url = new URL('http://localhost/api/members?q=John')
      const response = await route.handler(
        new Request('http://localhost/api/members?q=John'),
        { DB },
        {},
        url,
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.data[0].first_name).toBe('John')
    })

    it('filters by teamId', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 1 })
      all.mockResolvedValueOnce({ results: [{ id: 1, first_name: 'Team', last_name: 'Member' }] })
      all.mockResolvedValueOnce({ results: [{ member_id: 1, team_id: 3, name: 'Tech', position: null }] })
      const route = membersRoutes.find(r => r.method === 'GET' && !r.names.length)!
      const url = new URL('http://localhost/api/members?teamId=3')
      const response = await route.handler(
        new Request('http://localhost/api/members?teamId=3'),
        { DB },
        {},
        url,
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.data[0].teams[0].id).toBe(3)
    })
  })

  describe('GET /api/members/:id', () => {
    it('returns member by id with teams', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, first_name: 'Jane', last_name: 'Doe' })
      all.mockResolvedValueOnce({ results: [{ id: 5, name: 'Worship', position: 'Lead' }] })
      const route = membersRoutes.find(r => r.method === 'GET' && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/members/1'),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.first_name).toBe('Jane')
      expect(body.teams).toHaveLength(1)
      expect(body.teams[0].name).toBe('Worship')
    })

    it('returns 401 when not authenticated', async () => {
      mockedGetMemberFromRequest.mockResolvedValue(null)
      const { DB } = createMockDb()
      const route = membersRoutes.find(r => r.method === 'GET' && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/members/1'),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(401)
    })

    it('returns 404 when member not found', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = membersRoutes.find(r => r.method === 'GET' && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/members/999'),
        { DB },
        { id: '999' },
      )
      expect(response.status).toBe(404)
    })

    it('strips sensitive fields for non-admin viewing other member', async () => {
      const caller = { id: 2, role: 'member', first_name: 'Regular', last_name: 'User', email: 'member@test.com' }
      mockedGetMemberFromRequest.mockResolvedValue(caller)
      mockedHasPermission.mockResolvedValue(false)
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, first_name: 'Jane', last_name: 'Doe', birth_date: '1990-01-01', notes: 'private' })
      all.mockResolvedValueOnce({ results: [] })
      const route = membersRoutes.find(r => r.method === 'GET' && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/members/1'),
        { DB },
        { id: '1' },
      )
      const body = await response.json()
      expect(body.birth_date).toBeUndefined()
      expect(body.notes).toBeUndefined()
      expect(body.first_name).toBe('Jane')
    })
  })

  describe('POST /api/members', () => {
    it('creates a member and returns 201', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 10 } })
      first.mockResolvedValueOnce({ id: 10, first_name: 'New', last_name: 'Member', email: null })
      const route = membersRoutes.find(r => r.method === 'POST')!
      const response = await route.handler(
        new Request('http://localhost/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ first_name: 'New', last_name: 'Member' }),
        }),
        { DB },
      )
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.id).toBe(10)
      expect(body.first_name).toBe('New')
      expect(body.last_name).toBe('Member')
    })

    it('returns 403 without edit_members permission', async () => {
      mockedHasPermission.mockResolvedValue(false)
      const { DB } = createMockDb()
      const route = membersRoutes.find(r => r.method === 'POST')!
      const response = await route.handler(
        new Request('http://localhost/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ first_name: 'Test', last_name: 'User' }),
        }),
        { DB },
      )
      expect(response.status).toBe(403)
    })

    it('returns 400 for missing required fields', async () => {
      const { DB } = createMockDb()
      const route = membersRoutes.find(r => r.method === 'POST')!
      const response = await route.handler(
        new Request('http://localhost/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBeTruthy()
    })
  })
})
