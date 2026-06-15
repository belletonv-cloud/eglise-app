import { describe, it, expect, vi, beforeEach } from 'vitest'
import { messagesRoutes } from '../../src/routes/messages.js'

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

describe('messagesRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
    mockedGetMemberFromRequest.mockResolvedValue({ id: 1, role: 'admin' })
  })

  it('exports an array with 4 routes', () => {
    expect(Array.isArray(messagesRoutes)).toBe(true)
    expect(messagesRoutes).toHaveLength(4)
  })

  describe('POST /api/messages', () => {
    it('creates a message', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 1 } })
      run.mockResolvedValueOnce({})
      run.mockResolvedValueOnce({})
      first.mockResolvedValueOnce({ id: 1, subject: 'Test', content: 'Hello', sender_id: 1 })
      const route = messagesRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/messages'))!
      const response = await route.handler(
        new Request('http://localhost/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Hello', recipients: [2] }),
        }),
        { DB },
      )
      expect(response.status).toBe(201)
    })

    it('returns 400 for missing content', async () => {
      const { DB } = createMockDb()
      const route = messagesRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/messages'))!
      const response = await route.handler(
        new Request('http://localhost/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
    })

    it('returns 401 when not authenticated', async () => {
      mockedGetMemberFromRequest.mockResolvedValueOnce(null)
      const { DB } = createMockDb()
      const route = messagesRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/messages'))!
      const response = await route.handler(
        new Request('http://localhost/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Hi' }),
        }),
        { DB },
      )
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/messages/inbox', () => {
    it('returns paginated inbox', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 1 })
      all.mockResolvedValueOnce({ results: [{ id: 1, subject: 'Test', content: 'Hello' }] })
      const route = messagesRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/messages/inbox'))!
      const response = await route.handler(
        new Request('http://localhost/api/messages/inbox'),
        { DB },
        {},
        new URL('http://localhost/api/messages/inbox'),
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.data).toHaveLength(1)
    })
  })

  describe('GET /api/messages/:id', () => {
    it('returns a message by id', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, sender_id: 1, subject: 'Test' })
      all.mockResolvedValueOnce({ results: [{ recipient_id: 1, read_at: null }] })
      const route = messagesRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/messages/1') && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/messages/1'),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
    })

    it('returns 403 when not a recipient', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = messagesRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/messages/1') && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/messages/1'),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/messages/:id/read', () => {
    it('marks message as read', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValue({})
      const route = messagesRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/messages/1/read'))!
      const response = await route.handler(
        new Request('http://localhost/api/messages/1/read', { method: 'POST' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
    })
  })
})
