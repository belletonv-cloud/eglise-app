import { describe, it, expect, vi, beforeEach } from 'vitest'
import { statsRoutes } from '../../src/routes/stats.js'

vi.mock('../../src/auth.js')

import { getMemberFromRequest } from '../../src/auth.js'
const mockedGetMember = vi.mocked(getMemberFromRequest)

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind, first, all, run }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

const mockMember = { id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin' }

describe('statsRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('route metadata', () => {
    it('exports an array with 6 routes', () => {
      expect(Array.isArray(statsRoutes)).toBe(true)
      expect(statsRoutes).toHaveLength(6)
    })

    it('each route has method, pattern, names, and handler', () => {
      for (const route of statsRoutes) {
        expect(route).toHaveProperty('method')
        expect(route).toHaveProperty('pattern')
        expect(route.pattern).toBeInstanceOf(RegExp)
        expect(route).toHaveProperty('names')
        expect(route).toHaveProperty('handler')
        expect(typeof route.handler).toBe('function')
      }
    })
  })

  describe('GET /api/stats', () => {
    it('returns aggregated counts', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({ c: 50 })   // members
      first.mockResolvedValueOnce({ c: 30 })   // activeMembers
      first.mockResolvedValueOnce({ c: 10 })   // upcomingPlans
      first.mockResolvedValueOnce({ c: 25 })   // songsWithArrangements
      first.mockResolvedValueOnce({ c: 5 })    // pendingConfirmations
      first.mockResolvedValueOnce({ c: 8 })    // teams

      const route = statsRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/stats'))!
      const response = await route.handler(new Request('http://localhost/api/stats'), { DB })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.members).toBe(50)
      expect(body.activeMembers).toBe(30)
      expect(body.upcomingPlans).toBe(10)
      expect(body.songsWithArrangements).toBe(25)
      expect(body.pendingConfirmations).toBe(5)
      expect(body.teams).toBe(8)
    })
  })

  describe('POST /api/email-logs', () => {
    it('creates an email log and returns 201', async () => {
      mockedGetMember.mockResolvedValue(mockMember)
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 1 } })
      first.mockResolvedValueOnce({ id: 1, subject: 'Test', body: 'Hello', recipient_email: 'test@test.com', template_name: null })

      const route = statsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/email-logs'))!
      const response = await route.handler(
        new Request('http://localhost/api/email-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: 'Test', body: 'Hello', recipient_email: 'test@test.com' }),
        }),
        { DB },
      )

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.subject).toBe('Test')
    })

    it('returns 401 when not authenticated', async () => {
      mockedGetMember.mockResolvedValue(null)
      const { DB } = createMockDb()

      const route = statsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/email-logs'))!
      const response = await route.handler(
        new Request('http://localhost/api/email-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: 'Test', body: 'Hello', recipient_email: 'test@test.com' }),
        }),
        { DB },
      )

      expect(response.status).toBe(401)
    })

    it('returns 400 for missing required fields', async () => {
      mockedGetMember.mockResolvedValue(mockMember)
      const { DB } = createMockDb()

      const route = statsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/email-logs'))!
      const response = await route.handler(
        new Request('http://localhost/api/email-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: 'Test' }),
        }),
        { DB },
      )

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/send-email', () => {
    it('sends email via Resend and logs it', async () => {
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => JSON.stringify({ id: 'email_123' }),
      })

      try {
        const { DB, run } = createMockDb()
        run.mockResolvedValueOnce({})

        const route = statsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/send-email'))!
        const response = await route.handler(
          new Request('http://localhost/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient_email: 'test@test.com', subject: 'Hello', body: '<p>Test</p>' }),
          }),
          { DB, RESEND_API_KEY: 're_test', EMAIL_FROM: 'noreply@church.com' },
        )

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.success).toBe(true)
        expect(body.status).toBe('sent')
        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.resend.com/emails',
          expect.objectContaining({ method: 'POST' }),
        )
      } finally {
        global.fetch = originalFetch
      }
    })

    it('returns error when RESEND_API_KEY is not configured', async () => {
      const { DB } = createMockDb()

      const route = statsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/send-email'))!
      const response = await route.handler(
        new Request('http://localhost/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipient_email: 'test@test.com', subject: 'Hello', body: '<p>Test</p>' }),
        }),
        { DB },
      )

      expect(response.status).toBe(400)
    })

    it('returns 400 for missing required fields', async () => {
      const route = statsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/send-email'))!
      const response = await route.handler(
        new Request('http://localhost/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: 'No recipient' }),
        }),
        { DB: createMockDb().DB, RESEND_API_KEY: 're_test' },
      )

      expect(response.status).toBe(400)
    })

    it('handles Resend API failure', async () => {
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: () => JSON.stringify({ error: { message: 'Rate limited' } }),
      })

      try {
        const { DB, run } = createMockDb()
        run.mockResolvedValueOnce({})

        const route = statsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/send-email'))!
        const response = await route.handler(
          new Request('http://localhost/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient_email: 'test@test.com', subject: 'Hello', body: '<p>Test</p>' }),
          }),
          { DB, RESEND_API_KEY: 're_test' },
        )

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.success).toBe(false)
        expect(body.status).toBe('failed')
      } finally {
        global.fetch = originalFetch
      }
    })
  })

  describe('POST /api/oneclick', () => {
    it('processes a valid DB token and performs revert_assignment', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({
        id: 1,
        used: 0,
        payload_json: JSON.stringify({ action: 'revert_assignment', existing_scheduled_id: 42, plan_id: 10, member_id: 5, exp: Math.floor(Date.now() / 1000) + 3600 }),
      })
      run.mockResolvedValueOnce({})
      run.mockResolvedValueOnce({})

      const route = statsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/oneclick'))!
      const response = await route.handler(
        new Request('http://localhost/api/oneclick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'valid-token' }),
        }),
        { DB, ONECLICK_SECRET: 'secret' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
    })

    it('returns 400 for used token', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({
        id: 1,
        used: 1,
        payload_json: '{}',
      })

      const route = statsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/oneclick'))!
      const response = await route.handler(
        new Request('http://localhost/api/oneclick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'used-token' }),
        }),
        { DB, ONECLICK_SECRET: 'secret' },
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Token already used')
    })

    it('returns 400 for expired token', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({
        id: 2,
        used: 0,
        payload_json: JSON.stringify({ action: 'revert_assignment', existing_scheduled_id: 99, exp: Math.floor(Date.now() / 1000) - 3600 }),
      })

      const route = statsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/oneclick'))!
      const response = await route.handler(
        new Request('http://localhost/api/oneclick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'expired-token' }),
        }),
        { DB, ONECLICK_SECRET: 'secret' },
      )

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('Token expired')
    })

    it('returns 500 when ONECLICK_SECRET is not configured', async () => {
      const route = statsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/oneclick'))!
      const response = await route.handler(
        new Request('http://localhost/api/oneclick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'test' }),
        }),
        { DB: createMockDb().DB },
      )

      expect(response.status).toBe(500)
    })
  })

  describe('GET /api/communication-preferences/:memberId', () => {
    it('returns existing preferences', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, member_id: 1, receive_emails: 1, receive_sms: 0, email_types: '["newsletter"]' })

      const route = statsRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/communication-preferences/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/communication-preferences/1'),
        { DB },
        { memberId: '1' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.receive_emails).toBe(1)
      expect(body.receive_sms).toBe(0)
    })

    it('returns default preferences when none exist', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)

      const route = statsRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/communication-preferences/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/communication-preferences/1'),
        { DB },
        { memberId: '1' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.receive_emails).toBe(true)
      expect(body.receive_sms).toBe(true)
      expect(body.email_types).toBeNull()
    })

    it('returns 400 for invalid member ID', async () => {
      const route = statsRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/communication-preferences/abc'))!
      const response = await route.handler(
        new Request('http://localhost/api/communication-preferences/abc'),
        { DB: createMockDb().DB },
        { memberId: 'abc' },
      )

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/communication-preferences', () => {
    it('creates or replaces preferences', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})

      const route = statsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/communication-preferences'))!
      const response = await route.handler(
        new Request('http://localhost/api/communication-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: 1, receive_emails: true, receive_sms: false }),
        }),
        { DB },
      )

      expect(response.status).toBe(201)
    })

    it('returns 400 when member_id is missing', async () => {
      const route = statsRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/communication-preferences'))!
      const response = await route.handler(
        new Request('http://localhost/api/communication-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receive_emails: true }),
        }),
        { DB: createMockDb().DB },
      )

      expect(response.status).toBe(400)
    })
  })
})
