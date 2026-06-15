import { describe, it, expect, vi, beforeEach } from 'vitest'
import { emailRoutes } from '../../src/routes/email.js'

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

describe('emailRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
    mockedGetMemberFromRequest.mockResolvedValue({ id: 1, first_name: 'Test', role: 'admin' })
  })

  describe('route metadata', () => {
    it('exports an array with 1 route', () => {
      expect(Array.isArray(emailRoutes)).toBe(true)
      expect(emailRoutes).toHaveLength(1)
    })

    it('route is POST /api/send-bulk-email', () => {
      const route = emailRoutes[0]
      expect(route.method).toBe('POST')
      expect(route.pattern.test('/api/send-bulk-email')).toBe(true)
    })
  })

  describe('POST /api/send-bulk-email', () => {
    it('sends bulk email to team members', async () => {
      const { DB, all, run } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ email: 'john@test.com', member_id: 10 }, { email: 'jane@test.com', member_id: 11 }] })
      run.mockResolvedValue({})

      const originalFetch = global.fetch
      global.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => '' })

      try {
        const response = await emailRoutes[0].handler(
          new Request('http://localhost/api/send-bulk-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject: 'Hello', body: '<p>Test</p>', team_id: 5 }),
          }),
          { DB, RESEND_API_KEY: 're_abc123', EMAIL_FROM: 'church@test.com' },
        )
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.sent).toBe(2)
        expect(body.failed).toBe(0)
      } finally {
        global.fetch = originalFetch
      }
    })

    it('sends bulk email to plan members', async () => {
      const { DB, all, run } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ email: 'sara@test.com', member_id: 20 }] })
      run.mockResolvedValue({})

      const originalFetch = global.fetch
      global.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => '' })

      try {
        const response = await emailRoutes[0].handler(
          new Request('http://localhost/api/send-bulk-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject: 'Plan Update', body: '<p>Details</p>', plan_id: 3 }),
          }),
          { DB, RESEND_API_KEY: 're_abc123', EMAIL_FROM: 'church@test.com' },
        )
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.sent).toBe(1)
      } finally {
        global.fetch = originalFetch
      }
    })

    it('sends bulk email to specific member_ids', async () => {
      const { DB, all, run } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ email: 'direct@test.com', member_id: 30 }] })
      run.mockResolvedValue({})

      const originalFetch = global.fetch
      global.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => '' })

      try {
        const response = await emailRoutes[0].handler(
          new Request('http://localhost/api/send-bulk-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject: 'Personal', body: '<p>Hi</p>', member_ids: [30] }),
          }),
          { DB, RESEND_API_KEY: 're_abc123', EMAIL_FROM: 'church@test.com' },
        )
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.sent).toBe(1)
      } finally {
        global.fetch = originalFetch
      }
    })

    it('returns 400 for missing subject', async () => {
      const { DB } = createMockDb()
      const response = await emailRoutes[0].handler(
        new Request('http://localhost/api/send-bulk-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: '<p>Test</p>', team_id: 1 }),
        }),
        { DB, RESEND_API_KEY: 're_abc' },
      )
      expect(response.status).toBe(400)
    })

    it('returns 400 for missing team_id/plan_id/member_ids', async () => {
      const { DB } = createMockDb()
      const response = await emailRoutes[0].handler(
        new Request('http://localhost/api/send-bulk-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: 'Hi', body: '<p>Test</p>' }),
        }),
        { DB, RESEND_API_KEY: 're_abc' },
      )
      expect(response.status).toBe(400)
    })

    it('returns 400 when RESEND_API_KEY not configured', async () => {
      const { DB } = createMockDb()
      const response = await emailRoutes[0].handler(
        new Request('http://localhost/api/send-bulk-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: 'Hi', body: '<p>Test</p>', team_id: 1 }),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
    })

    it('returns 400 when no recipients found', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [] })
      const response = await emailRoutes[0].handler(
        new Request('http://localhost/api/send-bulk-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: 'Hi', body: '<p>Test</p>', team_id: 999 }),
        }),
        { DB, RESEND_API_KEY: 're_abc' },
      )
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('No recipients found')
    })

    it('reports failed sends', async () => {
      const { DB, all, run } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ email: 'fail@test.com', member_id: 1 }] })
      run.mockResolvedValue({})

      const originalFetch = global.fetch
      global.fetch = vi.fn().mockResolvedValue({ ok: false, text: () => 'API error' })

      try {
        const response = await emailRoutes[0].handler(
          new Request('http://localhost/api/send-bulk-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject: 'Hi', body: '<p>Test</p>', team_id: 1 }),
          }),
          { DB, RESEND_API_KEY: 're_abc' },
        )
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.sent).toBe(0)
        expect(body.failed).toBe(1)
        expect(body.errors).toHaveLength(1)
      } finally {
        global.fetch = originalFetch
      }
    })

    it('handles fetch exceptions gracefully', async () => {
      const { DB, all, run } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ email: 'err@test.com', member_id: 1 }] })
      run.mockResolvedValue({})

      const originalFetch = global.fetch
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      try {
        const response = await emailRoutes[0].handler(
          new Request('http://localhost/api/send-bulk-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject: 'Hi', body: '<p>Test</p>', team_id: 1 }),
          }),
          { DB, RESEND_API_KEY: 're_abc' },
        )
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.failed).toBe(1)
        expect(body.errors[0]).toContain('Network error')
      } finally {
        global.fetch = originalFetch
      }
    })
  })
})
