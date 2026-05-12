import { test, expect } from '@playwright/test'

const API_BASE = 'https://eglise-app.belletonv.workers.dev/api'

test.describe('Search', () => {
  test('GET /api/search returns filtered results', async ({ request }) => {
    const res = await request.get(`${API_BASE}/search?q=test`)
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data).toHaveProperty('results')
    expect(data).toHaveProperty('query', 'test')
    expect(Array.isArray(data.results)).toBe(true)
  })

  test('GET /api/search with short query returns empty', async ({ request }) => {
    const res = await request.get(`${API_BASE}/search?q=a`)
    const data = await res.json()
    expect(data.results).toEqual([])
  })
})
