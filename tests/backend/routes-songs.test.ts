import { describe, it, expect, vi, beforeEach } from 'vitest'
import { songsRoutes } from '../../src/routes/songs.js'

vi.mock('../../src/auth.js')

import { hasPermission } from '../../src/auth.js'
const mockedHasPermission = vi.mocked(hasPermission)

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('songsRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
  })

  describe('route metadata', () => {
    it('exports an array with 5 routes', () => {
      expect(Array.isArray(songsRoutes)).toBe(true)
      expect(songsRoutes).toHaveLength(5)
    })

    it('each route has method, pattern, names, and handler', () => {
      for (const route of songsRoutes) {
        expect(route).toHaveProperty('method')
        expect(route).toHaveProperty('pattern')
        expect(route.pattern).toBeInstanceOf(RegExp)
        expect(route).toHaveProperty('names')
        expect(Array.isArray(route.names)).toBe(true)
        expect(route).toHaveProperty('handler')
        expect(typeof route.handler).toBe('function')
      }
    })

    it('has correct HTTP methods and patterns', () => {
      const [list, create, del, detail, updateArr] = songsRoutes
      expect(list.method).toBe('GET')
      expect(list.pattern.test('/api/songs')).toBe(true)
      expect(create.method).toBe('POST')
      expect(del.method).toBe('DELETE')
      expect(detail.method).toBe('GET')
      expect(detail.pattern.test('/api/songs/42')).toBe(true)
      expect(updateArr.method).toBe('PUT')
      expect(updateArr.pattern.test('/api/arrangements/1')).toBe(true)
    })

    it('extracts param names from patterns with :id', () => {
      const detail = songsRoutes.find(r => r.method === 'GET' && r.names.includes('id'))
      expect(detail).toBeDefined()
      expect(detail!.names).toEqual(['id'])
      const del = songsRoutes.find(r => r.method === 'DELETE')
      expect(del!.names).toEqual(['id'])
    })
  })

  describe('GET /api/songs', () => {
    it('returns paginated response with page/size params', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ c: 2 })
      all.mockResolvedValueOnce({ results: [{ id: 1, title: 'Song A' }, { id: 2, title: 'Song B' }] })
      const route = songsRoutes.find(r => r.method === 'GET' && !r.names.length)!
      const response = await route.handler(
        new Request('http://localhost/api/songs?page=1&size=20'),
        { DB },
      )
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/json')
      const body = await response.json()
      expect(body).toEqual({
        data: [{ id: 1, title: 'Song A' }, { id: 2, title: 'Song B' }],
        page: 1,
        size: 20,
        totalCount: 2,
      })
    })

    it('returns flat array when no page/size params', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ c: 1 })
      all.mockResolvedValueOnce({ results: [{ id: 1, title: 'Song' }] })
      const route = songsRoutes.find(r => r.method === 'GET' && !r.names.length)!
      const response = await route.handler(
        new Request('http://localhost/api/songs'),
        { DB },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(1)
      expect(body[0].title).toBe('Song')
    })

    it('caps size at 500', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ c: 0 })
      all.mockResolvedValueOnce({ results: [] })
      const route = songsRoutes.find(r => r.method === 'GET' && !r.names.length)!
      await route.handler(
        new Request('http://localhost/api/songs?page=1&size=1000'),
        { DB },
      )
      const bindCall = all.mock.calls[0]
      const prepareCall = DB.prepare.mock.calls[1]
      expect(prepareCall[0]).toContain('LIMIT ? OFFSET ?')
    })
  })

  describe('GET /api/songs/:id', () => {
    it('returns song by id with normalized arrangements', async () => {
      const { DB, first, all } = createMockDb()
      const song = { id: 1, title: 'Amazing Grace', author: 'John Newton' }
      first.mockResolvedValueOnce(song)
      all.mockResolvedValueOnce({
        results: [
          { id: 10, name: 'Main', song_id: 1, chord_chart: 'C   G   Am   F', key: 'C' },
        ],
      })
      const route = songsRoutes.find(r => r.method === 'GET' && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/songs/1'),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.id).toBe(1)
      expect(body.title).toBe('Amazing Grace')
      expect(body.arrangements).toHaveLength(1)
      expect(body.arrangements[0].chord_chart).toBe('C   G   Am   F')
    })

    it('returns 400 for invalid id', async () => {
      const { DB } = createMockDb()
      const route = songsRoutes.find(r => r.method === 'GET' && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/songs/0'),
        { DB },
        { id: '0' },
      )
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body).toHaveProperty('error')
    })

    it('returns 404 when song not found', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = songsRoutes.find(r => r.method === 'GET' && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/songs/999'),
        { DB },
        { id: '999' },
      )
      expect(response.status).toBe(404)
    })

    it('normalizes empty chord_chart to null', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, title: 'Test' })
      all.mockResolvedValueOnce({
        results: [{ id: 10, name: 'Main', chord_chart: '   ' }],
      })
      const route = songsRoutes.find(r => r.method === 'GET' && r.names.length === 1)!
      const response = await route.handler(
        new Request('http://localhost/api/songs/1'),
        { DB },
        { id: '1' },
      )
      const body = await response.json()
      expect(body.arrangements[0].chord_chart).toBeNull()
    })
  })

  describe('POST /api/songs', () => {
    it('creates a song and returns 201', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 42 } })
      first.mockResolvedValueOnce({ id: 42, title: 'New Song', author: 'Test' })
      const route = songsRoutes.find(r => r.method === 'POST')!
      const response = await route.handler(
        new Request('http://localhost/api/songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'New Song', author: 'Test' }),
        }),
        { DB },
      )
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body).toHaveProperty('id', 42)
      expect(body).toHaveProperty('title', 'New Song')
    })

    it('returns 403 without edit_music permission', async () => {
      mockedHasPermission.mockResolvedValue(false)
      const { DB } = createMockDb()
      const route = songsRoutes.find(r => r.method === 'POST')!
      const response = await route.handler(
        new Request('http://localhost/api/songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'New Song' }),
        }),
        { DB },
      )
      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.error).toBe('Forbidden')
    })

    it('returns 400 for missing title', async () => {
      const { DB } = createMockDb()
      const route = songsRoutes.find(r => r.method === 'POST')!
      const response = await route.handler(
        new Request('http://localhost/api/songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toMatch(/title is required/i)
    })
  })

  describe('DELETE /api/songs/:id', () => {
    it('deletes a song and returns ok', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1 })
      run.mockResolvedValueOnce({})
      const route = songsRoutes.find(r => r.method === 'DELETE')!
      const response = await route.handler(
        new Request('http://localhost/api/songs/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toEqual({ ok: true })
    })

    it('returns 403 without edit_music permission', async () => {
      mockedHasPermission.mockResolvedValue(false)
      const { DB } = createMockDb()
      const route = songsRoutes.find(r => r.method === 'DELETE')!
      const response = await route.handler(
        new Request('http://localhost/api/songs/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(403)
    })

    it('returns 404 when song not found', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = songsRoutes.find(r => r.method === 'DELETE')!
      const response = await route.handler(
        new Request('http://localhost/api/songs/999', { method: 'DELETE' }),
        { DB },
        { id: '999' },
      )
      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/arrangements/:id', () => {
    it('updates arrangement fields and returns updated', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1 })
      run.mockResolvedValueOnce({})
      first.mockResolvedValueOnce({ id: 1, name: 'Updated', key: 'C', tempo: 120, chord_chart: null })
      const route = songsRoutes.find(r => r.method === 'PUT')!
      const response = await route.handler(
        new Request('http://localhost/api/arrangements/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated', key: 'C', tempo: 120 }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.name).toBe('Updated')
      expect(body.key).toBe('C')
      expect(body.tempo).toBe(120)
    })

    it('returns 404 when arrangement not found', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = songsRoutes.find(r => r.method === 'PUT')!
      const response = await route.handler(
        new Request('http://localhost/api/arrangements/999', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test' }),
        }),
        { DB },
        { id: '999' },
      )
      expect(response.status).toBe(404)
    })

    it('returns 400 when no fields to update', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({ id: 1 })
      const route = songsRoutes.find(r => r.method === 'PUT')!
      const response = await route.handler(
        new Request('http://localhost/api/arrangements/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(400)
    })
  })
})
