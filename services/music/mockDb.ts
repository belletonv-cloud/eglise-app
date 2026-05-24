import { MusicDb } from './db'
import fs from 'fs'
import path from 'path'

function loadFixture(name: string) {
  const p = path.resolve(__dirname, '..', '..', 'tests', 'fixtures', 'music-stand', name)
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

export class MockMusicDb implements MusicDb {
  constructor() {}
  async getSongs() {
    const data = loadFixture('get-songs.200.json')
    return data.songs
  }
  async getSongById(id: number) {
    const data = loadFixture('get-song.200.json')
    return data.id === id ? data : null
  }
  async getArrangementById(id: number) {
    const data = loadFixture('get-arrangement.200.json')
    return data.id === id ? data : null
  }
  async updateArrangement(id: number, updates: Record<string, any>) {
    const existing = await this.getArrangementById(id)
    if (!existing) return null
    return { ...existing, ...updates, updated_at: new Date().toISOString() }
  }
  async getAttachmentsForArrangement(arrangementId: number) {
    const a = loadFixture('get-arrangement-media.200.json')
    return a.attachments
  }
  async getAnnotationsForArrangement(arrangementId: number) {
    const a = loadFixture('get-annotations.200.json')
    return a.annotations
  }
  async insertAnnotation(annotation: { arrangement_id: number; member_id: number; content: string; is_shared?: boolean }) {
    // Return annotation with synthetic id and created_at
    return { id: Math.floor(Math.random() * 100000), arrangement_id: annotation.arrangement_id, member_id: annotation.member_id, content: annotation.content, is_shared: !!annotation.is_shared, created_at: new Date().toISOString() }
  }
}
