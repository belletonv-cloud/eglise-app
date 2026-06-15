import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../utils/api', () => ({
  getApiBase: vi.fn(() => 'http://localhost:8787'),
  authenticatedFetch: vi.fn(),
  api: {
    getPlans: vi.fn().mockResolvedValue({ data: [{ id: 1, title: 'Mock Plan' }], totalCount: 1 }),
  },
}))

import { getPlans } from '../api/plans'
import { authenticatedFetch } from '../utils/api'
const mockedFetch = vi.mocked(authenticatedFetch)

describe('getPlans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches plans with pagination', async () => {
    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ plans: [{ id: 1, date: '2026-06-20' }], total: 1 }),
    })
    const result = await getPlans({ page: 1, limit: 20 })
    expect(result.plans).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it('handles array response', async () => {
    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([{ id: 1, date: '2026-06-21' }]),
    })
    const result = await getPlans({ page: 1, limit: 20 })
    expect(result.plans).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it('includes page and limit query parameters', async () => {
    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ plans: [] }),
    })
    await getPlans({ page: 2, limit: 50 })
    const callUrl = mockedFetch.mock.calls[0][0]
    expect(callUrl).toContain('page=2')
    expect(callUrl).toContain('limit=50')
  })

  it('falls back to mock data on fetch failure', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('Network error'))
    const result = await getPlans({ page: 1, limit: 10 })
    expect(result.plans).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it('handles empty results gracefully', async () => {
    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ plans: [], total: 0 }),
    })
    const result = await getPlans({ page: 1, limit: 20 })
    expect(result.plans).toEqual([])
    expect(result.total).toBe(0)
  })
})
