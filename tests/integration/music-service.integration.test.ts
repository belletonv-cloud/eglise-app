import { describe, it, expect } from 'vitest'
import { handleRequest } from '../../services/music/worker'

describe('Music service integration (mock DB)', () => {
  it('GET /api/songs should return songs', async () => {
    const req = new Request('https://example.test/api/songs')
    const res = await handleRequest(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.songs)).toBe(true)
  })

  it('GET /api/songs/:id should return a song', async () => {
    const req = new Request('https://example.test/api/songs/101')
    const res = await handleRequest(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(101)
  })

  it('GET /api/arrangements/:id should return arrangement', async () => {
    const req = new Request('https://example.test/api/arrangements/11')
    const res = await handleRequest(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(11)
  })

  it('PUT /api/arrangements/:id should update and return arrangement', async () => {
    const payload = { name: 'Updated via integration test' }
    const req = new Request('https://example.test/api/arrangements/11', { method: 'PUT', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
    const res = await handleRequest(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe(payload.name)
  })

  it('POST /api/arrangements/:id/annotations should create annotation', async () => {
    const payload = { content: 'Test annotation', is_shared: true }
    const req = new Request('https://example.test/api/arrangements/11/annotations', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
    const res = await handleRequest(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toHaveProperty('id')
    expect(body.content).toBe(payload.content)
  })
})
