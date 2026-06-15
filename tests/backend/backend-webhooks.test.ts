import { describe, it, expect, vi, beforeEach } from 'vitest'

// Import the actual module
import { triggerWebhooks, processWebhookRetries } from '../../src/webhooks.js'

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind, first, all, run }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('triggerWebhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing when no webhooks configured', async () => {
    const { DB, all } = createMockDb()
    all.mockResolvedValueOnce({ results: [] })
    const originalFetch = global.fetch
    global.fetch = vi.fn()
    try {
      await triggerWebhooks({ DB }, 'plan.created', { planId: 42 })
      expect(global.fetch).not.toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })

  it('triggers webhooks matching the event', async () => {
    const { DB, all, run } = createMockDb()
    all.mockResolvedValueOnce({ results: [{ id: 1, url: 'https://hook.example.com', events: '["plan.created"]', secret: 'sec' }] })
    run.mockResolvedValue({ meta: { changes: 1 } })
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => '{}' })
    try {
      await triggerWebhooks({ DB }, 'plan.created', { planId: 42 })
      expect(global.fetch).toHaveBeenCalledTimes(1)
    } finally {
      global.fetch = originalFetch
    }
  })

  it('matches wildcard events', async () => {
    const { DB, all, run } = createMockDb()
    all.mockResolvedValueOnce({ results: [{ id: 1, url: 'https://hook.example.com', events: '["*"]', secret: '' }] })
    run.mockResolvedValue({ meta: { changes: 1 } })
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => '{}' })
    try {
      await triggerWebhooks({ DB }, 'any.event', { key: 'val' })
      expect(global.fetch).toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })

  it('skips webhooks not matching the event', async () => {
    const { DB, all } = createMockDb()
    all.mockResolvedValueOnce({ results: [{ id: 1, url: 'https://hook.example.com', events: '["member.created"]', secret: '' }] })
    const originalFetch = global.fetch
    global.fetch = vi.fn()
    try {
      await triggerWebhooks({ DB }, 'plan.created', {})
      expect(global.fetch).not.toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })

  it('handles failed deliveries gracefully', async () => {
    const { DB, all, run } = createMockDb()
    all.mockResolvedValueOnce({ results: [{ id: 1, url: 'https://hook.example.com', events: '["plan.created"]', secret: '' }] })
    run.mockResolvedValue({ meta: { changes: 1 } })
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'))
    try {
      await expect(triggerWebhooks({ DB }, 'plan.created', {})).resolves.toBeUndefined()
    } finally {
      global.fetch = originalFetch
    }
  })
})

describe('processWebhookRetries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('processes due retries successfully', async () => {
    const { DB, all, run } = createMockDb()
    all.mockResolvedValueOnce({
      results: [{ id: 10, webhook_id: 1, event: 'plan.created', url: 'https://hook.example.com', secret: '', retry_count: 1, max_retries: 6 }],
    })
    run.mockResolvedValue({ meta: { changes: 1 } })
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => '{}' })
    try {
      await processWebhookRetries({ DB })
      expect(global.fetch).toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })

  it('schedules backoff on retry failure', async () => {
    const { DB, all, run } = createMockDb()
    all.mockResolvedValueOnce({
      results: [{ id: 10, webhook_id: 1, event: 'plan.created', url: 'https://hook.example.com', secret: '', retry_count: 2, max_retries: 6 }],
    })
    run.mockResolvedValue({ meta: { changes: 1 } })
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: false, text: () => 'Error' })
    try {
      await processWebhookRetries({ DB })
      expect(run).toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })
})
