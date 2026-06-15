import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pollsRoutes } from '../../src/routes/polls.js'

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

describe('pollsRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
    mockedGetMemberFromRequest.mockResolvedValue({ id: 1, first_name: 'Test', role: 'admin' })
  })

  describe('route metadata', () => {
    it('exports an array with 7 routes', () => {
      expect(Array.isArray(pollsRoutes)).toBe(true)
      expect(pollsRoutes).toHaveLength(7)
    })

    it('each route has method, pattern, names, and handler', () => {
      for (const route of pollsRoutes) {
        expect(route).toHaveProperty('method')
        expect(route).toHaveProperty('pattern')
        expect(route.pattern).toBeInstanceOf(RegExp)
        expect(route).toHaveProperty('names')
        expect(route).toHaveProperty('handler')
        expect(typeof route.handler).toBe('function')
      }
    })
  })

  describe('GET /api/polls', () => {
    it('returns paginated polls with options and my_votes', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 1 })
      all.mockResolvedValueOnce({ results: [{ id: 1, question: 'Best song?', max_votes: 1 }] })
      all.mockResolvedValueOnce({ results: [{ id: 10, poll_id: 1, label: 'Amazing Grace', position: 1 }] })
      all.mockResolvedValueOnce({ results: [{ poll_option_id: 10 }] })
      const route = pollsRoutes.find(r => r.method === 'GET')!
      const response = await route.handler(
        new Request('http://localhost/api/polls'),
        { DB },
        {},
        new URL('http://localhost/api/polls'),
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty('data')
      expect(body.data).toHaveLength(1)
      expect(body.data[0].options).toHaveLength(1)
      expect(body.data[0].my_votes).toEqual([10])
    })

    it('returns empty my_votes when member not found', async () => {
      mockedGetMemberFromRequest.mockResolvedValue(null)
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 0 })
      all.mockResolvedValueOnce({ results: [] })
      const route = pollsRoutes.find(r => r.method === 'GET')!
      const response = await route.handler(
        new Request('http://localhost/api/polls'),
        { DB },
        {},
        new URL('http://localhost/api/polls'),
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.data).toEqual([])
    })
  })

  describe('POST /api/polls', () => {
    it('creates poll and returns 201', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 1 } })
      first.mockResolvedValueOnce({ id: 1, question: 'Favorite color?', max_votes: 1 })
      const route = pollsRoutes.find(r => r.method === 'POST' && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/polls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: 'Favorite color?' }),
        }),
        { DB },
      )
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.question).toBe('Favorite color?')
    })

    it('returns 403 without edit_announcements', async () => {
      mockedHasPermission.mockResolvedValue(false)
      const { DB } = createMockDb()
      const route = pollsRoutes.find(r => r.method === 'POST' && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/polls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: 'Test?' }),
        }),
        { DB },
      )
      expect(response.status).toBe(403)
    })

    it('returns 400 for missing question', async () => {
      const { DB } = createMockDb()
      const route = pollsRoutes.find(r => r.method === 'POST' && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/polls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/polls/:id/vote', () => {
    it('records a vote and returns 201', async () => {
      const { DB, first, all, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, question: 'Test?', max_votes: 3, expires_at: null })
      all.mockResolvedValueOnce({ results: [] })
      first.mockResolvedValueOnce(null)
      run.mockResolvedValueOnce({})
      const route = pollsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/polls/1/vote'))!
      const response = await route.handler(
        new Request('http://localhost/api/polls/1/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ option_id: 10 }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.success).toBe(true)
    })

    it('returns 401 when not authenticated', async () => {
      mockedGetMemberFromRequest.mockResolvedValue(null)
      const { DB } = createMockDb()
      const route = pollsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/polls/1/vote'))!
      const response = await route.handler(
        new Request('http://localhost/api/polls/1/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ option_id: 10 }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(401)
    })

    it('returns 400 for expired poll', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, max_votes: 1, expires_at: '2020-01-01' })
      const route = pollsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/polls/1/vote'))!
      const response = await route.handler(
        new Request('http://localhost/api/polls/1/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ option_id: 10 }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(400)
    })

    it('returns 400 when max votes reached', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, max_votes: 1, expires_at: null })
      all.mockResolvedValueOnce({ results: [{ id: 1 }] })
      const route = pollsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/polls/1/vote'))!
      const response = await route.handler(
        new Request('http://localhost/api/polls/1/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ option_id: 10 }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(400)
    })

    it('returns 400 for duplicate vote', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, max_votes: 3, expires_at: null })
      all.mockResolvedValueOnce({ results: [] })
      first.mockResolvedValueOnce({ id: 99 })
      const route = pollsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/polls/1/vote'))!
      const response = await route.handler(
        new Request('http://localhost/api/polls/1/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ option_id: 10 }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(400)
    })

    it('returns 400 for missing option_id', async () => {
      const { DB } = createMockDb()
      const route = pollsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/polls/1/vote'))!
      const response = await route.handler(
        new Request('http://localhost/api/polls/1/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(400)
    })

    it('returns 404 when poll not found', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = pollsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/polls/999/vote'))!
      const response = await route.handler(
        new Request('http://localhost/api/polls/999/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ option_id: 10 }),
        }),
        { DB },
        { id: '999' },
      )
      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/polls/:id/vote', () => {
    it('removes a vote and returns success', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})
      const route = pollsRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/polls/1/vote'))!
      const response = await route.handler(
        new Request('http://localhost/api/polls/1/vote', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ option_id: 10 }),
        }),
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
      const route = pollsRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/polls/1/vote'))!
      const response = await route.handler(
        new Request('http://localhost/api/polls/1/vote', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ option_id: 10 }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/polls/:id/options', () => {
    it('creates poll option and returns 201', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ next: 1 })
      run.mockResolvedValueOnce({ meta: { last_row_id: 20 } })
      first.mockResolvedValueOnce({ id: 20, poll_id: 1, label: 'Option A', position: 1 })
      const route = pollsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/polls/1/options'))!
      const response = await route.handler(
        new Request('http://localhost/api/polls/1/options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: 'Option A' }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.id).toBe(20)
    })

    it('creates option with explicit position', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ next: 5 })
      run.mockResolvedValueOnce({ meta: { last_row_id: 21 } })
      first.mockResolvedValueOnce({ id: 21, poll_id: 1, label: 'Option B', position: 3 })
      const route = pollsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/polls/1/options'))!
      const response = await route.handler(
        new Request('http://localhost/api/polls/1/options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: 'Option B', position: 3 }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(201)
    })

    it('returns 400 for missing label', async () => {
      const { DB } = createMockDb()
      const route = pollsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/polls/1/options'))!
      const response = await route.handler(
        new Request('http://localhost/api/polls/1/options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(400)
    })

    it('returns 403 without edit_members', async () => {
      mockedHasPermission.mockResolvedValueOnce(false)
      const { DB } = createMockDb()
      const route = pollsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/polls/1/options'))!
      const response = await route.handler(
        new Request('http://localhost/api/polls/1/options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: 'Option C' }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/poll-options/:id', () => {
    it('deletes poll option and returns 204', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})
      const route = pollsRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/poll-options/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/poll-options/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(204)
    })
  })

  describe('DELETE /api/polls/:id', () => {
    it('deletes poll and returns 204', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})
      const route = pollsRoutes.find(r => r.method === 'DELETE' && !r.pattern.test('/api/poll-options/1') && r.pattern.test('/api/polls/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/polls/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(204)
    })

    it('returns 403 without permissions', async () => {
      mockedHasPermission.mockResolvedValue(false)
      const { DB } = createMockDb()
      const route = pollsRoutes.find(r => r.method === 'DELETE' && !r.pattern.test('/api/poll-options/1') && r.pattern.test('/api/polls/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/polls/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(403)
    })
  })
})
