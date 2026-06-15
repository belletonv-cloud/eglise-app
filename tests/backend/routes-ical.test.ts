import { describe, it, expect, vi, beforeEach } from 'vitest'
import { icalRoutes } from '../../src/routes/ical.js'

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('icalRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('route metadata', () => {
    it('exports an array with 1 route', () => {
      expect(Array.isArray(icalRoutes)).toBe(true)
      expect(icalRoutes).toHaveLength(1)
    })

    it('has GET method, correct pattern, and handler', () => {
      const [route] = icalRoutes
      expect(route.method).toBe('GET')
      expect(route.pattern).toBeInstanceOf(RegExp)
      expect(route.pattern.test('/api/plans/42/ical')).toBe(true)
      expect(route.pattern.test('/api/plans/42/ical/extra')).toBe(false)
      expect(route.names).toEqual(['id'])
      expect(typeof route.handler).toBe('function')
    })
  })

  describe('GET /api/plans/:id/ical', () => {
    it('returns iCal file for a plan with time set', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({
        id: 42,
        date: '2026-06-21',
        time: '10:00',
        theme: 'Louange',
        service_type_name: 'Culte',
      })
      all.mockResolvedValueOnce({
        results: [
          { first_name: 'John', last_name: 'Doe', team_name: 'Worship', position: 'Leader', email: 'john@test.com' },
        ],
      })
      const [route] = icalRoutes
      const response = await route.handler(
        new Request('http://localhost/api/plans/42/ical'),
        { DB },
        { id: '42' },
      )
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/calendar; charset=utf-8')
      expect(response.headers.get('Content-Disposition')).toContain('service-42.ics')
      const text = await response.text()
      expect(text).toContain('BEGIN:VCALENDAR')
      expect(text).toContain('DTSTART:20260621T100000')
      expect(text).toContain('DTEND:20260621T113000')
      expect(text).toContain('SUMMARY:Culte - Louange')
      expect(text).toContain('[Worship] John Doe (Leader)')
      expect(text).toContain('END:VCALENDAR')
    })

    it('returns iCal with default times when no time or theme set', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({
        id: 43,
        date: '2026-06-21',
        time: null,
        theme: null,
        service_type_name: 'Culte',
      })
      all.mockResolvedValueOnce({ results: [] })
      const [route] = icalRoutes
      const response = await route.handler(
        new Request('http://localhost/api/plans/43/ical'),
        { DB },
        { id: '43' },
      )
      const text = await response.text()
      expect(text).toContain('DTSTART:20260621T100000')
      expect(text).toContain('DTEND:20260621T120000')
      expect(text).toContain('SUMMARY:Culte')
    })

    it('returns 400 for invalid id', async () => {
      const { DB } = createMockDb()
      const [route] = icalRoutes
      const response = await route.handler(
        new Request('http://localhost/api/plans/0/ical'),
        { DB },
        { id: '0' },
      )
      expect(response.status).toBe(400)
    })

    it('returns 404 when plan not found', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const [route] = icalRoutes
      const response = await route.handler(
        new Request('http://localhost/api/plans/999/ical'),
        { DB },
        { id: '999' },
      )
      expect(response.status).toBe(404)
    })
  })
})
