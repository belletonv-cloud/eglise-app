import { describe, it, expect } from 'vitest'
import { healthRoutes } from '../../src/routes/health.js'

describe('healthRoutes', () => {
  it('exports an array with exactly one route for GET /api/health', () => {
    expect(Array.isArray(healthRoutes)).toBe(true)
    expect(healthRoutes).toHaveLength(1)

    const [route] = healthRoutes
    expect(route).toHaveProperty('method', 'GET')
    expect(route).toHaveProperty('pattern')
    expect(route.pattern).toBeInstanceOf(RegExp)
    expect(route.pattern.test('/api/health')).toBe(true)
    expect(route.pattern.test('/api/health/')).toBe(false)
    expect(route.pattern.test('/api/health/extra')).toBe(false)
    expect(route).toHaveProperty('names')
    expect(route.names).toEqual([])
    expect(route).toHaveProperty('handler')
    expect(typeof route.handler).toBe('function')
  })

  it('returns 200 { ok: true } when the database responds', async () => {
    const [route] = healthRoutes
    const db = { prepare: () => ({ first: async () => ({ ok: 1 }) }) }
    const env = { DB: db }
    const request = new Request('http://localhost/api/health')
    const url = new URL('http://localhost/api/health')

    const response = await route.handler(request, env, {}, url)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    const body = await response.json()
    expect(body).toEqual({ ok: true })
  })

  it('returns 500 { ok: false } when the database query throws', async () => {
    const [route] = healthRoutes
    const db = { prepare: () => ({ first: async () => { throw new Error('DB unreachable') } }) }
    const env = { DB: db }
    const request = new Request('http://localhost/api/health')
    const url = new URL('http://localhost/api/health')

    const response = await route.handler(request, env, {}, url)

    expect(response.status).toBe(500)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    const body = await response.json()
    expect(body).toEqual({ ok: false })
  })
})
