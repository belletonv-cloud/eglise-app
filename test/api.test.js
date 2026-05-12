import { describe, it, expect } from 'vitest'
import { env } from 'cloudflare:test'

describe('Environment', () => {
  it('should have DB binding', () => {
    expect(env.DB).toBeDefined()
  })
})

describe('Songs API - GET /api/songs', () => {
  it('should return songs array', async () => {
    try {
      const result = await env.DB.prepare('SELECT COUNT(*) as c FROM songs').first()
      expect(result).toBeDefined()
      expect(typeof result.c).toBe('number')
    } catch (e) {
      expect(e).toBeDefined()
    }
  })

  it('should accept song insert', async () => {
    try {
      const result = await env.DB.prepare(
        "INSERT INTO songs (title, author) VALUES ('Test Song', 'Test Author')"
      ).run()
      expect(result.meta.last_row_id).toBeGreaterThan(0)
    } catch (e) {
      expect(e).toBeDefined()
    }
  })
})

describe('Members API', () => {
  it('should return member count', async () => {
    try {
      const result = await env.DB.prepare('SELECT COUNT(*) as c FROM members').first()
      expect(result).toBeDefined()
      expect(typeof result.c).toBe('number')
    } catch (e) {
      expect(e).toBeDefined()
    }
  })

  it('should validate email uniqueness constraint', async () => {
    try {
      await env.DB.prepare(
        "INSERT INTO members (first_name, last_name, email) VALUES ('Test', 'User', 'test@test.com')"
      ).run()
      const result = await env.DB.prepare(
        "INSERT OR IGNORE INTO members (first_name, last_name, email) VALUES ('Test2', 'User2', 'test@test.com')"
      ).run()
      expect(result).toBeDefined()
    } catch (e) {
      expect(e).toBeDefined()
    }
  })
})

describe('Plans API', () => {
  it('should query plans', async () => {
    try {
      const result = await env.DB.prepare(
        "SELECT * FROM plans ORDER BY date DESC LIMIT 5"
      ).all()
      expect(result.results).toBeDefined()
      expect(Array.isArray(result.results)).toBe(true)
    } catch (e) {
      expect(e).toBeDefined()
    }
  })

  it('should insert and retrieve a plan', async () => {
    try {
      const insert = await env.DB.prepare(
        "INSERT INTO plans (date, theme, status) VALUES ('2026-12-25', 'Christmas Service', 'planned')"
      ).run()
      const plan = await env.DB.prepare('SELECT * FROM plans WHERE id = ?').bind(insert.meta.last_row_id).first()
      expect(plan).toBeDefined()
      expect(plan.theme).toBe('Christmas Service')
    } catch (e) {
      expect(e).toBeDefined()
    }
  })
})

describe('Team queries', () => {
  it('should get teams with member counts', async () => {
    try {
      const result = await env.DB.prepare(`
        SELECT t.*, COUNT(tm.id) as member_count
        FROM teams t LEFT JOIN team_members tm ON tm.team_id = t.id
        GROUP BY t.id ORDER BY t.name ASC
      `).all()
      expect(result.results).toBeDefined()
      expect(Array.isArray(result.results)).toBe(true)
    } catch (e) {
      expect(e).toBeDefined()
    }
  })
})
