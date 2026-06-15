import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../firebase', () => ({
  default: {},
  auth: {},
  googleProvider: {},
  firebaseReady: false,
}))

const authMock = vi.hoisted(() => ({
  user: { value: null },
  isImpersonating: { value: false },
}))

vi.mock('../stores/auth', () => authMock)

import { getApiBase, api, authenticatedFetch } from '../utils/api'

// ============================================
// getApiBase
// ============================================
describe('getApiBase', () => {
  const origLocationDesc = Object.getOwnPropertyDescriptor(window, 'location')!

  afterEach(() => {
    Object.defineProperty(window, 'location', origLocationDesc)
    delete globalThis.__API_BASE__
  })

  it('returns production URL when not localhost and no custom base', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'production.example.com', search: '' },
      configurable: true,
      writable: true,
    })
    expect(getApiBase()).toBe('https://eglise-app.belletonv.workers.dev')
  })

  it('returns localhost URL when hostname is localhost', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost', search: '' },
      configurable: true,
      writable: true,
    })
    expect(getApiBase()).toBe('http://localhost:8787')
  })

  it('uses globalThis.__API_BASE__ when set', () => {
    globalThis.__API_BASE__ = 'https://custom.api.test'
    Object.defineProperty(window, 'location', {
      value: { hostname: 'app.test.com', search: '' },
      configurable: true,
      writable: true,
    })
    expect(getApiBase()).toBe('https://custom.api.test')
  })

  it('falls back to DEFAULT_BASE when __API_BASE__ is unset and not localhost', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'app.test.com', search: '' },
      configurable: true,
      writable: true,
    })
    delete globalThis.__API_BASE__
    expect(getApiBase()).toBe('https://eglise-app.belletonv.workers.dev')
  })
})

// ============================================
// authenticatedFetch
// ============================================
describe('authenticatedFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.user.value = null
    authMock.isImpersonating.value = false
  })

  it('sends plain request when user is null', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response)

    await authenticatedFetch('http://localhost:8787/api/test')

    const args = vi.mocked(globalThis.fetch).mock.calls[0]
    expect(args[0]).toBe('http://localhost:8787/api/test')
  })

  it('sends Authorization Bearer token when user has getIdToken', async () => {
    authMock.user.value = {
      email: 'admin@test.com',
      getIdToken: () => Promise.resolve('mock-id-token'),
    }
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response)

    await authenticatedFetch('http://localhost:8787/api/test')

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      'http://localhost:8787/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-id-token',
        }),
      }),
    )
  })

  it('sends x-demo-email header when impersonating', async () => {
    authMock.user.value = { email: 'demo@church.org', getIdToken: () => Promise.resolve('t') }
    authMock.isImpersonating.value = true
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response)

    await authenticatedFetch('http://localhost:8787/api/test')

    const headers = vi.mocked(globalThis.fetch).mock.calls[0][1]!.headers as Record<string, string>
    expect(headers['x-demo-email']).toBe('demo@church.org')
    expect(headers).not.toHaveProperty('Authorization')
  })

  it('includes Content-Type: application/json when body is present', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response)

    await authenticatedFetch('http://localhost:8787/api/test', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
    })

    const headers = vi.mocked(globalThis.fetch).mock.calls[0][1]!.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
  })
})

// ============================================
// guessRoute + buildUrl (through api proxy)
// ============================================
describe('route guessing and URL building', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses explicit route for known API method (getPlans)', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response)

    await api.getPlans()

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/plans$/),
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('builds URL with ID for hasId routes (getPlan)', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 42, title: 'Test' }),
    } as Response)

    await api.getPlan(42)

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/plans\/42$/),
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('appends query string params for GET list routes', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response)

    await api.getPlans({ month: '6', year: '2026', page: '1' })

    const url = vi.mocked(globalThis.fetch).mock.calls[0][0] as string
    expect(url).toContain('month=6')
    expect(url).toContain('year=2026')
    expect(url).toContain('page=1')
  })

  it('skips undefined/null query params', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response)

    await api.getPlans({ month: '6', year: undefined, page: null })

    const url = vi.mocked(globalThis.fetch).mock.calls[0][0] as string
    expect(url).toContain('month=6')
    expect(url).not.toContain('year=')
    expect(url).not.toContain('page=')
  })

  it('uses POST method and JSON body for create routes', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    } as Response)

    await api.createPlan({ title: 'Nouveau plan', date: '2026-07-01' })

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/plans$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Nouveau plan', date: '2026-07-01' }),
      }),
    )
  })

  it('uses PUT method and JSON body for update routes', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, title: 'Updated' }),
    } as Response)

    await api.updatePlan(1, { title: 'Updated' })

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/plans\/1$/),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      }),
    )
  })

  it('uses DELETE method for delete routes', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ deleted: true }),
    } as Response)

    await api.deletePlan(5)

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/plans\/5$/),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('guesses routes not in API_ROUTES via toKebab conversion', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 99, name: 'Guessed' }),
    } as Response)

    const result = await (api as any).getSomething(99)

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/something\/99$/),
      expect.objectContaining({ method: 'GET' }),
    )
    expect(result).toEqual({ id: 99, name: 'Guessed' })
  })

  it('converts createSomething to POST /api/something with body', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    } as Response)

    await (api as any).createSomething({ name: 'New' })

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/something$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'New' }),
      }),
    )
  })
})

// ============================================
// tryCall behavior (pagination, errors, demo)
// ============================================
describe('tryCall behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.isImpersonating.value = false
    authMock.user.value = null
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns full paginated shape for list routes', async () => {
    const plans = [
      { id: 1, title: 'Plan A' },
      { id: 2, title: 'Plan B' },
    ]
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: plans, page: 1, size: 25, totalCount: 100 }),
    } as Response)

    const result = await api.getPlans()
    expect(result).toEqual({ data: plans, page: 1, size: 25, totalCount: 100 })
  })

  it('returns plain object for single-entity routes (no pagination)', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 42, title: 'Single Plan' }),
    } as Response)

    const result = await api.getPlan(42)
    expect(result).toEqual({ id: 42, title: 'Single Plan' })
  })

  it('returns mockFallback data via proxy when known route gets 404', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    // getPlans has a mockFallback entry, so proxy returns it instead of null
    const result = await api.getPlans()
    expect(Array.isArray(result)).toBe(true)
    expect(result![0]).toHaveProperty('title')
  })

  it('does NOT console.warn on 404', async () => {
    const warnSpy = vi.spyOn(console, 'warn')
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    await api.getPlans()
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('returns null on 404 for routes without mockFallback', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    const result = await (api as any).getStatus()
    expect(result).toBeNull()
  })

  it('returns mockFallback data via proxy on 401 + warns', async () => {
    const warnSpy = vi.spyOn(console, 'warn')
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 401,
    } as Response)

    const result = await api.getPlans()
    expect(Array.isArray(result)).toBe(true)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('returns mockFallback data via proxy on 5xx + warns', async () => {
    const warnSpy = vi.spyOn(console, 'warn')
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 503,
    } as Response)

    const result = await api.getPlans()
    expect(Array.isArray(result)).toBe(true)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('returns null on 401 for routes without mockFallback', async () => {
    const warnSpy = vi.spyOn(console, 'warn')
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 401,
    } as Response)

    const result = await (api as any).getStatus()
    expect(result).toBeNull()
    expect(warnSpy).toHaveBeenCalled()
  })

  it('returns null on 5xx for routes without mockFallback', async () => {
    const warnSpy = vi.spyOn(console, 'warn')
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    const result = await (api as any).getStatus()
    expect(result).toBeNull()
    expect(warnSpy).toHaveBeenCalled()
  })

  it('returns mockFallback data when impersonating and request fails', async () => {
    authMock.isImpersonating.value = true
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    const result = await api.getPlans()
    expect(Array.isArray(result)).toBe(true)
    expect(result!.length).toBeGreaterThan(0)
    expect(result![0]).toHaveProperty('title')
  })

  it('returns mockFallback members when impersonating', async () => {
    authMock.isImpersonating.value = true
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    const result = await api.getMembers()
    expect(Array.isArray(result)).toBe(true)
    expect(result![0]).toHaveProperty('first_name')
    expect(result![0]).toHaveProperty('last_name')
  })

  it('returns mockFallback data for getMe when impersonating', async () => {
    authMock.isImpersonating.value = true
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    const result = await api.getMe()
    expect(result).toHaveProperty('email')
    expect(result.email).toBe('admin@demo.church')
  })

  it('falls back to proxy-level default for unknown create routes', async () => {
    authMock.isImpersonating.value = true
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    // mockFallback does NOT have createSomething, so the proxy handler generates it
    const result = await (api as any).createSomething({ name: 'New' })
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('success')
  })

  it('falls back to proxy-level default for unknown delete routes', async () => {
    authMock.isImpersonating.value = true
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    const result = await (api as any).deleteSomething(1)
    expect(result).toEqual({ deleted: true })
  })

  it('falls back to proxy-level default for unknown update routes', async () => {
    authMock.isImpersonating.value = true
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    const result = await (api as any).updateSomething(1, { name: 'X' })
    expect(result).toEqual({ success: true })
  })
})

// ============================================
// Edge cases for buildUrl
// ============================================
describe('URL building edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles multi-ID paths like removeTeamMember', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ deleted: true }),
    } as Response)

    await api.removeTeamMember(1, 5)

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/teams\/1\/members\/5$/),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('appends ID to path when path has no {id} placeholder', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    } as Response)

    // getMember path is "/api/members" (no {id}) with hasId:true
    await api.getMember(7)

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/members\/7$/),
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('converts camelCase prop to kebab-case path for guessed routes', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ item: {} }),
    } as Response)

    // getPlanItem is NOT in API_ROUTES → guessRoute handles it
    await (api as any).getPlanItem(1)

    // getPlanItem → "get"+"PlanItem" → "plan-item" → hasId:true → /api/plan-item/1
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/plan-item\/1$/),
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('builds guessed URL correctly for add-prefix routes', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    } as Response)

    // addFooBar → POST /api/foo-bar with body
    await (api as any).addFooBar({ name: 'test' })

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/foo-bar$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      }),
    )
  })
})

// ============================================
// Real URL construction patterns (integration)
// ============================================
describe('URL construction patterns', () => {
  it('constructs plan ICal URL correctly', () => {
    const base = getApiBase()
    const url = `${base}/api/plans/42/ical`
    expect(url).toContain('/plans/42/ical')
  })

  it('constructs export URL correctly', () => {
    const base = getApiBase()
    const url = `${base}/api/export/members`
    expect(url).toContain('/export/members')
  })

  it('constructs church events URL with params', () => {
    const base = getApiBase()
    const params = new URLSearchParams({ source: 'cieuxouverts.bzh', include_exceptions: '1' })
    const url = `${base}/api/church-events?${params.toString()}`
    expect(url).toContain('source=cieuxouverts.bzh')
    expect(url).toContain('include_exceptions=1')
  })

  it('constructs plan list URL with filters', () => {
    const base = getApiBase()
    const params = new URLSearchParams({ month: '6', year: '2026' })
    const url = `${base}/api/plans?${params.toString()}`
    expect(url).toContain('month=6')
    expect(url).toContain('year=2026')
  })
})
