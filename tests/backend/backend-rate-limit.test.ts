import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rateLimit } from '../../src/rate-limit.js'

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind, first, all, run }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('rateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false when under the limit', async () => {
    const { DB, first, run } = createMockDb()
    run.mockResolvedValueOnce({ meta: { changes: 1 } })
    first.mockResolvedValueOnce({ count: 1 })
    const request = new Request('http://localhost/api/test')
    const result = await rateLimit(request, { DB })
    expect(result).toBe(false)
  })

  it('returns true when over the limit', async () => {
    const { DB, first, run } = createMockDb()
    run.mockResolvedValueOnce({ meta: { changes: 1 } })
    first.mockResolvedValueOnce({ count: 200 })
    const request = new Request('http://localhost/api/test')
    const result = await rateLimit(request, { DB })
    expect(result).toBe(true)
  })

  it('handles DB errors gracefully (returns false)', async () => {
    const { DB, run } = createMockDb()
    run.mockRejectedValueOnce(new Error('DB error'))
    const request = new Request('http://localhost/api/test')
    const result = await rateLimit(request, { DB })
    expect(result).toBe(false)
  })

  it('creates unique rate limit keys per path', async () => {
    const { DB: db1, first: first1, run: run1 } = createMockDb()
    run1.mockResolvedValueOnce({ meta: { changes: 1 } })
    first1.mockResolvedValueOnce({ count: 1 })
    const res1 = await rateLimit(new Request('http://localhost/api/test1'), { DB: db1 })
    expect(res1).toBe(false)

    const { DB: db2, first: first2, run: run2 } = createMockDb()
    run2.mockResolvedValueOnce({ meta: { changes: 1 } })
    first2.mockResolvedValueOnce({ count: 50 })
    const res2 = await rateLimit(new Request('http://localhost/api/test2'), { DB: db2 })
    expect(res2).toBe(false)
  })
})
