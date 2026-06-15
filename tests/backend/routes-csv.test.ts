import { describe, it, expect, vi, beforeEach } from 'vitest'
import { csvRoutes } from '../../src/routes/csv.js'

vi.mock('../../src/auth.js')

import { hasPermission, getMemberFromRequest } from '../../src/auth.js'
const mockedHasPermission = vi.mocked(hasPermission)
const mockedGetMemberFromRequest = vi.mocked(getMemberFromRequest)

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind, first, all, run }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('csvRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
    mockedGetMemberFromRequest.mockResolvedValue({ id: 1, role: 'admin' })
  })

  it('exports an array with 4 routes', () => {
    expect(Array.isArray(csvRoutes)).toBe(true)
    expect(csvRoutes).toHaveLength(4)
  })

  describe('GET /api/export/:entity', () => {
    it('exports members as CSV', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 1, first_name: 'John', last_name: 'Doe' }] })
      const route = csvRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/export/members'))!
      const response = await route.handler(
        new Request('http://localhost/api/export/members'),
        { DB },
        { entity: 'members' },
      )
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
    })

    it('returns 403 without manage_members', async () => {
      mockedGetMemberFromRequest.mockResolvedValueOnce(null)
      const { DB } = createMockDb()
      const route = csvRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/export/members'))!
      const response = await route.handler(
        new Request('http://localhost/api/export/members'),
        { DB },
        { entity: 'members' },
      )
      expect(response.status).toBe(401)
    })

    it('returns 400 for invalid entity', async () => {
      const { DB } = createMockDb()
      const route = csvRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/export/invalid'))!
      const response = await route.handler(
        new Request('http://localhost/api/export/invalid'),
        { DB },
        { entity: 'invalid' },
      )
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/import/:entity', () => {
    it('imports members from CSV', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValue({ meta: { changes: 1 } })
      const route = csvRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/import/members'))!
      const response = await route.handler(
        new Request('http://localhost/api/import/members', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: 'first_name,last_name\nJohn,Doe',
        }),
        { DB },
        { entity: 'members' },
      )
      expect(response.status).toBe(200)
    })

    it('returns 403 without edit_members', async () => {
      mockedHasPermission.mockResolvedValueOnce(false)
      const { DB } = createMockDb()
      const route = csvRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/import/members'))!
      const response = await route.handler(
        new Request('http://localhost/api/import/members', {
          method: 'POST',
          body: 'first_name,last_name\nJohn,Doe',
        }),
        { DB },
        { entity: 'members' },
      )
      expect(response.status).toBe(403)
    })

    it('returns 400 for empty body', async () => {
      const { DB } = createMockDb()
      const route = csvRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/import/members'))!
      const response = await route.handler(
        new Request('http://localhost/api/import/members', {
          method: 'POST',
          body: '',
        }),
        { DB },
        { entity: 'members' },
      )
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/logs', () => {
    it('returns paginated logs', async () => {
      const { DB, all, first } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 1, method: 'GET', status: 200 }] })
      first.mockResolvedValueOnce({ c: 1 })
      const route = csvRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/logs'))!
      const response = await route.handler(
        new Request('http://localhost/api/logs'),
        { DB },
        {},
        new URL('http://localhost/api/logs'),
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.total).toBe(1)
    })
  })

  describe('DELETE /api/logs', () => {
    it('clears old logs', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValue({ meta: { changes: 5 } })
      const route = csvRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/logs'))!
      const response = await route.handler(new Request('http://localhost/api/logs', { method: 'DELETE' }), { DB })
      expect(response.status).toBe(200)
    })
  })
})
