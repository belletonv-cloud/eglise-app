import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checklistRoutes } from '../../src/routes/checklist.js'

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind, first, all, run }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('checklistRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('route metadata', () => {
    it('exports an array with 9 routes', () => {
      expect(Array.isArray(checklistRoutes)).toBe(true)
      expect(checklistRoutes).toHaveLength(9)
    })

    it('each route has method, pattern, names, and handler', () => {
      for (const route of checklistRoutes) {
        expect(route).toHaveProperty('method')
        expect(route).toHaveProperty('pattern')
        expect(route.pattern).toBeInstanceOf(RegExp)
        expect(route).toHaveProperty('names')
        expect(route).toHaveProperty('handler')
        expect(typeof route.handler).toBe('function')
      }
    })
  })

  describe('GET /api/checklist-templates', () => {
    it('returns all templates with items', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 1, label: 'Sound Check', service_type_id: 1, service_type_name: 'Sunday' }] })
      all.mockResolvedValueOnce({ results: [{ id: 1, checklist_id: 1, label: 'Test mic', position: 1 }] })

      const route = checklistRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/checklist-templates') && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/checklist-templates'),
        { DB },
        {},
        new URL('http://localhost/api/checklist-templates'),
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveLength(1)
      expect(body[0].label).toBe('Sound Check')
      expect(body[0].items).toHaveLength(1)
    })

    it('filters by service_type_id', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 2, label: 'Lighting Check' }] })
      all.mockResolvedValueOnce({ results: [] })

      const route = checklistRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/checklist-templates'))!
      const response = await route.handler(
        new Request('http://localhost/api/checklist-templates?service_type_id=2'),
        { DB },
        {},
        new URL('http://localhost/api/checklist-templates?service_type_id=2'),
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveLength(1)
    })
  })

  describe('POST /api/checklist-templates', () => {
    it('creates template and returns 201', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 1 } })

      const route = checklistRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/checklist-templates') && r.names.length === 0)!
      const response = await route.handler(
        new Request('http://localhost/api/checklist-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: 1, label: 'Sound Check', service_type_id: 1 }),
        }),
        { DB },
      )

      expect(response.status).toBe(201)
    })

    it('returns 400 when position and label are missing', async () => {
      const route = checklistRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/checklist-templates'))!
      const response = await route.handler(
        new Request('http://localhost/api/checklist-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB: createMockDb().DB },
      )

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/checklist-templates/:id', () => {
    it('deletes template and returns 204', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})

      const route = checklistRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/checklist-templates/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/checklist-templates/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(204)
    })

    it('returns 400 for invalid ID', async () => {
      const route = checklistRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/checklist-templates/abc'))!
      const response = await route.handler(
        new Request('http://localhost/api/checklist-templates/abc', { method: 'DELETE' }),
        { DB: createMockDb().DB },
        { id: 'abc' },
      )

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/checklist-templates/:id/items', () => {
    it('creates item and returns 201', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ next_pos: 3 })
      run.mockResolvedValueOnce({ meta: { last_row_id: 10 } })
      first.mockResolvedValueOnce({ id: 10, checklist_id: 1, label: 'Check cables', position: 3 })

      const route = checklistRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/checklist-templates/1/items'))!
      const response = await route.handler(
        new Request('http://localhost/api/checklist-templates/1/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: 'Check cables' }),
        }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.label).toBe('Check cables')
    })

    it('returns 400 when label is missing', async () => {
      const route = checklistRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/checklist-templates/1/items'))!
      const response = await route.handler(
        new Request('http://localhost/api/checklist-templates/1/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: 1 }),
        }),
        { DB: createMockDb().DB },
        { id: '1' },
      )

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/checklist-template-items/:id', () => {
    it('deletes item and returns 204', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})

      const route = checklistRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/checklist-template-items/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/checklist-template-items/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(204)
    })
  })

  describe('GET /api/plans/:id/checklist', () => {
    it('returns checklist items for a plan', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 1, plan_id: 42, label: 'Sound check', done: 0 }] })

      const route = checklistRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/plans/42/checklist'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/42/checklist'),
        { DB },
        { id: '42' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveLength(1)
      expect(body[0].label).toBe('Sound check')
    })
  })

  describe('POST /api/plans/:id/checklist', () => {
    it('creates checklist item for plan and returns 201', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 5 } })

      const route = checklistRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plans/42/checklist'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/42/checklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: 1, label: 'Test sound' }),
        }),
        { DB },
        { id: '42' },
      )

      expect(response.status).toBe(201)
    })

    it('returns 400 when position and label are missing', async () => {
      const route = checklistRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/plans/42/checklist'))!
      const response = await route.handler(
        new Request('http://localhost/api/plans/42/checklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB: createMockDb().DB },
        { id: '42' },
      )

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/plan-checklists/:id', () => {
    it('marks item as done', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({})
      first.mockResolvedValueOnce({ id: 1, plan_id: 42, done: 1, done_at: '2026-06-14T12:00:00', label: 'Test sound' })

      const route = checklistRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/plan-checklists/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-checklists/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ done: true }),
        }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.done).toBe(1)
    })

    it('marks item as not done', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({})
      first.mockResolvedValueOnce({ id: 1, done: 0, done_at: null })

      const route = checklistRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/plan-checklists/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-checklists/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ done: false }),
        }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.done).toBe(0)
    })
  })

  describe('DELETE /api/plan-checklists/:id', () => {
    it('deletes checklist item and returns 204', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})

      const route = checklistRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/plan-checklists/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/plan-checklists/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )

      expect(response.status).toBe(204)
    })
  })
})
