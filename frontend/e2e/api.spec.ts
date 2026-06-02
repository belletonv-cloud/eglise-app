import { test, expect } from '@playwright/test'

const API = 'https://eglise-app.belletonv.workers.dev/api'

function asAdmin() {
  return { headers: { 'x-demo-email': 'admin@cieuxouverts.bzh' } }
}

test.describe('API endpoints — shape & auth', () => {

  test('GET /api/stats returns numeric counts', async ({ request }) => {
    const res = await request.get(`${API}/stats`)
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data).toHaveProperty('members')
    expect(data).toHaveProperty('teams')
    expect(typeof data.members).toBe('number')
  })

  test('GET /api/service-types returns array', async ({ request }) => {
    const res = await request.get(`${API}/service-types`)
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  // GET /api/members now requires auth AND returns a paginated envelope
  test('GET /api/members returns 401 without auth', async ({ request }) => {
    const res = await request.get(`${API}/members`)
    expect(res.status()).toBe(401)
  })

  test('GET /api/members returns paginated envelope when authenticated', async ({ request }) => {
    const res = await request.get(`${API}/members`, asAdmin())
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    // paginated shape: { data: [...], page, size, totalCount }
    expect(data).toHaveProperty('data')
    expect(Array.isArray(data.data)).toBe(true)
    expect(data).toHaveProperty('totalCount')
    expect(typeof data.totalCount).toBe('number')
  })

  test('GET /api/teams returns paginated envelope', async ({ request }) => {
    const res = await request.get(`${API}/teams`)
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data).toHaveProperty('data')
    expect(Array.isArray(data.data)).toBe(true)
    expect(data).toHaveProperty('totalCount')
  })

  // GET /api/directory now requires auth
  test('GET /api/directory returns 401 without auth', async ({ request }) => {
    const res = await request.get(`${API}/directory`)
    expect(res.status()).toBe(401)
  })

  test('GET /api/directory returns members with contact info when authenticated', async ({ request }) => {
    const res = await request.get(`${API}/directory`, asAdmin())
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('first_name')
      expect(data[0]).toHaveProperty('last_name')
    }
  })

  test('GET /api/search requires query param — returns empty results shape', async ({ request }) => {
    const res = await request.get(`${API}/search`)
    const data = await res.json()
    expect(data).toHaveProperty('results')
  })

  // GET /api/attendances now requires auth
  test('GET /api/attendances returns 401 without auth', async ({ request }) => {
    const res = await request.get(`${API}/attendances`)
    expect(res.status()).toBe(401)
  })

  test('GET /api/attendances returns paginated data when authenticated as scheduler', async ({ request }) => {
    const res = await request.get(`${API}/attendances`, asAdmin())
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data).toHaveProperty('data')
    expect(Array.isArray(data.data)).toBe(true)
  })

  // Public plan endpoint — no auth required
  test('GET /api/public/plans/:token returns 404 for unknown token', async ({ request }) => {
    const res = await request.get(`${API}/public/plans/not-a-real-token-xyz`)
    expect(res.status()).toBe(404)
  })

  // POST /api/email-logs requires auth (and/or role) — 401 or 403 are both acceptable here
  test('POST /api/email-logs is not accessible without auth', async ({ request }) => {
    const res = await request.post(`${API}/email-logs`, {
      data: { subject: 'Test', body: 'Hello', recipient_email: 'a@b.com' },
    })
    expect([401, 403]).toContain(res.status())
  })
})
