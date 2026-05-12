import { test, expect } from '@playwright/test'

const API_BASE = 'https://eglise-app.belletonv.workers.dev/api'

test.describe('Plans feature', () => {
  test('GET /api/plans returns plans', async ({ request }) => {
    const res = await request.get(`${API_BASE}/plans`)
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  test('GET /api/plans/:id/ical returns calendar file', async ({ request }) => {
    // First get plans to find a valid ID
    const plansRes = await request.get(`${API_BASE}/plans`)
    const plans = await plansRes.json()
    if (plans.length > 0) {
      const res = await request.get(`${API_BASE}/plans/${plans[0].id}/ical`)
      expect(res.ok()).toBeTruthy()
      const text = await res.text()
      expect(text).toContain('BEGIN:VCALENDAR')
    }
  })
})
