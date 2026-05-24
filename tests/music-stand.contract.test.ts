import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

function loadFixture(name: string) {
  const p = path.resolve(__dirname, 'fixtures', 'music-stand', name)
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

describe('Music Stand contract — fixtures structural tests', () => {
  it('GET /songs realistic shape', () => {
    const data = loadFixture('get-songs.200.json')
    expect(data).toHaveProperty('songs')
    expect(Array.isArray(data.songs)).toBe(true)
    for (const s of data.songs) {
      expect(typeof s.id).toBe('number')
      expect(typeof s.title).toBe('string')
      // optional fields
      expect(s).toHaveProperty('arrangement_count')
    }
  })

  it('GET /songs minimal (empty)', () => {
    const data = loadFixture('get-songs.minimal.200.json')
    expect(Array.isArray(data.songs)).toBe(true)
    expect(data.songs.length).toBe(0)
  })

  it('GET /songs/:id success', () => {
    const s = loadFixture('get-song.200.json')
    expect(typeof s.id).toBe('number')
    expect(Array.isArray(s.arrangements)).toBe(true)
    for (const a of s.arrangements) {
      expect(a.song_id).toBe(s.id)
    }
  })

  it('GET /songs/:id not found example', () => {
    const err = loadFixture('get-song.404.json')
    expect(err).toHaveProperty('error')
  })

  it('GET /arrangements/:id shape', () => {
    const a = loadFixture('get-arrangement.200.json')
    expect(typeof a.id).toBe('number')
    expect(typeof a.song_id).toBe('number')
    expect(Array.isArray(a.attachments)).toBe(true)
    // chord_chart is nullable
    expect(a).toHaveProperty('chord_chart')
  })

  it('PUT /arrangements/:id request/response shapes', () => {
    const req = loadFixture('put-arrangement.request.json')
    const res = loadFixture('put-arrangement.200.json')
    expect(typeof req.name).toBe('string')
    expect(typeof res.id).toBe('number')
    expect(res.updated_at).toMatch(/2025|2024/)
  })

  it('GET /arrangements/:id/media list', () => {
    const m = loadFixture('get-arrangement-media.200.json')
    expect(Array.isArray(m.attachments)).toBe(true)
    for (const att of m.attachments) {
      expect(typeof att.file_url).toBe('string')
    }
  })

  it('GET /arrangements/:id/annotations list', () => {
    const a = loadFixture('get-annotations.200.json')
    expect(Array.isArray(a.annotations)).toBe(true)
    for (const ann of a.annotations) {
      expect(typeof ann.content).toBe('string')
      expect(typeof ann.member_id).toBe('number')
    }
  })

  it('POST /arrangements/:id/annotations request & responses', () => {
    const req = loadFixture('post-annotation.request.json')
    const res = loadFixture('post-annotation.201.json')
    expect(typeof req.content).toBe('string')
    expect(typeof res.id).toBe('number')
    expect(res.arrangement_id).toBe(11)
  })
})
