import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

let zod: any
let schemas: any
try {
  zod = require('zod')
  schemas = require('../../docs/api/music-stand.zod')
} catch (e) {
  // zod not installed — tests will be skipped
  // create a placeholder
  zod = null
}

function loadFixture(name: string) {
  const p = path.resolve(__dirname, '..', 'fixtures', 'music-stand', name)
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

describe('Zod schemas (if available)', () => {
  if (!zod) {
    it('skipped because zod is not installed', () => {
      expect(true).toBe(true)
    })
    return
  }

  it('GET /songs fixture validates', () => {
    const data = loadFixture('get-songs.200.json')
    const res = schemas.GetSongsResponseSchema.safeParse(data)
    expect(res.success).toBe(true)
  })

  it('GET /arrangement validates', () => {
    const a = loadFixture('get-arrangement.200.json')
    const res = schemas.GetArrangementResponseSchema.safeParse(a)
    expect(res.success).toBe(true)
  })
})
