import { describe, it, expect, vi, beforeEach } from 'vitest'
import { annotationsRoutes } from '../../src/routes/annotations.js'

vi.mock('../../src/auth.js')
import { getMemberFromRequest } from '../../src/auth.js'
const mockedGetMemberFromRequest = vi.mocked(getMemberFromRequest)

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('annotationsRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetMemberFromRequest.mockResolvedValue({ id: 5, first_name: 'Test', last_name: 'User', role: 'member' })
  })

  describe('route metadata', () => {
    it('exports an array with 13 routes', () => {
      expect(Array.isArray(annotationsRoutes)).toBe(true)
      expect(annotationsRoutes).toHaveLength(13)
    })

    it('each route has method, pattern, names, and handler', () => {
      for (const route of annotationsRoutes) {
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

  describe('GET /api/arrangements/:id/annotations', () => {
    it('returns list of annotations for an arrangement', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({
        results: [
          { id: 1, arrangement_id: 10, member_id: 5, content: 'Great song', is_shared: 1, first_name: 'Test', last_name: 'User' },
        ],
      })
      const route = annotationsRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/arrangements/10/annotations'))!
      const response = await route.handler(
        new Request('http://localhost/api/arrangements/10/annotations'),
        { DB },
        { id: '10' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveLength(1)
      expect(body[0].content).toBe('Great song')
    })

    it('returns 401 when not authenticated', async () => {
      mockedGetMemberFromRequest.mockResolvedValue(null)
      const { DB } = createMockDb()
      const route = annotationsRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/arrangements/10/annotations'))!
      const response = await route.handler(
        new Request('http://localhost/api/arrangements/10/annotations'),
        { DB },
        { id: '10' },
      )
      expect(response.status).toBe(403)
    })

    it('returns 400 for invalid arrangement id', async () => {
      const { DB } = createMockDb()
      const route = annotationsRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/arrangements/0/annotations'))!
      const response = await route.handler(
        new Request('http://localhost/api/arrangements/0/annotations'),
        { DB },
        { id: '0' },
      )
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/arrangements/:id/annotations', () => {
    it('creates an annotation and returns 201', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 100 } })
      first.mockResolvedValueOnce({
        id: 100, arrangement_id: 10, member_id: 5, content: 'Nice chord', is_shared: 1,
        first_name: 'Test', last_name: 'User',
      })
      const route = annotationsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/arrangements/10/annotations'))!
      const response = await route.handler(
        new Request('http://localhost/api/arrangements/10/annotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Nice chord', is_shared: true }),
        }),
        { DB },
        { id: '10' },
      )
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.id).toBe(100)
      expect(body.content).toBe('Nice chord')
    })

    it('returns 401 when not authenticated', async () => {
      mockedGetMemberFromRequest.mockResolvedValue(null)
      const { DB } = createMockDb()
      const route = annotationsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/arrangements/10/annotations'))!
      const response = await route.handler(
        new Request('http://localhost/api/arrangements/10/annotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Test' }),
        }),
        { DB },
        { id: '10' },
      )
      expect(response.status).toBe(403)
    })

    it('returns 400 for missing content', async () => {
      const { DB } = createMockDb()
      const route = annotationsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/arrangements/10/annotations'))!
      const response = await route.handler(
        new Request('http://localhost/api/arrangements/10/annotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
        { id: '10' },
      )
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/annotations/:id', () => {
    it('deletes own annotation and returns success', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, member_id: 5, content: 'My note', is_shared: 0 })
      run.mockResolvedValueOnce({})
      const route = annotationsRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/annotations/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/annotations/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
    })

    it('returns 403 when deleting another member\'s annotation', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, member_id: 10, content: 'Their note', is_shared: 0 })
      const route = annotationsRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/annotations/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/annotations/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(403)
    })

    it('allows admin to delete any annotation', async () => {
      mockedGetMemberFromRequest.mockResolvedValue({ id: 5, first_name: 'Admin', last_name: 'User', role: 'admin' })
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, member_id: 10, content: 'Their note', is_shared: 0 })
      run.mockResolvedValueOnce({})
      const route = annotationsRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/annotations/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/annotations/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
    })

    it('returns 401 when not authenticated', async () => {
      mockedGetMemberFromRequest.mockResolvedValue(null)
      const { DB } = createMockDb()
      const route = annotationsRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/annotations/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/annotations/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(403)
    })

    it('returns 404 when annotation not found', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = annotationsRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/annotations/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/annotations/999', { method: 'DELETE' }),
        { DB },
        { id: '999' },
      )
      expect(response.status).toBe(404)
    })
  })
})
