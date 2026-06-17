import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { attendanceRoutes } from '../../src/routes/attendances.js'

vi.mock('../../src/auth.js', () => ({
  hasPermission: vi.fn(),
  getMemberFromRequest: vi.fn(),
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

describe('attendanceRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
    mockedGetMemberFromRequest.mockResolvedValue({ id: 1, role: 'admin' })
  })

  it('exports an array of routes', () => {
    expect(Array.isArray(attendanceRoutes)).toBe(true)
    expect(attendanceRoutes.length).toBeGreaterThan(0)
  })

  describe('GET /api/attendances', () => {
    it('returns paginated attendances', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 1 })
      all.mockResolvedValueOnce({ results: [{ id: 1, plan_id: 1, member_id: 5 }] })
      const route = attendanceRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/attendances'))!
      const response = await route.handler(
        new Request('http://localhost/api/attendances?page=1&size=10'),
        { DB },
        {},
        new URL('http://localhost/api/attendances?page=1&size=10'),
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.data).toHaveLength(1)
    })
  })

  describe('POST /api/attendances', () => {
    it('checks in a member', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce(null)
      run.mockResolvedValueOnce({ meta: { last_row_id: 1 } })
      first.mockResolvedValueOnce({ id: 1, member_id: 5, first_name: 'John' })
      const route = attendanceRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/attendances'))!
      const response = await route.handler(
        new Request('http://localhost/api/attendances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: 1, member_id: 5 }),
        }),
        { DB },
      )
      expect(response.status).toBe(201)
    })

    it('returns 400 for duplicate check-in', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({ id: 99 })
      const route = attendanceRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/attendances'))!
      const response = await route.handler(
        new Request('http://localhost/api/attendances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: 1, member_id: 5 }),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/attendances/:id', () => {
    it('returns a single attendance', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, plan_id: 1, member_id: 5 })
      const route = attendanceRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/attendances/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/attendances/1'),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
    })
  })
})
