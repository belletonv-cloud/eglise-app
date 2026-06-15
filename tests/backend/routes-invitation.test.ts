import { describe, it, expect, vi, beforeEach } from 'vitest'
import { invitationRoutes } from '../../src/routes/invitation.js'

vi.mock('../../src/auth.js', () => ({
  hasPermission: vi.fn(),
  getMemberFromRequest: vi.fn(),
}))

vi.mock('../../src/oneclick.js', () => ({
  signOneClickToken: vi.fn().mockResolvedValue('signed-token'),
}))

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

describe('invitationRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
    mockedGetMemberFromRequest.mockResolvedValue({ id: 1, role: 'admin' })
  })

  it('exports an array with 5 routes', () => {
    expect(Array.isArray(invitationRoutes)).toBe(true)
    expect(invitationRoutes).toHaveLength(5)
  })

  describe('POST /api/invitations', () => {
    it('creates an invitation and returns 201', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, first_name: 'John', email: 'john@test.com' })
      run.mockResolvedValueOnce({ meta: { last_row_id: 1 } })
      const originalFetch = global.fetch
      global.fetch = vi.fn().mockResolvedValue({ ok: true })
      try {
        const route = invitationRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/invitations'))!
        const response = await route.handler(
          new Request('http://localhost/api/invitations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'john@test.com' }),
          }),
          { DB, RESEND_API_KEY: 'key', FRONTEND_URL: 'https://app.test' },
        )
        expect(response.status).toBe(201)
      } finally {
        global.fetch = originalFetch
      }
    })

    it('returns 400 for missing email', async () => {
      const { DB } = createMockDb()
      const route = invitationRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/invitations'))!
      const response = await route.handler(
        new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
    })

    it('returns 400 for unknown email', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = invitationRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/invitations'))!
      const response = await route.handler(
        new Request('http://localhost/api/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'unknown@test.com' }),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/invitations/:token', () => {
    it('returns invitation details for valid token', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({ member_id: 1, first_name: 'John', last_name: 'Doe', email: 'john@test.com', used: 0, expires_at: '2099-01-01' })
      const route = invitationRoutes.find(r => r.method === 'GET' && r.names.includes('token'))!
      const response = await route.handler(
        new Request('http://localhost/api/invitations/valid-token'),
        { DB },
        { token: 'valid-token' },
      )
      expect(response.status).toBe(200)
    })

    it('returns 400 for used token', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({ used: 1, expires_at: '2099-01-01' })
      const route = invitationRoutes.find(r => r.method === 'GET' && r.names.includes('token'))!
      const response = await route.handler(
        new Request('http://localhost/api/invitations/used-token'),
        { DB },
        { token: 'used-token' },
      )
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/invitations/:token/redeem', () => {
    it('redeems a token with firebase_uid', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, member_id: 5, used: 0, expires_at: '2099-01-01' })
      first.mockResolvedValueOnce(null)
      run.mockResolvedValueOnce({})
      run.mockResolvedValueOnce({})
      const route = invitationRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/invitations/tok/redeem'))!
      const response = await route.handler(
        new Request('http://localhost/api/invitations/tok/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firebase_uid: 'fb-uid-123' }),
        }),
        { DB },
        { token: 'tok' },
      )
      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/me/firebase-status', () => {
    it('returns firebase link status', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({ firebase_uid: 'fb-uid' })
      const route = invitationRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/me/firebase-status'))!
      const response = await route.handler(new Request('http://localhost/api/me/firebase-status'), { DB })
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.linked).toBe(true)
    })
  })

  describe('GET /api/plans/:id/qr-checkin', () => {
    it('generates QR check-in URL', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, date: '2026-06-20' })
      const route = invitationRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/plans/1/qr-checkin'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/1/qr-checkin'),
        { DB, ONECLICK_SECRET: 'secret', FRONTEND_URL: 'https://app.test' },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.plan_id).toBe(1)
    })

    it('returns 500 without ONECLICK_SECRET', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, date: '2026-06-20' })
      const route = invitationRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/plans/1/qr-checkin'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/1/qr-checkin'),
        { DB, FRONTEND_URL: 'https://app.test' },
        { id: '1' },
      )
      expect(response.status).toBe(500)
    })
  })
})
