/**
 * Tests Vitest — Plans, Songs & Share token logic
 *
 * Re-implements the business logic in isolation (same pattern as backend-drawings.test.ts).
 */
import { describe, it, expect } from 'vitest'

// ── Helpers ───────────────────────────────────────────────────────────────

interface Plan {
  id: number
  date: string
  time: string | null
  theme: string | null
  notes: string | null
  status: string
  share_token: string | null
  service_type_id: number | null
}

interface PlanItem {
  id: number
  plan_id: number
  type: string
  title: string
  description: string | null
  position: number
  length_minutes: number | null
  color: string | null
}

interface Song {
  id: number
  title: string
  author: string | null
  ccli_number: string | null
  copyright: string | null
  themes: string | null
  notes: string | null
}

// ── Plans: validation ─────────────────────────────────────────────────────

describe('Plans — validation', () => {
  function validatePlan(body: any): string | null {
    if (!body.date) return 'date is required'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return 'date must be YYYY-MM-DD'
    if (body.status && !['planned', 'completed', 'cancelled'].includes(body.status))
      return 'status must be planned, completed or cancelled'
    return null
  }

  it('accepts valid plan', () => {
    expect(validatePlan({ date: '2026-06-15', status: 'planned' })).toBeNull()
  })

  it('rejects missing date', () => {
    expect(validatePlan({})).toBe('date is required')
  })

  it('rejects invalid date format', () => {
    expect(validatePlan({ date: '15-06-2026' })).toBe('date must be YYYY-MM-DD')
  })

  it('rejects invalid status', () => {
    expect(validatePlan({ date: '2026-06-15', status: 'draft' })).toMatch(/status/)
  })

  it('accepts optional fields absent', () => {
    expect(validatePlan({ date: '2026-06-15' })).toBeNull()
  })
})

// ── Plan items: position management ───────────────────────────────────────

describe('Plan items — position management', () => {
  function autoPosition(items: PlanItem[]): number {
    return items.length === 0 ? 1 : Math.max(...items.map(i => i.position)) + 1
  }

  function reorder(items: PlanItem[], fromIdx: number, toIdx: number): PlanItem[] {
    const copy = [...items]
    const [moved] = copy.splice(fromIdx, 1)
    copy.splice(toIdx, 0, moved)
    return copy.map((item, idx) => ({ ...item, position: idx + 1 }))
  }

  it('auto-position is 1 for empty plan', () => {
    expect(autoPosition([])).toBe(1)
  })

  it('auto-position appends after last item', () => {
    const items: PlanItem[] = [
      { id: 1, plan_id: 1, type: 'header', title: 'Ouverture', description: null, position: 1, length_minutes: null, color: null },
      { id: 2, plan_id: 1, type: 'song', title: 'Amazing Grace', description: null, position: 2, length_minutes: 4, color: null },
    ]
    expect(autoPosition(items)).toBe(3)
  })

  it('reorder moves item and renumbers positions sequentially', () => {
    const items: PlanItem[] = [
      { id: 1, plan_id: 1, type: 'song', title: 'A', description: null, position: 1, length_minutes: null, color: null },
      { id: 2, plan_id: 1, type: 'song', title: 'B', description: null, position: 2, length_minutes: null, color: null },
      { id: 3, plan_id: 1, type: 'song', title: 'C', description: null, position: 3, length_minutes: null, color: null },
    ]
    const reordered = reorder(items, 0, 2) // move A to end
    expect(reordered.map(i => i.title)).toEqual(['B', 'C', 'A'])
    expect(reordered.map(i => i.position)).toEqual([1, 2, 3])
  })

  it('total duration sums length_minutes', () => {
    const items: PlanItem[] = [
      { id: 1, plan_id: 1, type: 'song', title: 'A', description: null, position: 1, length_minutes: 5, color: null },
      { id: 2, plan_id: 1, type: 'song', title: 'B', description: null, position: 2, length_minutes: 3, color: null },
      { id: 3, plan_id: 1, type: 'header', title: 'Prière', description: null, position: 3, length_minutes: null, color: null },
    ]
    const total = items.reduce((s, i) => s + (i.length_minutes ?? 0), 0)
    expect(total).toBe(8)
  })

  it('color is stored and retrieved', () => {
    const item: PlanItem = { id: 1, plan_id: 1, type: 'song', title: 'A', description: null, position: 1, length_minutes: null, color: '#6366f1' }
    expect(item.color).toBe('#6366f1')
  })
})

// ── Plan items: type validation ───────────────────────────────────────────

describe('Plan items — type & title validation', () => {
  const validTypes = ['song', 'header', 'media', 'announcement']

  function validateItem(body: any): string | null {
    if (!body.type) return 'type is required'
    if (!validTypes.includes(body.type)) return `type must be one of: ${validTypes.join(', ')}`
    if (!body.title) return 'title is required'
    if (body.title.length > 200) return 'title too long'
    return null
  }

  it('accepts valid song item', () => {
    expect(validateItem({ type: 'song', title: 'Amazing Grace' })).toBeNull()
  })

  it('rejects unknown type', () => {
    expect(validateItem({ type: 'prayer', title: 'Prière' })).toMatch(/type must be/)
  })

  it('rejects missing title', () => {
    expect(validateItem({ type: 'header' })).toBe('title is required')
  })

  it('rejects title over 200 chars', () => {
    expect(validateItem({ type: 'song', title: 'A'.repeat(201) })).toMatch(/too long/)
  })

  for (const t of validTypes) {
    it(`accepts type: ${t}`, () => {
      expect(validateItem({ type: t, title: 'Test' })).toBeNull()
    })
  }
})

// ── Songs: CRUD validation ────────────────────────────────────────────────

describe('Songs — validation', () => {
  function validateSong(body: any): string | null {
    if (!body.title) return 'title is required'
    if (body.title.length > 200) return 'title too long'
    return null
  }

  it('accepts minimal song (title only)', () => {
    expect(validateSong({ title: 'Glorious' })).toBeNull()
  })

  it('rejects missing title', () => {
    expect(validateSong({})).toBe('title is required')
  })

  it('rejects empty title', () => {
    expect(validateSong({ title: '' })).toBe('title is required')
  })

  it('accepts all optional fields', () => {
    expect(validateSong({
      title: 'Holy Holy Holy',
      author: 'Reginald Heber',
      ccli_number: '1234567',
      copyright: '1826',
      themes: 'adoration, Trinité',
    })).toBeNull()
  })
})

// ── Songs: search filter ──────────────────────────────────────────────────

describe('Songs — search/filter', () => {
  const songs: Song[] = [
    { id: 1, title: 'Amazing Grace', author: 'John Newton', ccli_number: null, copyright: null, themes: null, notes: null },
    { id: 2, title: 'Holy Holy Holy', author: 'Reginald Heber', ccli_number: null, copyright: null, themes: null, notes: null },
    { id: 3, title: 'Glorious', author: null, ccli_number: null, copyright: null, themes: null, notes: null },
  ]

  function filterSongs(all: Song[], q: string): Song[] {
    if (!q.trim()) return all
    const lq = q.toLowerCase()
    return all.filter(s =>
      s.title.toLowerCase().includes(lq) ||
      (s.author?.toLowerCase().includes(lq) ?? false)
    )
  }

  it('returns all songs with empty query', () => {
    expect(filterSongs(songs, '')).toHaveLength(3)
  })

  it('filters by title (case-insensitive)', () => {
    expect(filterSongs(songs, 'amazing')).toHaveLength(1)
    expect(filterSongs(songs, 'AMAZING')).toHaveLength(1)
  })

  it('filters by author', () => {
    expect(filterSongs(songs, 'newton')).toHaveLength(1)
    expect(filterSongs(songs, 'newton')[0].title).toBe('Amazing Grace')
  })

  it('returns empty array when no match', () => {
    expect(filterSongs(songs, 'beethoven')).toHaveLength(0)
  })
})

// ── Share token: generation & access ─────────────────────────────────────

describe('Share token — plan public link', () => {
  function isValidUuid(s: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
  }

  it('crypto.randomUUID() produces a valid v4 UUID', () => {
    const token = crypto.randomUUID()
    expect(isValidUuid(token)).toBe(true)
  })

  it('two generated tokens are unique', () => {
    const a = crypto.randomUUID()
    const b = crypto.randomUUID()
    expect(a).not.toBe(b)
  })

  it('plan without share_token has null token', () => {
    const plan: Plan = { id: 1, date: '2026-06-15', time: '10:00', theme: null, notes: null, status: 'planned', share_token: null, service_type_id: null }
    expect(plan.share_token).toBeNull()
  })

  it('plan with share_token exposes public URL', () => {
    const token = 'abc123de-fghij-4klm-nopq-rstuvwxyz123'
    const plan: Plan = { id: 42, date: '2026-06-15', time: '10:00', theme: null, notes: null, status: 'planned', share_token: token, service_type_id: null }
    const url = `/plan/public/${plan.share_token}`
    expect(url).toBe(`/plan/public/${token}`)
  })

  it('revoking sets share_token to null', () => {
    const plan: Plan = { id: 1, date: '2026-06-15', time: null, theme: null, notes: null, status: 'planned', share_token: 'some-token', service_type_id: null }
    plan.share_token = null
    expect(plan.share_token).toBeNull()
  })

  it('public endpoint returns 404 for unknown token (simulated)', () => {
    const store: Plan[] = [
      { id: 1, date: '2026-06-15', time: null, theme: null, notes: null, status: 'planned', share_token: 'valid-token', service_type_id: null }
    ]
    const found = store.find(p => p.share_token === 'invalid-token')
    expect(found).toBeUndefined()
  })
})

// ── iCal DTEND: date arithmetic ───────────────────────────────────────────

describe('iCal DTEND — date arithmetic', () => {
  function addMinutesToIcal(dateStr: string, timeStr: string, addMinutes: number): string {
    const [y, mo, d] = dateStr.split('-').map(Number)
    const [h, mi] = timeStr.split(':').map(Number)
    const start = new Date(y, mo - 1, d, h, mi)
    start.setMinutes(start.getMinutes() + addMinutes)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${start.getFullYear()}${pad(start.getMonth()+1)}${pad(start.getDate())}T${pad(start.getHours())}${pad(start.getMinutes())}00`
  }

  it('10:00 + 90min = 11:30', () => {
    expect(addMinutesToIcal('2026-06-15', '10:00', 90)).toBe('20260615T113000')
  })

  it('23:00 + 90min rolls over to next day', () => {
    expect(addMinutesToIcal('2026-06-15', '23:00', 90)).toBe('20260616T003000')
  })

  it('23:30 + 90min rolls over to next day', () => {
    expect(addMinutesToIcal('2026-06-15', '23:30', 90)).toBe('20260616T010000')
  })

  it('00:00 + 90min = 01:30', () => {
    expect(addMinutesToIcal('2026-06-15', '00:00', 90)).toBe('20260615T013000')
  })

  it('handles minutes correctly (not integer rounding)', () => {
    // Old bug: parseInt("10:30".replace(/:/g,"")) + 100 = 1030 + 100 = 1130 ✓ for :30
    // But: parseInt("10:45".replace(/:/g,"")) + 100 = 1045 + 100 = 1145 ✓
    // And: parseInt("10:55".replace(/:/g,"")) + 100 = 1055 + 100 = 1155 ✓ — WRONG, should be 12:25
    // The fix handles this correctly:
    expect(addMinutesToIcal('2026-06-15', '10:55', 90)).toBe('20260615T122500')
  })

  it('end of month rolls to next month', () => {
    expect(addMinutesToIcal('2026-06-30', '23:00', 90)).toBe('20260701T003000')
  })
})

// ── Unavailable dates: scheduling guard ────────────────────────────────────

describe('Unavailable dates — scheduling guard', () => {
  function isUnavailable(unavailableDates: string[], planDate: string): boolean {
    return unavailableDates.includes(planDate)
  }

  it('blocks scheduling when date is in unavailable list', () => {
    expect(isUnavailable(['2026-06-15', '2026-06-22'], '2026-06-15')).toBe(true)
  })

  it('allows scheduling when date is not in list', () => {
    expect(isUnavailable(['2026-06-15'], '2026-06-22')).toBe(false)
  })

  it('empty unavailable list always allows', () => {
    expect(isUnavailable([], '2026-06-15')).toBe(false)
  })

  it('date must match exactly (no partial match)', () => {
    expect(isUnavailable(['2026-06-1'], '2026-06-15')).toBe(false)
    expect(isUnavailable(['2026-06-150'], '2026-06-15')).toBe(false)
  })

  it('force flag bypasses unavailability check (simulated)', () => {
    const force = true
    const unavailable = isUnavailable(['2026-06-15'], '2026-06-15')
    // With force=true the guard is skipped
    const blocked = unavailable && !force
    expect(blocked).toBe(false)
  })
})

// ── Export auth guard ─────────────────────────────────────────────────────

describe('Export endpoint — access control', () => {
  const entities = ['members', 'songs', 'plans', 'teams']

  function canExport(role: string): boolean {
    // manage_members permission required — only admin and editor have it
    const perms: Record<string, string[]> = {
      admin: ['*'],
      editor: ['edit_members', 'edit_teams', 'manage_members', 'edit_announcements'],
      member: ['annotate', 'respond_schedule', 'edit_own_profile'],
      music_director: ['schedule', 'edit_music', 'view_conflicts', 'edit_announcements'],
    }
    const rp = perms[role] || []
    return rp.includes('*') || rp.includes('manage_members')
  }

  it('admin can export', () => expect(canExport('admin')).toBe(true))
  it('editor can export', () => expect(canExport('editor')).toBe(true))
  it('member cannot export', () => expect(canExport('member')).toBe(false))
  it('music_director cannot export', () => expect(canExport('music_director')).toBe(false))
  it('unauthenticated (null role) cannot export', () => expect(canExport('')).toBe(false))

  it('all export entities are handled', () => {
    // Simulate a switch/if-else for entity validation
    const handled = ['members', 'songs', 'plans', 'teams', 'scheduled_people']
    for (const e of entities) {
      expect(handled).toContain(e)
    }
  })
})
