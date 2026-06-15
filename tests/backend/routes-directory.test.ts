import { describe, it, expect, vi, beforeEach } from 'vitest'
import { directoryRoutes } from '../../src/routes/directory.js'

vi.mock('../../src/auth.js')

import { getMemberFromRequest } from '../../src/auth.js'
const mockedGetMemberFromRequest = vi.mocked(getMemberFromRequest)

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind, first, all, run }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('directoryRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetMemberFromRequest.mockResolvedValue({ id: 1, role: 'member' })
  })

  it('exports an array with exactly 1 route', () => {
    expect(Array.isArray(directoryRoutes)).toBe(true)
    expect(directoryRoutes).toHaveLength(1)
  })

  describe('GET /api/directory', () => {
    it('returns directory entries', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 1, first_name: 'John', last_name: 'Doe', email: 'john@test.com', phone: '0123456789', team_names: 'Worship' }] })
      const route = directoryRoutes[0]
      const response = await route.handler(new Request('http://localhost/api/directory'), { DB })
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveLength(1)
      expect(body[0].first_name).toBe('John')
    })

    it('returns 401 when not authenticated', async () => {
      mockedGetMemberFromRequest.mockResolvedValueOnce(null)
      const { DB } = createMockDb()
      const route = directoryRoutes[0]
      const response = await route.handler(new Request('http://localhost/api/directory'), { DB })
      expect(response.status).toBe(401)
    })

    it('returns empty array when no members match', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [] })
      const route = directoryRoutes[0]
      const response = await route.handler(new Request('http://localhost/api/directory'), { DB })
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual([])
    })
  })
})
