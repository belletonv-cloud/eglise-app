import { describe, it, expect, vi, beforeEach } from 'vitest'
import { adminSchedulingRoutes } from '../../src/routes/adminScheduling.js'

vi.mock('../../src/auth.js', () => ({
  hasPermission: vi.fn(),
  getMemberFromRequest: vi.fn(),
}))

import { hasPermission, getMemberFromRequest } from '../../src/auth.js'
const mockedHasPermission = vi.mocked(hasPermission)
const mockedGetMemberFromRequest = vi.mocked(getMemberFromRequest)

function createMockDb() {
  const first = vi.fn()
  const all = vi.fn()
  const run = vi.fn()
  const bind = vi.fn(() => ({ first, all, run }))
  const prepare = vi.fn(() => ({ bind, first, all, run }))
  return { DB: { prepare }, first, all, run, bind, prepare }
}

describe('adminSchedulingRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasPermission.mockResolvedValue(true)
    mockedGetMemberFromRequest.mockResolvedValue({ id: 1, role: 'admin' })
  })

  it('exports an array of routes', () => {
    expect(Array.isArray(adminSchedulingRoutes)).toBe(true)
    expect(adminSchedulingRoutes.length).toBeGreaterThan(0)
  })

  describe('GET /api/house-groups', () => {
    it('returns paginated house groups', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ count: 3 })
      all.mockResolvedValueOnce({ results: [{ id: 1, name: 'Groupe A' }] })
      const route = adminSchedulingRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/house-groups'))!
      const response = await route.handler(
        new Request('http://localhost/api/house-groups?page=1&size=10'),
        { DB },
        {},
        new URL('http://localhost/api/house-groups?page=1&size=10'),
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.data).toHaveLength(1)
    })
  })

  describe('POST /api/house-groups', () => {
    it('creates a house group', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 1 } })
      first.mockResolvedValueOnce({ id: 1, name: 'Groupe A' })
      const route = adminSchedulingRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/house-groups'))!
      const response = await route.handler(
        new Request('http://localhost/api/house-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Groupe A' }),
        }),
        { DB },
      )
      expect(response.status).toBe(201)
    })

    it('returns 400 without name', async () => {
      const { DB } = createMockDb()
      const route = adminSchedulingRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/house-groups'))!
      const response = await route.handler(
        new Request('http://localhost/api/house-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        { DB },
      )
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/house-groups/:id', () => {
    it('returns a group with members and meetings', async () => {
      const { DB, first, all } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, name: 'Groupe A' })
      all.mockResolvedValueOnce({ results: [{ id: 1, first_name: 'John' }] })
      all.mockResolvedValueOnce({ results: [{ id: 1, date: '2026-06-01' }] })
      const route = adminSchedulingRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/house-groups/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/house-groups/1'),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.members).toHaveLength(1)
      expect(body.meetings).toHaveLength(1)
    })

    it('returns 404 for non-existent group', async () => {
      const { DB, first } = createMockDb()
      first.mockResolvedValueOnce(null)
      const route = adminSchedulingRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/house-groups/999'))!
      const response = await route.handler(
        new Request('http://localhost/api/house-groups/999'),
        { DB },
        { id: '999' },
      )
      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/house-groups/:id', () => {
    it('updates a house group', async () => {
      const { DB, first, run } = createMockDb()
      first.mockResolvedValueOnce({ id: 1, name: 'Old name' })
      run.mockResolvedValueOnce({})
      first.mockResolvedValueOnce({ id: 1, name: 'New name' })
      const route = adminSchedulingRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/house-groups/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/house-groups/1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'New name' }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
    })
  })

  describe('DELETE /api/house-groups/:id', () => {
    it('deletes a house group', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})
      const route = adminSchedulingRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/house-groups/1'))!
      const response = await route.handler(
        new Request('http://localhost/api/house-groups/1', { method: 'DELETE' }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(204)
    })
  })

  describe('Group members', () => {
    it('POST adds a member to a group', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})
      const route = adminSchedulingRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/house-groups/1/members'))!
      const response = await route.handler(
        new Request('http://localhost/api/house-groups/1/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: 5 }),
        }),
        { DB },
        { gid: '1' },
      )
      expect(response.status).toBe(201)
    })

    it('DELETE removes a member from a group', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})
      const route = adminSchedulingRoutes.find(r => r.method === 'DELETE' && r.pattern.test('/api/house-groups/1/members/5'))!
      const response = await route.handler(
        new Request('http://localhost/api/house-groups/1/members/5', { method: 'DELETE' }),
        { DB },
        { gid: '1', mid: '5' },
      )
      expect(response.status).toBe(204)
    })
  })

  describe('Group meetings', () => {
    it('GET returns group meetings', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 1, date: '2026-06-01' }] })
      const route = adminSchedulingRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/house-groups/1/meetings'))!
      const response = await route.handler(
        new Request('http://localhost/api/house-groups/1/meetings'),
        { DB },
        { gid: '1' },
      )
      expect(response.status).toBe(200)
    })

    it('POST creates a group meeting', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 1 } })
      first.mockResolvedValueOnce({ id: 1, date: '2026-06-01' })
      const route = adminSchedulingRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/house-groups/1/meetings'))!
      const response = await route.handler(
        new Request('http://localhost/api/house-groups/1/meetings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: '2026-06-01' }),
        }),
        { DB },
        { gid: '1' },
      )
      expect(response.status).toBe(201)
    })
  })

  describe('Email templates', () => {
    it('GET returns templates', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 1, name: 'Template A' }] })
      const route = adminSchedulingRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/email-templates'))!
      const response = await route.handler(
        new Request('http://localhost/api/email-templates'),
        { DB },
      )
      expect(response.status).toBe(200)
    })

    it('POST creates a template', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({ meta: { last_row_id: 1 } })
      first.mockResolvedValueOnce({ id: 1, name: 'Template A' })
      const route = adminSchedulingRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/email-templates'))!
      const response = await route.handler(
        new Request('http://localhost/api/email-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'T', subject: 'S', body: 'B' }),
        }),
        { DB },
      )
      expect(response.status).toBe(201)
    })
  })

  describe('Member exceptions', () => {
    it('GET returns exceptions', async () => {
      const { DB, all } = createMockDb()
      all.mockResolvedValueOnce({ results: [{ id: 1, member_id: 5 }] })
      const route = adminSchedulingRoutes.find(r => r.method === 'GET' && r.pattern.test('/api/member-exceptions'))!
      const response = await route.handler(
        new Request('http://localhost/api/member-exceptions'),
        { DB },
      )
      expect(response.status).toBe(200)
    })

    it('POST creates an exception', async () => {
      const { DB, run } = createMockDb()
      run.mockResolvedValueOnce({})
      const route = adminSchedulingRoutes.find(r => r.method === 'POST' && r.pattern.test('/api/member-exceptions'))!
      const response = await route.handler(
        new Request('http://localhost/api/member-exceptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: 5, permission: 'admin' }),
        }),
        { DB },
      )
      expect(response.status).toBe(201)
    })
  })

  describe('PUT /api/members/:id/role', () => {
    it('updates a member role', async () => {
      const { DB, run, first } = createMockDb()
      run.mockResolvedValueOnce({})
      first.mockResolvedValueOnce({ id: 1, role: 'admin' })
      const route = adminSchedulingRoutes.find(r => r.method === 'PUT' && r.pattern.test('/api/members/1/role'))!
      const response = await route.handler(
        new Request('http://localhost/api/members/1/role', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'admin' }),
        }),
        { DB },
        { id: '1' },
      )
      expect(response.status).toBe(200)
    })
  })
})
