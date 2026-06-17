import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { scheduledPeopleRoutes } from '../../src/routes/scheduledPeople.js'

vi.mock('../../src/auth.js', () => ({
  hasPermission: vi.fn(),
  getMemberFromRequest: vi.fn(),
  requirePermission: vi.fn(),
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

describe('scheduledPeopleRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
    mockedGetMemberFromRequest.mockResolvedValue({ id: 1, role: 'admin' })
    globalThis.triggerWebhooks = vi.fn().mockReturnValue(Promise.resolve())
  })

  afterEach(() => {
    delete globalThis.triggerWebhooks
  })

  it('exports an array of routes', () => {
    expect(Array.isArray(scheduledPeopleRoutes)).toBe(true)
    expect(scheduledPeopleRoutes.length).toBeGreaterThan(0)
  })

  describe('GET /api/plans/:id/scheduled-people', () => {
    it('returns scheduled people for a plan', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ id: 1 })
      all.mockResolvedValueOnce({ results: [{ id: 1, member_id: 5, first_name: 'John' }] })
      const route = scheduledPeopleRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/plans/1/scheduled-people'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/1/scheduled-people'),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveLength(1)
    })

    it('returns 404 for non-existent plan', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = scheduledPeopleRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/plans/999/scheduled-people'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/999/scheduled-people'),
        { DB },
        { id: '999' },
      )
      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/plans/:id/scheduled-people', () => {
    it('schedules a member to a plan', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, date: '2026-06-20' })
      first.mockResolvedValueOnce(null)
      first.mockResolvedValueOnce(null)
      run.mockResolvedValueOnce({ meta: { last_row_id: 1 } })
      first.mockResolvedValueOnce({ id: 1, member_id: 5, first_name: 'John' })
      const route = scheduledPeopleRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plans/1/scheduled-people'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/1/scheduled-people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: 5, team_id: 2, service_type_id: 1, position: 'guitar' }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(201)
    })
  })

  describe('DELETE /api/plans/:pid/scheduled-people/:sid', () => {
    it('removes a scheduled person', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValue({})
      const route = scheduledPeopleRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/plans/1/scheduled-people/2'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/1/scheduled-people/2', { method: 'DELETE' }),
        { DB },
        { pid: '1', sid: '2' },
      )
      expect(response.status).toBe(204)
    })
  })

  // Attendance tests moved to routes-attendances.test.ts
})
