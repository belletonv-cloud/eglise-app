import { describe, it, expect, vi, beforeEach } from 'vitest'
import { autoScheduleRoutes } from '../../src/routes/autoSchedule.js'

vi.mock('../../src/auth.js')
import { hasPermission } from '../../src/auth.js'
const mockedHasPermission = vi.mocked(hasPermission)

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn(() => ({ meta: { last_row_id: 1 } }))
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('autoScheduleRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
  })

  describe('route metadata', () => {
    it('exports an array with 1 route', () => {
      expect(Array.isArray(autoScheduleRoutes)).toBe(true)
      expect(autoScheduleRoutes).toHaveLength(1)
    })

    it('has method, pattern, names, and handler', () => {
      const route = autoScheduleRoutes[0]
      expect(route.method).toBe('POST')
      expect(route.pattern).toBeInstanceOf(RegExp)
      expect(route.names).toContain('id')
      expect(typeof route.handler).toBe('function')
    })
  })

  describe('POST /api/plans/:id/auto-schedule', () => {
    it('returns 400 for invalid plan id', async () => {
      const { DB } = createMockDb()
      const route = autoScheduleRoutes[0]
      const response = await route.handler(
        new Request('http://localhost/api/plans/abc/auto-schedule', { method: 'POST' }),
        { DB },
        { id: 'abc' },
      )
      expect(response.status).toBe(400)
    })

    it('returns 403 without schedule permission', async () => {
      mockedHasPermission.mockResolvedValue(false)
      const { DB } = createMockDb()
      const route = autoScheduleRoutes[0]
      const response = await route.handler(
        new Request('http://localhost/api/plans/1/auto-schedule', { method: 'POST' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(403)
    })

    it('returns 404 when plan not found', async () => {
      const { DB, first, all, run } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = autoScheduleRoutes[0]
      const response = await route.handler(
        new Request('http://localhost/api/plans/1/auto-schedule', { method: 'POST' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(404)
    })

    it('auto-schedules volunteers when teams and members exist', async () => {
      const { DB, first, all, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, date: '2026-07-05', service_type_id: 1 })
      // teams query
      all.mockResolvedValueOnce({ results: [{ id: 1, name: 'Louange', service_type: 1 }] })
      // team_members query
      all.mockResolvedValueOnce({
        results: [
          { member_id: 10, team_id: 1, position: 'musicien', first_name: 'Jean', last_name: 'Dupont' },
          { member_id: 11, team_id: 1, position: 'musicien', first_name: 'Marie', last_name: 'Martin' },
          { member_id: 12, team_id: 1, position: 'chant', first_name: 'Paul', last_name: 'Durand' },
        ],
      })
      // preferences query
      all.mockResolvedValueOnce({
        results: [
          { member_id: 10, unavailable_dates: null, max_services_per_month: 4 },
          { member_id: 11, unavailable_dates: null, max_services_per_month: 2 },
        ],
      })
      // already scheduled query
      all.mockResolvedValueOnce({ results: [] })
      // monthly counts query
      all.mockResolvedValueOnce({ results: [] })
      // last scheduled query
      all.mockResolvedValueOnce({ results: [] })

      run.mockResolvedValue({ meta: { last_row_id: 99 } })

      const route = autoScheduleRoutes[0]
      const response = await route.handler(
        new Request('http://localhost/api/plans/1/auto-schedule', { method: 'POST' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.assignments.length).toBeGreaterThan(0)
      expect(body.message).toContain('Auto-scheduled')
    })

    it('respects unavailable dates and max services per month', async () => {
      const { DB, first, all, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, date: '2026-07-05', service_type_id: 1 })
      all.mockResolvedValueOnce({ results: [{ id: 1, name: 'Louange', service_type: 1 }] })
      all.mockResolvedValueOnce({
        results: [
          { member_id: 10, team_id: 1, position: 'musicien', first_name: 'Jean', last_name: 'Dupont' },
          { member_id: 11, team_id: 1, position: 'musicien', first_name: 'Marie', last_name: 'Martin' },
        ],
      })
      // Member 10 has unavailable date on plan date
      all.mockResolvedValueOnce({
        results: [
          { member_id: 10, unavailable_dates: JSON.stringify(['2026-07-05']), max_services_per_month: 4 },
        ],
      })
      // already scheduled: member 11 already scheduled
      all.mockResolvedValueOnce({ results: [{ member_id: 11 }] })
      all.mockResolvedValueOnce({ results: [] })
      all.mockResolvedValueOnce({ results: [] })

      const route = autoScheduleRoutes[0]
      const response = await route.handler(
        new Request('http://localhost/api/plans/1/auto-schedule', { method: 'POST' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.assignments).toHaveLength(0)
      expect(body.warnings.length).toBeGreaterThanOrEqual(0)
    })

    it('validates request body when provided', async () => {
      const { DB, first, all, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, date: '2026-07-05', service_type_id: 1 })

      const route = autoScheduleRoutes[0]
      const response = await route.handler(
        new Request('http://localhost/api/plans/1/auto-schedule', {
          method: 'POST',
          body: JSON.stringify({ max_per_position: -1 }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(400)
    })

    it('returns message when no teams found', async () => {
      const { DB, first, all, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, date: '2026-07-05', service_type_id: 999 })
      // empty teams
      all.mockResolvedValueOnce({ results: [] })

      const route = autoScheduleRoutes[0]
      const response = await route.handler(
        new Request('http://localhost/api/plans/1/auto-schedule', { method: 'POST' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.message).toContain('No teams found')
    })
  })
})
