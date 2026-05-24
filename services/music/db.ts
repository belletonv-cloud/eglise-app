// Minimal DB adapter interface for music-service scaffolding.
// In production this should wrap env.DB (Cloudflare D1) with prepared statements.

export type SongRow = Record<string, any>
export type ArrangementRow = Record<string, any>
export type AttachmentRow = Record<string, any>
export type AnnotationRow = Record<string, any>

export interface MusicDb {
  getSongs(opts?: { q?: string }): Promise<SongRow[]>;
  getSongById(id: number): Promise<SongRow | null>;
  getArrangementById(id: number): Promise<ArrangementRow | null>;
  updateArrangement(id: number, updates: Record<string, any>): Promise<ArrangementRow | null>;
  getAttachmentsForArrangement(arrangementId: number): Promise<AttachmentRow[]>;
  getAnnotationsForArrangement(arrangementId: number, memberId?: number): Promise<AnnotationRow[]>;
  insertAnnotation(annotation: { arrangement_id: number; member_id: number; content: string; is_shared?: boolean }): Promise<AnnotationRow>;
}

export function makeDbFromEnv(env: any): MusicDb {
  if (!env || !env.DB) throw new Error('env.DB is required to create a D1 adapter')
  const DB = env.DB

  return {
    async getSongs(opts?: { q?: string }) {
      if (opts && opts.q) {
        const q = `%${opts.q}%`
        const stmt = DB.prepare(`
          SELECT s.*, COUNT(a.id) as arrangement_count
          FROM songs s LEFT JOIN arrangements a ON a.song_id = s.id
          WHERE s.title LIKE ? OR s.author LIKE ?
          GROUP BY s.id ORDER BY s.title ASC
        `)
        const res = await stmt.bind(q, q).all()
        return res.results
      }
      const stmt = DB.prepare(`
        SELECT s.*, COUNT(a.id) as arrangement_count
        FROM songs s LEFT JOIN arrangements a ON a.song_id = s.id
        GROUP BY s.id ORDER BY s.title ASC
      `)
      const result = await stmt.all()
      return result.results
    },

    async getSongById(id: number) {
      const song = await DB.prepare('SELECT * FROM songs WHERE id = ?').bind(id).first()
      if (!song) return null
      const arrangements = await DB.prepare('SELECT * FROM arrangements WHERE song_id = ? ORDER BY name ASC').bind(id).all()
      return { ...song, arrangements: arrangements.results }
    },

    async getArrangementById(id: number) {
      const arr = await DB.prepare('SELECT * FROM arrangements WHERE id = ?').bind(id).first()
      return arr || null
    },

    async updateArrangement(id: number, updates: Record<string, any>) {
      const existing = await DB.prepare('SELECT id FROM arrangements WHERE id = ?').bind(id).first()
      if (!existing) return null
      const updatesArr: string[] = []
      const values: any[] = []
      if (updates.name !== undefined) { updatesArr.push('name = ?'); values.push(updates.name) }
      if (updates.key !== undefined) { updatesArr.push('key = ?'); values.push(updates.key) }
      if (updates.tempo !== undefined) { updatesArr.push('tempo = ?'); values.push(updates.tempo) }
      if (updates.chord_chart !== undefined) { updatesArr.push('chord_chart = ?'); values.push(updates.chord_chart) }
      if (updates.lyrics !== undefined) { updatesArr.push('lyrics = ?'); values.push(updates.lyrics) }
      if (updates.meter !== undefined) { updatesArr.push('meter = ?'); values.push(updates.meter) }
      if (updatesArr.length === 0) return null
      values.push(id)
      await DB.prepare(`UPDATE arrangements SET ${updatesArr.join(', ')} , updated_at = datetime('now') WHERE id = ?`).bind(...values).run()
      const updated = await DB.prepare('SELECT * FROM arrangements WHERE id = ?').bind(id).first()
      return updated || null
    },

    async getAttachmentsForArrangement(arrangementId: number) {
      const r = await DB.prepare("SELECT * FROM attachments WHERE entity_type = 'arrangement' AND entity_id = ? ORDER BY created_at DESC").bind(arrangementId).all()
      return r.results
    },

    async getAnnotationsForArrangement(arrangementId: number, memberId?: number) {
      if (memberId) {
        const r = await DB.prepare(`
          SELECT aa.*, m.first_name, m.last_name
          FROM arrangement_annotations aa
          LEFT JOIN members m ON m.id = aa.member_id
          WHERE aa.arrangement_id = ? AND (aa.is_shared = 1 OR aa.member_id = ?)
          ORDER BY aa.created_at ASC
        `).bind(arrangementId, memberId).all()
        return r.results
      }
      const r = await DB.prepare(`
        SELECT aa.*, m.first_name, m.last_name
        FROM arrangement_annotations aa
        LEFT JOIN members m ON m.id = aa.member_id
        WHERE aa.arrangement_id = ?
        ORDER BY aa.created_at ASC
      `).bind(arrangementId).all()
      return r.results
    },

    async insertAnnotation(annotation: { arrangement_id: number; member_id: number; content: string; is_shared?: boolean }) {
      const res = await DB.prepare('INSERT INTO arrangement_annotations (arrangement_id, member_id, content, is_shared) VALUES (?, ?, ?, ?)')
        .bind(annotation.arrangement_id, annotation.member_id, annotation.content, annotation.is_shared ? 1 : 0).run()
      const inserted = await DB.prepare(`
        SELECT aa.*, m.first_name, m.last_name
        FROM arrangement_annotations aa
        LEFT JOIN members m ON m.id = aa.member_id
        WHERE aa.id = ?
      `).bind(res.meta.last_row_id).first()
      return inserted
    }
  }
}
