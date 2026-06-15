import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mediaRoutes } from '../../src/routes/media.js'

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind, first, all, run }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('mediaRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('route metadata', () => {
    it('exports an array with 1 route', () => {
      expect(Array.isArray(mediaRoutes)).toBe(true)
      expect(mediaRoutes).toHaveLength(1)
    })

    it('has method, pattern, names, and handler', () => {
      const [route] = mediaRoutes
      expect(route).toHaveProperty('method', 'GET')
      expect(route).toHaveProperty('pattern')
      expect(route.pattern).toBeInstanceOf(RegExp)
      expect(route.pattern.test('/api/arrangements/1/media')).toBe(true)
      expect(route).toHaveProperty('names')
      expect(route).toHaveProperty('handler')
      expect(typeof route.handler).toBe('function')
    })
  })

  describe('GET /api/arrangements/:id/media', () => {
    it('returns media attachments for arrangement', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 1, file_name: 'sheet.pdf', entity_type: 'arrangement', entity_id: 1 }] })

      const [route] = mediaRoutes
      const response = await route.handler(
        new Request('http://localhost/api/arrangements/1/media'),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveLength(1)
      expect(body[0].file_name).toBe('sheet.pdf')
    })

    it('returns empty array when no attachments exist', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [] })

      const [route] = mediaRoutes
      const response = await route.handler(
        new Request('http://localhost/api/arrangements/999/media'),
        { DB },
        { id: '999' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual([])
    })

    it('returns 400 for invalid arrangement ID', async () => {
      const [route] = mediaRoutes
      const response = await route.handler(
        new Request('http://localhost/api/arrangements/abc/media'),
        { DB: createMockDb().DB },
        { id: 'abc' },
      )

      expect(response.status).toBe(400)
    })
  })
})
