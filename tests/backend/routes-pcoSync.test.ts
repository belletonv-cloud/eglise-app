import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pcoSyncRoutes } from '../../src/routes/pcoSync.js'

vi.mock('../../src/auth.js', () => ({
  hasPermission: vi.fn(),
  getMemberFromRequest: vi.fn(),
}))

vi.mock('../../src/pco.js', () => ({
  pcoFetch: vi.fn(),
  pcoFetchAll: vi.fn(),
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

describe('pcoSyncRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
    mockedGetMemberFromRequest.mockResolvedValue({ id: 1, role: 'admin' })
  })

  it('exports an array with 3 routes', () => {
    expect(Array.isArray(pcoSyncRoutes)).toBe(true)
    expect(pcoSyncRoutes).toHaveLength(3)
  })

  describe('POST /api/pco-sync', () => {
    it('returns 403 without manage_members permission (non-internal)', async () => {
      mockedHasPermission.mockResolvedValueOnce(false)
      const { DB } = createMockDb()
      const route = pcoSyncRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/pco-sync'))!
      const response = await route.handler(
        new Request('http://localhost/api/pco-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
      )
      expect(response.status).toBe(403)
    })

    it('returns 500 when PCO credentials not configured', async () => {
      const { DB } = createMockDb()
      const route = pcoSyncRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/pco-sync'))!
      const response = await route.handler(
        new Request('http://localhost/api/pco-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
      )
      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toContain('PCO credentials')
    })

    it('returns 200 with success when internal sync', async () => {
      const { DB, all, first, run } = createMockDb()
      first.mockResolvedValueOnce(null)
      first.mockResolvedValueOnce(null)
      first.mockResolvedValueOnce(null)
      first.mockResolvedValueOnce(null)
      first.mockResolvedValueOnce(null)
      all.mockResolvedValue({ results: [] })
      run.mockResolvedValue({ meta: { changes: 1 } })

      const originalFetch = global.fetch
      global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => ({ data: [], included: [] }) })

      try {
        const route = pcoSyncRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/pco-sync'))!
        const response = await route.handler(
          new Request('http://localhost/api/pco-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-internal-sync': '1' },
            body: JSON.stringify({}),
          }),
          { DB, PCO_TOKEN_ID: 'test-id', PCO_TOKEN_SECRET: 'test-secret' },
        )
        expect(response.status).toBe(200)
      } finally {
        global.fetch = originalFetch
      }
    })
  })

  describe('POST /api/pco-sync-people', () => {
    it('returns 403 for non-admin role', async () => {
      mockedGetMemberFromRequest.mockResolvedValueOnce({ id: 2, role: 'member' })
      const { DB } = createMockDb()
      const route = pcoSyncRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/pco-sync-people'))!
      const response = await route.handler(
        new Request('http://localhost/api/pco-sync-people', { method: 'POST' }),
        { DB, PCO_TOKEN_ID: 'id', PCO_TOKEN_SECRET: 'secret' },
      )
      expect(response.status).toBe(403)
    })

    it('returns 500 without PCO credentials', async () => {
      const { DB } = createMockDb()
      const route = pcoSyncRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/pco-sync-people'))!
      const response = await route.handler(
        new Request('http://localhost/api/pco-sync-people', { method: 'POST' }),
        { DB },
      )
      expect(response.status).toBe(500)
    })
  })

  describe('GET /api/backup', () => {
    it('returns 403 without manage_members', async () => {
      mockedHasPermission.mockResolvedValueOnce(false)
      const { DB } = createMockDb()
      const route = pcoSyncRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/backup'))!
      const response = await route.handler(new Request('http://localhost/api/backup'), { DB })
      expect(response.status).toBe(403)
    })

    it('exports a JSON backup', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValue({ results: [] })
      const route = pcoSyncRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/backup'))!
      const response = await route.handler(new Request('http://localhost/api/backup'), { DB })
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })
  })
})
