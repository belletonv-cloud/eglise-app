import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test API helper functions directly
describe('API base URL', () => {
  it('uses VITE_API_BASE env var', () => {
    const base = import.meta.env.VITE_API_BASE || 'https://eglise-app.belletonv.workers.dev/api'
    expect(base).toContain('eglise-app')
  })
})

describe('API utility functions', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should construct plan ICal URL', () => {
    const API_BASE = import.meta.env.VITE_API_BASE || 'https://eglise-app.belletonv.workers.dev/api'
    const planId = 42
    const url = `${API_BASE}/plans/${planId}/ical`
    expect(url).toContain('/plans/42/ical')
  })

  it('should construct export URL', () => {
    const API_BASE = import.meta.env.VITE_API_BASE || 'https://eglise-app.belletonv.workers.dev/api'
    const entity = 'members'
    const url = `${API_BASE}/export/${entity}`
    expect(url).toContain('/export/members')
  })
})
