import { describe, it, expect, vi, beforeEach } from 'vitest'
import { planTemplatesRoutes } from '../../src/routes/planTemplates.js'

vi.mock('../../src/auth.js')

import { hasPermission } from '../../src/auth.js'
const mockedHasPermission = vi.mocked(hasPermission)

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind, first, all, run }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('planTemplatesRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
  })

  describe('route metadata', () => {
    it('exports an array with 10 routes', () => {
      expect(Array.isArray(planTemplatesRoutes)).toBe(true)
      expect(planTemplatesRoutes).toHaveLength(10)
    })

    it('each route has method, pattern, names, and handler', () => {
      for (const route of planTemplatesRoutes) {
        expect(route).toHaveProperty('method')
        expect(route).toHaveProperty('pattern')
        expect(route.pattern).toBeInstanceOf(RegExp)
        expect(route).toHaveProperty('names')
        expect(route).toHaveProperty('handler')
        expect(typeof route.handler).toBe('function')
      }
    })
  })

  describe('GET /api/plan-templates', () => {
    it('returns all plan templates with item count', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 1, name: 'Sunday Morning', item_count: 5 }, { id: 2, name: 'Evening Service', item_count: 3 }] })

      const route = planTemplatesRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/plan-templates') && r.names.length === 0)!
      const response = await route.handler(new Request('http://localhost/api/plan-templates'), { DB })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveLength(2)
      expect(body[0].name).toBe('Sunday Morning')
    })
  })

  describe('POST /api/plan-templates', () => {
    it('creates a new template and returns 201', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 1 } })
      first.mockResolvedValueOnce({ id: 1, name: 'Test Template', description: 'A test', service_type_id: null })

      const route = planTemplatesRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plan-templates') && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/plan-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test Template', description: 'A test' }),
        }),
        { DB },
      )

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.name).toBe('Test Template')
    })

    it('returns 400 when name is missing', async () => {
      const { DB } = createMockDb()

      const route = planTemplatesRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plan-templates'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: 'No name' }),
        }),
        { DB },
      )

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/plan-templates/:id', () => {
    it('returns template with items', async () => {
      const { DB, all, first } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, name: 'Sunday Morning', description: 'Main service' })
      all.mockResolvedValueOnce({ results: [{ id: 1, type: 'song', title: 'Amazing Grace', position: 1 }] })

      const route = planTemplatesRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/plan-templates/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-templates/1'),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.name).toBe('Sunday Morning')
      expect(body.items).toHaveLength(1)
      expect(body.items[0].title).toBe('Amazing Grace')
    })

    it('returns 404 when template not found', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)

      const route = planTemplatesRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/plan-templates/999'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-templates/999'),
        { DB },
        { id: '999' },
      )

      expect(response.status).toBe(404)
    })

    it('returns 400 for invalid ID', async () => {
      const { DB } = createMockDb()

      const route = planTemplatesRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/plan-templates/abc'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-templates/abc'),
        { DB },
        { id: 'abc' },
      )

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/plan-templates/:id', () => {
    it('updates template fields', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({})
      first.mockResolvedValueOnce({ id: 1, name: 'Updated Name', description: 'Updated', service_type_id: 2 })

      const route = planTemplatesRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/plan-templates/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-templates/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated Name', description: 'Updated' }),
        }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.name).toBe('Updated Name')
    })

    it('returns 400 for invalid ID', async () => {
      const { DB } = createMockDb()

      const route = planTemplatesRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/plan-templates/abc'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-templates/abc', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test' }),
        }),
        { DB },
        { id: 'abc' },
      )

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/plan-templates/:id', () => {
    it('deletes template and returns 204', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})

      const route = planTemplatesRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/plan-templates/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-templates/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(204)
    })

    it('returns 400 for invalid ID', async () => {
      const { DB } = createMockDb()

      const route = planTemplatesRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/plan-templates/abc'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-templates/abc', { method: 'DELETE' }),
        { DB },
        { id: 'abc' },
      )

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/plan-templates/:id/items', () => {
    it('returns template items', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 1, type: 'song', title: 'Test Song', position: 1 }] })

      const route = planTemplatesRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/plan-templates/1/items'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-templates/1/items'),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveLength(1)
    })
  })

  describe('POST /api/plan-templates/:id/items', () => {
    it('creates an item and returns 201', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ next_pos: 2 })
      run.mockResolvedValueOnce({ meta: { last_row_id: 10 } })
      first.mockResolvedValueOnce({ id: 10, type: 'song', title: 'New Song', position: 2 })

      const route = planTemplatesRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plan-templates/1/items'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-templates/1/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'song', title: 'New Song' }),
        }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.title).toBe('New Song')
    })

    it('returns 403 without schedule permission', async () => {
      mockedHasPermission.mockResolvedValueOnce(false)
      const { DB } = createMockDb()

      const route = planTemplatesRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plan-templates/1/items'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-templates/1/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'song', title: 'Test' }),
        }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(403)
    })

    it('returns 400 when type and title are missing', async () => {
      mockedHasPermission.mockResolvedValueOnce(true)
      const { DB } = createMockDb()

      const route = planTemplatesRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plan-templates/1/items'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-templates/1/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: 'no type or title' }),
        }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/plan-template-items/:id', () => {
    it('updates item and returns updated', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({})
      first.mockResolvedValueOnce({ id: 1, type: 'song', title: 'Updated Title', position: 1 })

      const route = planTemplatesRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/plan-template-items/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-template-items/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Updated Title' }),
        }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.title).toBe('Updated Title')
    })

    it('returns 403 without schedule permission', async () => {
      mockedHasPermission.mockResolvedValueOnce(false)
      const { DB } = createMockDb()

      const route = planTemplatesRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/plan-template-items/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-template-items/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Test' }),
        }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/plan-template-items/:id', () => {
    it('deletes item and returns 204', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})

      const route = planTemplatesRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/plan-template-items/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-template-items/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(204)
    })

    it('returns 403 without schedule permission', async () => {
      mockedHasPermission.mockResolvedValueOnce(false)
      const { DB } = createMockDb()

      const route = planTemplatesRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/plan-template-items/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-template-items/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/plan-templates/:id/apply', () => {
    it('creates a plan from template and returns 201', async () => {
      const { DB, first, all, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, name: 'Sunday Morning', service_type_id: 1 })
      run.mockResolvedValueOnce({ meta: { last_row_id: 42 } })
      all.mockResolvedValueOnce({ results: [{ id: 10, type: 'song', title: 'Amazing Grace', description: null, position: 1, length_minutes: 5, arrangement_id: 3, transposed_key: 'C' }] })
      run.mockResolvedValueOnce({})
      first.mockResolvedValueOnce({ id: 10, plan_id: 42, type: 'song' })
      run.mockResolvedValueOnce({})
      first.mockResolvedValueOnce({ id: 42, date: '2026-07-01', status: 'planned' })

      const route = planTemplatesRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plan-templates/1/apply'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-templates/1/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: '2026-07-01', theme: 'Summer Service' }),
        }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.date).toBe('2026-07-01')
    })

    it('returns 404 when template not found', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)

      const route = planTemplatesRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plan-templates/999/apply'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-templates/999/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: '2026-07-01' }),
        }),
        { DB },
        { id: '999' },
      )

      expect(response.status).toBe(404)
    })

    it('returns 400 when date is missing', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, name: 'Template', service_type_id: 1 })

      const route = planTemplatesRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plan-templates/1/apply'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-templates/1/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: 'No date' }),
        }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(400)
    })
  })
})
