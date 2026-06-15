import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fcmRoutes } from '../../src/routes/fcm.js'

vi.mock('../../src/auth.js')
vi.mock('../../src/fcm.js', () => ({
  sendFcmV1: vi.fn(),
}))

import { hasPermission, getMemberFromRequest, requirePermission } from '../../src/auth.js'
import { sendFcmV1 } from '../../src/fcm.js'
const mockedHasPermission = vi.mocked(hasPermission)
const mockedGetMemberFromRequest = vi.mocked(getMemberFromRequest)
const mockedRequirePermission = vi.mocked(requirePermission)
const mockedSendFcmV1 = vi.mocked(sendFcmV1)

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind, first, all, run }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('fcmRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
    mockedGetMemberFromRequest.mockResolvedValue({ id: 5, first_name: 'Test', role: 'admin' })
    mockedRequirePermission.mockResolvedValue(null)
    mockedSendFcmV1.mockResolvedValue({ sent: 1, failed: 0, errors: [] })
  })

  describe('route metadata', () => {
    it('exports an array with 2 routes', () => {
      expect(Array.isArray(fcmRoutes)).toBe(true)
      expect(fcmRoutes).toHaveLength(2)
    })
  })

  describe('POST /api/fcm/register', () => {
    it('registers a push token', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})
      const route = fcmRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/fcm/register'))!
      const response = await route.handler(
        new Request('http://localhost/api/fcm/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: 5, token: 'fcm-token-abc123', device_type: 'web' }),
        }),
        { DB },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
    })

    it('returns 400 for missing member_id', async () => {
      const { DB } = createMockDb()
      const route = fcmRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/fcm/register'))!
      const response = await route.handler(
        new Request('http://localhost/api/fcm/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: 'abc' }),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
    })

    it('returns 400 for missing token', async () => {
      const { DB } = createMockDb()
      const route = fcmRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/fcm/register'))!
      const response = await route.handler(
        new Request('http://localhost/api/fcm/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: 5 }),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
    })

    it('returns 401 when not authenticated', async () => {
      mockedGetMemberFromRequest.mockResolvedValueOnce(null)
      const { DB } = createMockDb()
      const route = fcmRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/fcm/register'))!
      const response = await route.handler(
        new Request('http://localhost/api/fcm/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: 5, token: 'abc' }),
        }),
        { DB },
      )
      expect(response.status).toBe(403)
    })

    it('returns 401 when registering for another member without admin', async () => {
      mockedGetMemberFromRequest.mockResolvedValueOnce({ id: 2, role: 'member' })
      const { DB } = createMockDb()
      const route = fcmRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/fcm/register'))!
      const response = await route.handler(
        new Request('http://localhost/api/fcm/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: 5, token: 'abc' }),
        }),
        { DB },
      )
      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/fcm/send', () => {
    it('sends notification to a member', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ token: 'tok1' }, { token: 'tok2' }] })

      const route = fcmRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/fcm/send'))!
      const response = await route.handler(
        new Request('http://localhost/api/fcm/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: 5, title: 'Test', message: 'Hello!' }),
        }),
        { DB, FCM_SERVICE_ACCOUNT: JSON.stringify({ project_id: 'test-proj', client_email: 'test@test.com', private_key: 'fake\nkey\n' }) },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.sent).toBe(1)
    })

    it('sends notification to plan members', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ token: 'plan-tok' }] })

      const route = fcmRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/fcm/send'))!
      const response = await route.handler(
        new Request('http://localhost/api/fcm/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: 3, title: 'Rehearsal', message: 'Tonight' }),
        }),
        { DB, FCM_SERVICE_ACCOUNT: JSON.stringify({ project_id: 'test-proj', client_email: 'a@b.com', private_key: 'fake\nkey\n' }) },
      )
      expect(response.status).toBe(200)
    })

    it('sends notification to explicit tokens', async () => {
      const { DB } = createMockDb()

      const route = fcmRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/fcm/send'))!
      const response = await route.handler(
        new Request('http://localhost/api/fcm/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokens: ['tok-explicit'], title: 'Alert', message: 'Go!' }),
        }),
        { DB, FCM_SERVICE_ACCOUNT: JSON.stringify({ project_id: 'test-proj', client_email: 'a@b.com', private_key: 'fake\nkey\n' }) },
      )
      expect(response.status).toBe(200)
    })

    it('returns early with 0 sent when no tokens found', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [] })

      const route = fcmRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/fcm/send'))!
      const response = await route.handler(
        new Request('http://localhost/api/fcm/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: 999, title: 'Nope', message: 'Nobody' }),
        }),
        { DB, FCM_SERVICE_ACCOUNT: JSON.stringify({ project_id: 'test-proj', client_email: 'a@b.com', private_key: 'fake\nkey\n' }) },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.sent).toBe(0)
    })

    it('returns 403 without manage_members permission', async () => {
      mockedRequirePermission.mockResolvedValueOnce({ status: 403 })
      const { DB } = createMockDb()
      const route = fcmRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/fcm/send'))!
      const response = await route.handler(
        new Request('http://localhost/api/fcm/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokens: ['tok'], title: 'Test', message: 'Test' }),
        }),
        { DB, FCM_SERVICE_ACCOUNT: JSON.stringify({ project_id: 'test-proj', client_email: 'a@b.com', private_key: 'fake\nkey\n' }) },
      )
      expect(response.status).toBe(403)
    })

    it('returns 400 when FCM_SERVICE_ACCOUNT not configured', async () => {
      const { DB } = createMockDb()
      const route = fcmRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/fcm/send'))!
      const response = await route.handler(
        new Request('http://localhost/api/fcm/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokens: ['tok'], title: 'Test', message: 'Test' }),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
    })

    it('returns 400 when FCM_SERVICE_ACCOUNT is not valid JSON', async () => {
      const { DB } = createMockDb()
      const route = fcmRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/fcm/send'))!
      const response = await route.handler(
        new Request('http://localhost/api/fcm/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokens: ['tok'], title: 'Test', message: 'Test' }),
        }),
        { DB, FCM_SERVICE_ACCOUNT: 'not-json' },
      )
      expect(response.status).toBe(400)
    })
  })
})
