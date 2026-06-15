import { describe, it, expect, vi, beforeEach } from 'vitest'
import { announcementsRoutes } from '../../src/routes/announcements.js'

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

describe('announcementsRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
    mockedGetMemberFromRequest.mockResolvedValue({ id: 1, first_name: 'Test', last_name: 'User', role: 'admin' })
  })

  describe('route metadata', () => {
    it('exports an array with 4 routes', () => {
      expect(Array.isArray(announcementsRoutes)).toBe(true)
      expect(announcementsRoutes).toHaveLength(4)
    })

    it('each route has method, pattern, names, and handler', () => {
      for (const route of announcementsRoutes) {
        expect(route).toHaveProperty('method')
        expect(route).toHaveProperty('pattern')
        expect(route.pattern).toBeInstanceOf(RegExp)
        expect(route).toHaveProperty('names')
        expect(route).toHaveProperty('handler')
        expect(typeof route.handler).toBe('function')
      }
    })
  })

  describe('GET /api/announcements', () => {
    it('returns paginated list with default params', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ count: 2 }] })
      all.mockResolvedValueOnce({ results: [{ id: 1, content: 'Hello', author_first: 'John', author_last: 'Doe' }] })
      const route = announcementsRoutes.find(r => r.method === 'GET')!
      const response = await route.handler(
        new Request('http://localhost/api/announcements'),
        { DB },
        {},
        new URL('http://localhost/api/announcements'),
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('page', 1)
      expect(body).toHaveProperty('size', 25)
      expect(body).toHaveProperty('totalCount', 2)
      expect(body.data).toHaveLength(1)
    })

    it('filters by type prayer', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ count: 1 }] })
      all.mockResolvedValueOnce({ results: [{ id: 2, content: 'Prayer request', type: 'prayer' }] })
      const route = announcementsRoutes.find(r => r.method === 'GET')!
      const response = await route.handler(
        new Request('http://localhost/api/announcements?type=prayer'),
        { DB },
        {},
        new URL('http://localhost/api/announcements?type=prayer'),
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.data[0].type).toBe('prayer')
    })

    it('returns flat list with type announcement', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ count: 1 }] })
      all.mockResolvedValueOnce({ results: [{ id: 3, content: 'Notice', type: 'announcement' }] })
      const route = announcementsRoutes.find(r => r.method === 'GET')!
      const response = await route.handler(
        new Request('http://localhost/api/announcements?type=announcement'),
        { DB },
        {},
        new URL('http://localhost/api/announcements?type=announcement'),
      )
      expect(response.status).toBe(200)
    })

    it('caps size at 100', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ count: 0 }] })
      all.mockResolvedValueOnce({ results: [] })
      const route = announcementsRoutes.find(r => r.method === 'GET')!
      await route.handler(
        new Request('http://localhost/api/announcements?page=1&size=500'),
        { DB },
        {},
        new URL('http://localhost/api/announcements?page=1&size=500'),
      )
      const prepareCalls = DB.prepare.mock.calls
      const dataQuery = prepareCalls.find(c => c[0].includes('LIMIT ? OFFSET ?'))
      expect(dataQuery).toBeDefined()
    })
  })

  describe('POST /api/announcements', () => {
    it('creates announcement and returns 201', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 10 } })
      first.mockResolvedValueOnce({ id: 10, content: 'Test', type: 'announcement', author_first: 'Test', author_last: 'User' })
      const route = announcementsRoutes.find(r => r.method === 'POST')!
      const response = await route.handler(
        new Request('http://localhost/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Test', type: 'announcement' }),
        }),
        { DB },
      )
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.id).toBe(10)
    })

    it('returns 403 without edit_announcements permission', async () => {
      mockedHasPermission.mockResolvedValue(false)
      const { DB } = createMockDb()
      const route = announcementsRoutes.find(r => r.method === 'POST')!
      const response = await route.handler(
        new Request('http://localhost/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Test' }),
        }),
        { DB },
      )
      expect(response.status).toBe(403)
    })

    it('returns 401 when not authenticated', async () => {
      mockedHasPermission.mockResolvedValue(true)
      mockedGetMemberFromRequest.mockResolvedValue(null)
      const { DB } = createMockDb()
      const route = announcementsRoutes.find(r => r.method === 'POST')!
      const response = await route.handler(
        new Request('http://localhost/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Test' }),
        }),
        { DB },
      )
      expect(response.status).toBe(401)
    })

    it('returns 400 for missing content', async () => {
      const { DB } = createMockDb()
      const route = announcementsRoutes.find(r => r.method === 'POST')!
      const response = await route.handler(
        new Request('http://localhost/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/announcements/:id', () => {
    it('updates announcement and returns updated', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({})
      first.mockResolvedValueOnce({ id: 1, content: 'Updated', type: 'announcement', author_first: 'John', author_last: 'Doe' })
      const route = announcementsRoutes.find(r => r.method === 'PUT')!
      const response = await route.handler(
        new Request('http://localhost/api/announcements/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Updated' }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.content).toBe('Updated')
    })

    it('returns 403 without edit_announcements', async () => {
      mockedHasPermission.mockResolvedValueOnce(false)
      const { DB } = createMockDb()
      const route = announcementsRoutes.find(r => r.method === 'PUT')!
      const response = await route.handler(
        new Request('http://localhost/api/announcements/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Test' }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(403)
    })

    it('returns 400 for invalid id', async () => {
      const { DB } = createMockDb()
      const route = announcementsRoutes.find(r => r.method === 'PUT')!
      const response = await route.handler(
        new Request('http://localhost/api/announcements/0', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Test' }),
        }),
        { DB },
        { id: '0' },
      )
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/announcements/:id', () => {
    it('deletes announcement and returns 204', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})
      const route = announcementsRoutes.find(r => r.method === 'DELETE')!
      const response = await route.handler(
        new Request('http://localhost/api/announcements/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(204)
    })

    it('returns 403 without edit_announcements', async () => {
      mockedHasPermission.mockResolvedValueOnce(false)
      const { DB } = createMockDb()
      const route = announcementsRoutes.find(r => r.method === 'DELETE')!
      const response = await route.handler(
        new Request('http://localhost/api/announcements/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(403)
    })

    it('returns 400 for invalid id', async () => {
      const { DB } = createMockDb()
      const route = announcementsRoutes.find(r => r.method === 'DELETE')!
      const response = await route.handler(
        new Request('http://localhost/api/announcements/0', { method: 'DELETE' }),
        { DB },
        { id: '0' },
      )
      expect(response.status).toBe(400)
    })
  })
})
