import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { audioRoutes } from '../../src/routes/audio.js'

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('audioRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('route metadata', () => {
    it('exports an array with 6 routes', () => {
      expect(Array.isArray(audioRoutes)).toBe(true)
      expect(audioRoutes).toHaveLength(6)
    })

    it('each route has method, pattern, names, and handler', () => {
      for (const route of audioRoutes) {
        expect(route).toHaveProperty('method')
        expect(route).toHaveProperty('pattern')
        expect(route.pattern).toBeInstanceOf(RegExp)
        expect(route).toHaveProperty('names')
        expect(Array.isArray(route.names)).toBe(true)
        expect(route).toHaveProperty('handler')
        expect(typeof route.handler).toBe('function')
      }
    })
  })

  describe('POST /api/plans/:id/audio', () => {
    it('uploads audio with local storage and processes segments', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1 })

      run.mockResolvedValueOnce({})

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          segments: [
            { start: 0, end: 15.5, type: 'speech', title: 'Intro', text: 'Hello', confidence: 0.95 },
            { start: 15.5, end: 120, type: 'music', title: 'Chant', text: null, confidence: null },
          ],
          summary: { chants: [{ title: 'Chant', start: 15.5, end: 120 }] },
          duration_seconds: 600,
        }),
      }))

      run.mockResolvedValueOnce({})
      run.mockResolvedValueOnce({})
      run.mockResolvedValueOnce({})
      run.mockResolvedValueOnce({})
      run.mockResolvedValueOnce({})

      const route = audioRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plans/1/audio'))!
      const formData = new FormData()
      const blob = new Blob(['fake audio data'], { type: 'audio/mpeg' })
      formData.append('file', blob, 'sermon.mp3')
      formData.append('title', 'Sermon Dimanche')

      const response = await route.handler(
        new Request('http://localhost/api/plans/1/audio', {
          method: 'POST',
          body: formData,
        }),
        { DB, AUDIO_SPLITTER_URL: 'http://mock-splitter.test' },
        { id: '1' },
      )
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.file_url).toBe('local:sermon.mp3')
      expect(body.title).toBe('Sermon Dimanche')
      expect(body.audio_splitter.segments).toBe(2)
      expect(body.audio_splitter.songs).toBe(1)
      expect(body.audio_splitter.duration_seconds).toBe(600)
    })

    it('handles audio splitter failure gracefully', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1 })
      run.mockResolvedValueOnce({})

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        text: async () => 'Internal server error',
      }))

      const route = audioRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plans/1/audio'))!
      const formData = new FormData()
      const blob = new Blob(['fake audio data'], { type: 'audio/mpeg' })
      formData.append('file', blob, 'sermon.mp3')

      const response = await route.handler(
        new Request('http://localhost/api/plans/1/audio', {
          method: 'POST',
          body: formData,
        }),
        { DB, AUDIO_SPLITTER_URL: 'http://mock-splitter.test' },
        { id: '1' },
      )
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.audio_splitter.error).toBeDefined()
      expect(body.audio_splitter.error).toContain('Internal server error')
    })

    it('returns 400 when plan not found', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = audioRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plans/1/audio'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/1/audio', { method: 'POST' }),
        { DB },
        { id: '999' },
      )
      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/plans/:id/audio', () => {
    it('returns audio info for a plan with audio', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({
        audio_url: 'local:sermon.mp3',
        audio_title: 'Sermon',
        audio_duration_seconds: 1800,
      })
      all.mockResolvedValueOnce({
        results: [{ id: 1, filename: 'sermon.mp3', file_type: 'audio' }],
      })
      const route = audioRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/plans/1/audio'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/1/audio'),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.audio_title).toBe('Sermon')
      expect(body.audio_duration_seconds).toBe(1800)
      expect(body.attachments).toHaveLength(1)
    })

    it('returns 404 when plan not found', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = audioRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/plans/1/audio'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/1/audio'),
        { DB },
        { id: '999' },
      )
      expect(response.status).toBe(404)
    })

    it('returns 400 for invalid plan id', async () => {
      const { DB } = createMockDb()
      const route = audioRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/plans/0/audio'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/0/audio'),
        { DB },
        { id: '0' },
      )
      expect(response.status).toBe(400)
    })
  })
})
