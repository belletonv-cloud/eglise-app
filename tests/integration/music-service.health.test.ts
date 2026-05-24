import { describe, it, expect } from 'vitest'
import musicWorker from '../../music-service/worker'
// Use global Request available in the test environment
const { Request } = global as any

describe('Music service health', () => {
  it('GET /music-service/health returns ok', async () => {
    // Call the worker fetch handler directly
    const req = new Request('https://example.test/music-service/health')
    // musicService worker default export is an object with fetch
    const res = await (musicWorker as any).fetch(req, {})
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(typeof body.version).toBe('string')
    expect(typeof body.timestamp).toBe('string')
  })
})
