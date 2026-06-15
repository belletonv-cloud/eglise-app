import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../utils/api', () => ({
  getApiBase: vi.fn(() => 'http://localhost:8787'),
  authenticatedFetch: vi.fn(),
  api: {
    getMembers: vi.fn().mockResolvedValue({ data: [{ id: 1, first_name: 'Mock' }], totalCount: 1 }),
  },
}))

import { getMembers } from '../api/members'
import { authenticatedFetch } from '../utils/api'
const mockedFetch = vi.mocked(authenticatedFetch)

describe('getMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches members with pagination', async () => {
    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ data: [{ id: 1, first_name: 'John' }], totalCount: 1 }),
    })
    const result = await getMembers({ page: 1, limit: 20 })
    expect(result.members).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it('handles array response', async () => {
    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([{ id: 1, first_name: 'Jane' }]),
    })
    const result = await getMembers({ page: 1, limit: 20 })
    expect(result.members).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it('includes search query parameter', async () => {
    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ data: [] }),
    })
    await getMembers({ page: 1, limit: 10, q: 'John' })
    const callUrl = mockedFetch.mock.calls[0][0]
    expect(callUrl).toContain('q=John')
  })

  it('includes teamId parameter when provided', async () => {
    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ data: [] }),
    })
    await getMembers({ page: 1, limit: 10, teamId: 3 })
    const callUrl = mockedFetch.mock.calls[0][0]
    expect(callUrl).toContain('teamId=3')
  })

  it('falls back to mock data on fetch failure', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('Network error'))
    const result = await getMembers({ page: 1, limit: 10 })
    expect(result.members).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it('handles empty results gracefully', async () => {
    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ data: [], totalCount: 0 }),
    })
    const result = await getMembers({ page: 1, limit: 20 })
    expect(result.members).toEqual([])
    expect(result.total).toBe(0)
  })
})
