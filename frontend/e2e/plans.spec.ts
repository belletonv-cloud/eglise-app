import { test, expect } from '@playwright/test'

const API_BASE = 'https://eglise-app.belletonv.workers.dev/api'

test.describe('Plans feature', () => {
  test('GET /api/plans returns plans', async ({ request }) => {
    const res = await request.get(`${API_BASE}/plans`)
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    // API returns either a plain array OR an envelope: { data: [...] }
    const plansArray = Array.isArray(data) ? data : (data.data ?? data.plans ?? [])
    expect(Array.isArray(plansArray)).toBe(true)
  })

  test('GET /api/plans/:id/ical returns calendar file', async ({ request }) => {
    const plansRes = await request.get(`${API_BASE}/plans`)
    const data = await plansRes.json()
    const plans = Array.isArray(data) ? data : (data.data ?? data.plans ?? [])
    if (plans.length > 0) {
      const res = await request.get(`${API_BASE}/plans/${plans[0].id}/ical`)
      expect(res.ok()).toBeTruthy()
      const text = await res.text()
      expect(text).toContain('BEGIN:VCALENDAR')
    }
  })
})
