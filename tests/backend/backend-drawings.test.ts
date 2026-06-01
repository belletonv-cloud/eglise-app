/**
 * Tests Vitest — Drawings endpoints logic
 *
 * Re-implements the drawings business logic (isolation, ownership, JSON paths)
 * to test correctness without a D1 binding.
 */
import { describe, it, expect } from 'vitest'

// ── Re-implement drawings business logic ──────────────────────────────────

interface DrawingRow {
  id: number
  arrangement_id: number
  member_id: number
  paths: string
  is_shared: number
  first_name?: string
  last_name?: string
  updated_at?: string
}

/** Simulates what GET /arrangements/:id/drawings returns */
function filterDrawingsForMember(allDrawings: DrawingRow[], requestingMemberId: number): DrawingRow[] {
  return allDrawings.filter(d =>
    d.member_id === requestingMemberId || d.is_shared === 1
  )
}

/** Simulates the upsert logic for PUT /arrangements/:id/drawings */
function upsertDrawing(
  store: DrawingRow[],
  arrangementId: number,
  memberId: number,
  paths: string,
  isShared: boolean
): { store: DrawingRow[]; result: DrawingRow } {
  const existing = store.find(d => d.arrangement_id === arrangementId && d.member_id === memberId)
  if (existing) {
    existing.paths = paths
    existing.is_shared = isShared ? 1 : 0
    existing.updated_at = new Date().toISOString()
    return { store, result: existing }
  }
  const newRow: DrawingRow = {
    id: store.length + 1,
    arrangement_id: arrangementId,
    member_id: memberId,
    paths,
    is_shared: isShared ? 1 : 0,
    updated_at: new Date().toISOString(),
  }
  store.push(newRow)
  return { store, result: newRow }
}

/** Simulates DELETE /arrangements/:id/drawings */
function deleteDrawing(store: DrawingRow[], arrangementId: number, memberId: number): DrawingRow[] {
  return store.filter(d => !(d.arrangement_id === arrangementId && d.member_id === memberId))
}

// ── Tests: privacy / isolation ────────────────────────────────────────────

describe('Drawings — privacy isolation', () => {
  it('member sees only their own private drawings + all shared drawings', () => {
    const store: DrawingRow[] = [
      { id: 1, arrangement_id: 10, member_id: 1, paths: '[]', is_shared: 0 },  // Luc, private
      { id: 2, arrangement_id: 10, member_id: 2, paths: '[]', is_shared: 0 },  // Pierre, private
      { id: 3, arrangement_id: 10, member_id: 3, paths: '[]', is_shared: 1 },  // Emma, shared
    ]
    // Luc (id=1) should see: own (id=1) + Emma's shared (id=3), NOT Pierre's private (id=2)
    const visible = filterDrawingsForMember(store, 1)
    expect(visible.map(d => d.id)).toEqual([1, 3])
    expect(visible.find(d => d.id === 2)).toBeUndefined()
  })

  it('admin sees all shared drawings (plus own)', () => {
    const store: DrawingRow[] = [
      { id: 1, arrangement_id: 10, member_id: 1, paths: '[]', is_shared: 1 },
      { id: 2, arrangement_id: 10, member_id: 2, paths: '[]', is_shared: 1 },
      { id: 3, arrangement_id: 10, member_id: 3, paths: '[]', is_shared: 0 },  // private
    ]
    const adminId = 99
    const visible = filterDrawingsForMember(store, adminId)
    // admin sees shared (1, 2) but NOT private (3) since it belongs to member 3
    expect(visible.map(d => d.id)).toEqual([1, 2])
  })

  it('member sees nothing if all drawings are private and not theirs', () => {
    const store: DrawingRow[] = [
      { id: 1, arrangement_id: 10, member_id: 2, paths: '[]', is_shared: 0 },
      { id: 2, arrangement_id: 10, member_id: 3, paths: '[]', is_shared: 0 },
    ]
    const visible = filterDrawingsForMember(store, 1)  // member 1 has no drawings
    expect(visible).toHaveLength(0)
  })

  it('member with shared drawing is visible to all', () => {
    const store: DrawingRow[] = [
      { id: 1, arrangement_id: 10, member_id: 5, paths: '[{"tool":"pen"}]', is_shared: 1 },
    ]
    for (const requesterId of [1, 2, 3, 4, 5]) {
      const visible = filterDrawingsForMember(store, requesterId)
      expect(visible).toHaveLength(1)
    }
  })
})

// ── Tests: upsert logic ───────────────────────────────────────────────────

describe('Drawings — upsert (PUT)', () => {
  it('creates a new drawing if none exists for this member+arrangement', () => {
    const store: DrawingRow[] = []
    const { store: updated, result } = upsertDrawing(store, 10, 1, '[{"tool":"pen"}]', false)
    expect(updated).toHaveLength(1)
    expect(result.arrangement_id).toBe(10)
    expect(result.member_id).toBe(1)
    expect(result.is_shared).toBe(0)
  })

  it('updates existing drawing instead of creating a duplicate', () => {
    const store: DrawingRow[] = [
      { id: 1, arrangement_id: 10, member_id: 1, paths: '[]', is_shared: 0 },
    ]
    const { store: updated } = upsertDrawing(store, 10, 1, '[{"tool":"highlighter"}]', true)
    expect(updated).toHaveLength(1)  // still 1 row, not 2
    expect(updated[0].paths).toBe('[{"tool":"highlighter"}]')
    expect(updated[0].is_shared).toBe(1)
  })

  it('two different members can have independent drawings on the same arrangement', () => {
    let store: DrawingRow[] = []
    ;({ store } = upsertDrawing(store, 10, 1, '[{"tool":"pen"}]', false))
    ;({ store } = upsertDrawing(store, 10, 2, '[{"tool":"highlighter"}]', true))
    expect(store).toHaveLength(2)
    expect(store[0].member_id).toBe(1)
    expect(store[1].member_id).toBe(2)
  })

  it('paths must be valid JSON (array)', () => {
    const pathsInput = [{ tool: 'pen', color: '#f59e0b', size: 3, opacity: 1, points: [{ x: 10, y: 20 }] }]
    const pathsStr = JSON.stringify(pathsInput)
    const { result } = upsertDrawing([], 10, 1, pathsStr, false)
    const parsed = JSON.parse(result.paths)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed[0].tool).toBe('pen')
    expect(parsed[0].points[0].x).toBe(10)
  })

  it('is_shared flag is correctly stored as integer', () => {
    const { result: r1 } = upsertDrawing([], 10, 1, '[]', true)
    const { result: r2 } = upsertDrawing([], 10, 2, '[]', false)
    expect(r1.is_shared).toBe(1)
    expect(r2.is_shared).toBe(0)
  })
})

// ── Tests: delete logic ───────────────────────────────────────────────────

describe('Drawings — delete', () => {
  it('deletes only the specified member\'s drawing', () => {
    const store: DrawingRow[] = [
      { id: 1, arrangement_id: 10, member_id: 1, paths: '[]', is_shared: 0 },
      { id: 2, arrangement_id: 10, member_id: 2, paths: '[]', is_shared: 1 },
    ]
    const after = deleteDrawing(store, 10, 1)
    expect(after).toHaveLength(1)
    expect(after[0].member_id).toBe(2)
  })

  it('deleting non-existent drawing is a no-op', () => {
    const store: DrawingRow[] = [
      { id: 1, arrangement_id: 10, member_id: 1, paths: '[]', is_shared: 0 },
    ]
    const after = deleteDrawing(store, 10, 99)  // member 99 has no drawing
    expect(after).toHaveLength(1)
  })

  it('delete is scoped to the arrangement', () => {
    const store: DrawingRow[] = [
      { id: 1, arrangement_id: 10, member_id: 1, paths: '[]', is_shared: 0 },
      { id: 2, arrangement_id: 20, member_id: 1, paths: '[]', is_shared: 0 },
    ]
    const after = deleteDrawing(store, 10, 1)  // only delete from arrangement 10
    expect(after).toHaveLength(1)
    expect(after[0].arrangement_id).toBe(20)
  })
})

// ── Tests: RBAC exemptions for drawings ──────────────────────────────────

describe('Drawings — RBAC exemptions', () => {
  const memberExemptions = [
    /^\/api\/arrangements\/\d+\/drawings(\/|$)/,
    /^\/api\/arrangements\/\d+\/annotations(\/|$)/,
  ]

  function isExemptFromRbacGuard(path: string): boolean {
    return memberExemptions.some(re => re.test(path))
  }

  it('PUT /api/arrangements/:id/drawings is exempt from edit_music guard', () => {
    expect(isExemptFromRbacGuard('/api/arrangements/662/drawings')).toBe(true)
    expect(isExemptFromRbacGuard('/api/arrangements/1/drawings')).toBe(true)
  })

  it('DELETE /api/arrangements/:id/drawings is exempt', () => {
    expect(isExemptFromRbacGuard('/api/arrangements/100/drawings')).toBe(true)
  })

  it('PUT /api/arrangements/:id (chord_chart edit) is NOT exempt — still requires edit_music', () => {
    expect(isExemptFromRbacGuard('/api/arrangements/662')).toBe(false)
  })

  it('PUT /api/arrangements/:id/annotations is exempt', () => {
    expect(isExemptFromRbacGuard('/api/arrangements/662/annotations')).toBe(true)
  })
})

// ── Tests: stroke data validation ─────────────────────────────────────────

describe('Drawings — stroke data format', () => {
  function isValidStroke(s: any): boolean {
    if (typeof s !== 'object' || !s) return false
    if (!['pen', 'highlighter', 'text', 'eraser'].includes(s.tool)) return false
    if (s.tool === 'text') return typeof s.text === 'string' && typeof s.x === 'number'
    return Array.isArray(s.points) && s.points.every(
      (p: any) => typeof p.x === 'number' && typeof p.y === 'number'
    )
  }

  it('validates a pen stroke', () => {
    expect(isValidStroke({ tool: 'pen', color: '#f59e0b', size: 3, opacity: 1, points: [{ x: 0, y: 0 }] })).toBe(true)
  })

  it('validates a highlighter stroke', () => {
    expect(isValidStroke({ tool: 'highlighter', color: '#22c55e', size: 5, opacity: 0.35, points: [{ x: 10, y: 20 }, { x: 50, y: 60 }] })).toBe(true)
  })

  it('validates a text annotation', () => {
    expect(isValidStroke({ tool: 'text', color: '#fff', size: 3, opacity: 1, points: [], text: 'Couplet', x: 10, y: 20 })).toBe(true)
  })

  it('rejects unknown tool types', () => {
    expect(isValidStroke({ tool: 'spray', points: [{ x: 0, y: 0 }] })).toBe(false)
  })

  it('rejects strokes with invalid points', () => {
    expect(isValidStroke({ tool: 'pen', points: [{ x: 'a', y: 0 }] })).toBe(false)
    expect(isValidStroke({ tool: 'pen', points: 'not-an-array' })).toBe(false)
  })

  it('rejects text stroke without x/y', () => {
    expect(isValidStroke({ tool: 'text', text: 'Hello' })).toBe(false)
  })
})

// ── Tests: eraser hit-test ─────────────────────────────────────────────────

describe('Canvas eraser — stroke hit-test', () => {
  interface Point { x: number; y: number }
  interface Stroke { tool: string; points: Point[]; text?: string; x?: number; y?: number }

  function strokeHitsEraser(stroke: Stroke, pos: Point, radius: number): boolean {
    if (stroke.tool === 'text') {
      return Math.hypot((stroke.x ?? 0) - pos.x, (stroke.y ?? 0) - pos.y) < radius + 20
    }
    for (const p of stroke.points) {
      if (Math.hypot(p.x - pos.x, p.y - pos.y) < radius) return true
    }
    return false
  }

  it('detects hit when eraser overlaps a stroke point', () => {
    const stroke: Stroke = { tool: 'pen', points: [{ x: 50, y: 50 }, { x: 100, y: 100 }] }
    expect(strokeHitsEraser(stroke, { x: 52, y: 52 }, 20)).toBe(true)
  })

  it('misses when eraser is far from all stroke points', () => {
    const stroke: Stroke = { tool: 'pen', points: [{ x: 10, y: 10 }] }
    expect(strokeHitsEraser(stroke, { x: 200, y: 200 }, 20)).toBe(false)
  })

  it('hits a text annotation by proximity to text origin', () => {
    const stroke: Stroke = { tool: 'text', points: [], text: 'Couplet', x: 100, y: 100 }
    expect(strokeHitsEraser(stroke, { x: 105, y: 105 }, 20)).toBe(true)
  })

  it('misses text annotation when far away', () => {
    const stroke: Stroke = { tool: 'text', points: [], text: 'Couplet', x: 100, y: 100 }
    expect(strokeHitsEraser(stroke, { x: 300, y: 300 }, 20)).toBe(false)
  })

  it('radius 0 only hits exact point', () => {
    const stroke: Stroke = { tool: 'pen', points: [{ x: 10, y: 10 }] }
    expect(strokeHitsEraser(stroke, { x: 10, y: 10 }, 1)).toBe(true)
    expect(strokeHitsEraser(stroke, { x: 11, y: 11 }, 1)).toBe(false)
  })

  it('larger radius erases more strokes', () => {
    const stroke: Stroke = { tool: 'pen', points: [{ x: 50, y: 50 }] }
    expect(strokeHitsEraser(stroke, { x: 80, y: 80 }, 10)).toBe(false)
    expect(strokeHitsEraser(stroke, { x: 80, y: 80 }, 50)).toBe(true)
  })
})

// ── Tests: security — data access scoping ─────────────────────────────────

describe('Members API — sensitive field filtering', () => {
  function filterMemberForCaller(member: any, caller: any): any {
    const result = { ...member }
    const isAdmin = caller?.role === 'admin'
    const isSelf = caller?.id === member.id
    if (!isAdmin && !isSelf) {
      delete result.birth_date
      delete result.baptism_date
      delete result.notes
      delete result.pco_id
      delete result.pco_updated_at
      delete result.pco_deleted_at
    }
    return result
  }

  const member = {
    id: 5, first_name: 'Luc', last_name: 'Bernard', email: 'luc@test.fr',
    phone: '0600000000', birth_date: '1988-09-12', baptism_date: '2010-06-01',
    notes: 'Infos privées', role: 'member', pco_id: 'pco-123',
    pco_updated_at: '2026-01-01', pco_deleted_at: null,
  }

  it('admin sees all fields', () => {
    const result = filterMemberForCaller(member, { id: 1, role: 'admin' })
    expect(result.birth_date).toBe('1988-09-12')
    expect(result.notes).toBe('Infos privées')
    expect(result.pco_id).toBe('pco-123')
  })

  it('member sees own sensitive fields', () => {
    const result = filterMemberForCaller(member, { id: 5, role: 'member' })
    expect(result.birth_date).toBe('1988-09-12')
    expect(result.notes).toBe('Infos privées')
  })

  it('member does NOT see other members\' sensitive fields', () => {
    const result = filterMemberForCaller(member, { id: 99, role: 'member' })
    expect(result.birth_date).toBeUndefined()
    expect(result.baptism_date).toBeUndefined()
    expect(result.notes).toBeUndefined()
    expect(result.pco_id).toBeUndefined()
  })

  it('non-sensitive fields always visible', () => {
    const result = filterMemberForCaller(member, { id: 99, role: 'member' })
    expect(result.first_name).toBe('Luc')
    expect(result.last_name).toBe('Bernard')
    expect(result.email).toBe('luc@test.fr')
    expect(result.phone).toBe('0600000000')
  })

  it('unauthenticated caller (null) is treated as outsider', () => {
    const result = filterMemberForCaller(member, null)
    expect(result.birth_date).toBeUndefined()
    expect(result.notes).toBeUndefined()
  })
})
