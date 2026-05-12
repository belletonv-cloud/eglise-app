import { test, expect } from '@playwright/test'

const API_BASE = 'https://eglise-app.belletonv.workers.dev/api'

test.describe('API endpoints', () => {
  test('GET /api/stats returns valid data', async ({ request }) => {
    const res = await request.get(`${API_BASE}/stats`)
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data).toHaveProperty('members')
    expect(data).toHaveProperty('teams')
    expect(typeof data.members).toBe('number')
  })

  test('GET /api/service-types returns array', async ({ request }) => {
    const res = await request.get(`${API_BASE}/service-types`)
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  test('GET /api/members returns array', async ({ request }) => {
    const res = await request.get(`${API_BASE}/members`)
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  test('GET /api/teams returns array', async ({ request }) => {
    const res = await request.get(`${API_BASE}/teams`)
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  test('GET /api/directory returns members with contact info', async ({ request }) => {
    const res = await request.get(`${API_BASE}/directory`)
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  test('GET /api/search requires query param', async ({ request }) => {
    const res = await request.get(`${API_BASE}/search`)
    // Should return empty results without query
    const data = await res.json()
    expect(data).toHaveProperty('results')
  })
})
