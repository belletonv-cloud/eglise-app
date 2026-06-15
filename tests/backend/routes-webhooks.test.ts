import { describe, it, expect, vi, beforeEach } from 'vitest'
import { webhooksRoutes } from '../../src/routes/webhooks.js'
import { triggerWebhooks, processWebhookRetries } from '../../src/webhooks.js'

vi.mock('../../src/auth.js')

import { hasPermission } from '../../src/auth.js'
const mockedHasPermission = vi.mocked(hasPermission)

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind, first, all, run }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('webhooksRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
  })

  describe('route metadata', () => {
    it('exports an array with 6 routes', () => {
      expect(Array.isArray(webhooksRoutes)).toBe(true)
      expect(webhooksRoutes).toHaveLength(6)
    })

    it('each route has method, pattern, names, and handler', () => {
      for (const route of webhooksRoutes) {
        expect(route).toHaveProperty('method')
        expect(route).toHaveProperty('pattern')
        expect(route.pattern).toBeInstanceOf(RegExp)
        expect(route).toHaveProperty('names')
        expect(route).toHaveProperty('handler')
        expect(typeof route.handler).toBe('function')
      }
    })
  })

  describe('GET /api/webhooks', () => {
    it('returns all webhooks', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 1, url: 'https://hook.example.com', events: '["plan.created"]' }] })
      const route = webhooksRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/webhooks') && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/webhooks'),
        { DB },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveLength(1)
      expect(body[0].url).toBe('https://hook.example.com')
    })

    it('returns 403 without manage_members', async () => {
      mockedHasPermission.mockResolvedValue(false)
      const { DB } = createMockDb()
      const route = webhooksRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/webhooks') && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/webhooks'),
        { DB },
      )
      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/webhooks', () => {
    it('creates webhook and returns 201', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 1 } })
      first.mockResolvedValueOnce({ id: 1, url: 'https://hook.example.com', events: '["plan.created"]' })
      const route = webhooksRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/webhooks') && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/webhooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://hook.example.com', events: ['plan.created'], label: 'Test' }),
        }),
        { DB },
      )
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.id).toBe(1)
    })

    it('returns 403 without manage_members', async () => {
      mockedHasPermission.mockResolvedValue(false)
      const { DB } = createMockDb()
      const route = webhooksRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/webhooks') && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/webhooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://hook.example.com', events: ['plan.created'] }),
        }),
        { DB },
      )
      expect(response.status).toBe(403)
    })

    it('returns 400 for missing url', async () => {
      const { DB } = createMockDb()
      const route = webhooksRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/webhooks') && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/webhooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: ['test'] }),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
    })

    it('returns 400 for missing events', async () => {
      const { DB } = createMockDb()
      const route = webhooksRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/webhooks') && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/webhooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://example.com' }),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/webhooks/:id', () => {
    it('updates webhook and returns updated', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({})
      first.mockResolvedValueOnce({ id: 1, url: 'https://updated.com', events: '["*"]', label: 'Updated' })
      const route = webhooksRoutes.find(r => r.method === 'PUT')!
      const response = await route.handler(
        new Request('http://localhost/api/webhooks/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://updated.com', events: ['*'] }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.url).toBe('https://updated.com')
    })

    it('returns 400 for invalid id', async () => {
      const { DB } = createMockDb()
      const route = webhooksRoutes.find(r => r.method === 'PUT')!
      const response = await route.handler(
        new Request('http://localhost/api/webhooks/0', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://example.com' }),
        }),
        { DB },
        { id: '0' },
      )
      expect(response.status).toBe(400)
    })

    it('returns 403 without manage_members', async () => {
      mockedHasPermission.mockResolvedValueOnce(false)
      const { DB } = createMockDb()
      const route = webhooksRoutes.find(r => r.method === 'PUT')!
      const response = await route.handler(
        new Request('http://localhost/api/webhooks/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://example.com' }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/webhooks/:id', () => {
    it('deletes webhook and returns 204', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})
      const route = webhooksRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/webhooks/1') && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/webhooks/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(204)
    })

    it('returns 403 without manage_members', async () => {
      mockedHasPermission.mockResolvedValueOnce(false)
      const { DB } = createMockDb()
      const route = webhooksRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/webhooks/1') && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/webhooks/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/webhook-logs', () => {
    it('returns paginated webhook logs', async () => {
      const { DB, all, first } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 1, webhook_id: 1, event: 'plan.created', status: 200 }] })
      first.mockResolvedValueOnce({ c: 1 })
      const route = webhooksRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/webhook-logs'))!
      const response = await route.handler(
        new Request('http://localhost/api/webhook-logs'),
        { DB },
        {},
        new URL('http://localhost/api/webhook-logs'),
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.rows).toHaveLength(1)
      expect(body.total).toBe(1)
      expect(body.page).toBe(1)
    })
  })

  describe('POST /api/webhook/incoming/:token', () => {
    it('accepts incoming webhook with valid token', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, secret: 'valid-token' })
      run.mockResolvedValueOnce({})
      const route = webhooksRoutes.find(r => r.method === 'POST' && r.names.includes('token'))!
      const response = await route.handler(
        new Request('http://localhost/api/webhook/incoming/valid-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'calendly.invitee.created', email: 'test@test.com' }),
        }),
        { DB },
        { token: 'valid-token' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
    })

    it('returns 401 for invalid token', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = webhooksRoutes.find(r => r.method === 'POST' && r.names.includes('token'))!
      const response = await route.handler(
        new Request('http://localhost/api/webhook/incoming/bad-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
        { token: 'bad-token' },
      )
      expect(response.status).toBe(401)
    })
  })
})

describe('webhooks lib (triggerWebhooks)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('triggers webhooks matching an event', async () => {
    const { DB, all, run, bind, prepare } = createMockDb()
    all.mockResolvedValueOnce({
      results: [{ id: 1, url: 'https://hook.example.com', events: '["plan.created"]', secret: 'sec' }],
    })
    run.mockResolvedValue({})

    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => '{}' })

      try {
        await triggerWebhooks({ DB }, 'plan.created', { planId: 42 })
        expect(global.fetch).toHaveBeenCalled()
        expect(run).toHaveBeenCalled()
      } finally {
        global.fetch = originalFetch
      }
    })

  it('skips webhooks not matching the event', async () => {
    const { DB, all } = createMockDb()
    all.mockResolvedValueOnce({
      results: [{ id: 1, url: 'https://hook.example.com', events: '["member.created"]', secret: '' }],
    })

    const originalFetch = global.fetch
    global.fetch = vi.fn()

    try {
      await triggerWebhooks({ DB }, 'plan.created', {})
      expect(global.fetch).not.toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })

  it('matches wildcard events', async () => {
    const { DB, all, run } = createMockDb()
    all.mockResolvedValueOnce({
      results: [{ id: 1, url: 'https://hook.example.com', events: '["*"]', secret: '' }],
    })
    run.mockResolvedValue({})

    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => '{}' })

    try {
      await triggerWebhooks({ DB }, 'any.event', { key: 'val' })
      expect(global.fetch).toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })

  it('logs failed webhook deliveries', async () => {
    const { DB, all, run } = createMockDb()
    all.mockResolvedValueOnce({
      results: [{ id: 1, url: 'https://hook.example.com', events: '["plan.created"]', secret: '' }],
    })
    run.mockResolvedValue({})

    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: false, text: () => 'Server Error' })

    try {
      await triggerWebhooks({ DB }, 'plan.created', {})
      expect(run).toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })

  it('handles fetch exceptions', async () => {
    const { DB, all, run } = createMockDb()
    all.mockResolvedValueOnce({
      results: [{ id: 1, url: 'https://hook.example.com', events: '["plan.created"]', secret: '' }],
    })
    run.mockResolvedValue({})

    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'))

    try {
      await triggerWebhooks({ DB }, 'plan.created', {})
      expect(run).toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })
})

describe('webhooks lib (processWebhookRetries)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('processes due retries and succeeds', async () => {
    const { DB, all, run } = createMockDb()
    all.mockResolvedValueOnce({
      results: [{ id: 10, webhook_id: 1, event: 'plan.created', url: 'https://hook.example.com', secret: '', retry_count: 1, max_retries: 6 }],
    })
    run.mockResolvedValue({})

    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => '{}' })

      try {
        await processWebhookRetries({ DB })
        expect(global.fetch).toHaveBeenCalled()
        expect(run).toHaveBeenCalled()
      } finally {
        global.fetch = originalFetch
      }
    })

  it('retries failed with backoff', async () => {
    const { DB, all, run } = createMockDb()
    all.mockResolvedValueOnce({
      results: [{ id: 10, webhook_id: 1, event: 'plan.created', url: 'https://hook.example.com', secret: '', retry_count: 1, max_retries: 6 }],
    })
    run.mockResolvedValue({})

    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: false, text: () => 'Error' })

    try {
      await processWebhookRetries({ DB })
      expect(run).toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })

  it('handles fetch exceptions during retry', async () => {
    const { DB, all, run } = createMockDb()
    all.mockResolvedValueOnce({
      results: [{ id: 10, webhook_id: 1, event: 'plan.created', url: 'https://hook.example.com', secret: '', retry_count: 0, max_retries: 6 }],
    })
    run.mockResolvedValue({})

    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValue(new Error('Timeout'))

    try {
      await processWebhookRetries({ DB })
      expect(run).toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })

  it('does nothing when no retries due', async () => {
    const { DB, all } = createMockDb()
    all.mockResolvedValueOnce({ results: [] })

    const originalFetch = global.fetch
    global.fetch = vi.fn()

    try {
      await processWebhookRetries({ DB })
      expect(global.fetch).not.toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })
})
