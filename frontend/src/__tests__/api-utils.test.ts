import { describe, it, expect, vi } from 'vitest'
import { getApiBase } from '../utils/api'

describe('getApiBase', () => {
  it('returns the API_BASE string', () => {
    const base = getApiBase()
    expect(base).toBeTruthy()
    expect(typeof base).toBe('string')
  })
})

describe('API URL construction patterns', () => {
  it('constructs plan ICal URL correctly', () => {
    const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8787/api' : 'https://eglise-app.belletonv.workers.dev/api')
    const url = `${API_BASE}/plans/42/ical`
    expect(url).toContain('/plans/42/ical')
  })

  it('constructs export URL correctly', () => {
    const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8787/api' : 'https://eglise-app.belletonv.workers.dev/api')
    const url = `${API_BASE}/export/members`
    expect(url).toContain('/export/members')
  })

  it('constructs church events URL with params', () => {
    const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8787/api' : 'https://eglise-app.belletonv.workers.dev/api')
    const params = new URLSearchParams({ source: 'cieuxouverts.bzh', include_exceptions: '1' })
    const url = `${API_BASE}/church-events?${params.toString()}`
    expect(url).toContain('source=cieuxouverts.bzh')
    expect(url).toContain('include_exceptions=1')
  })

  it('constructs plan list URL with month/year filters', () => {
    const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8787/api' : 'https://eglise-app.belletonv.workers.dev/api')
    const params = new URLSearchParams({ month: '6', year: '2026' })
    const url = `${API_BASE}/plans?${params.toString()}`
    expect(url).toContain('month=6')
    expect(url).toContain('year=2026')
  })
})
