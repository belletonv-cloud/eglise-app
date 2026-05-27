import { describe, it, expect } from 'vitest'

// Test the RBAC guard logic (re-implemented from src/auth.js for testing)
const ROLE_PERMISSIONS = {
  admin: ['*'],
  scheduler: ['schedule', 'view_conflicts', 'force_schedule'],
  editor: ['edit_members', 'edit_teams', 'manage_members'],
  music_director: ['schedule', 'edit_music', 'view_conflicts'],
  volunteer: [],
  viewer: [],
}

function checkRbacGuard(path, method) {
  const RBAC_GUARDS = [
    { prefix: '/api/members', perm: 'edit_members' },
    { prefix: '/api/teams', perm: 'edit_teams' },
    { prefix: '/api/arrangements', perm: 'edit_music' },
    { prefix: '/api/songs', perm: 'edit_music' },
    { prefix: '/api/plans', perm: 'schedule' },
    { prefix: '/api/plan-items', perm: 'schedule' },
    { prefix: '/api/house-groups', perm: 'edit_members' },
    { prefix: '/api/church-events', perm: 'edit_members' },
    { prefix: '/api/attendances', perm: 'edit_members' },
    { prefix: '/api/plan-template-items', perm: 'schedule' },
    { prefix: '/api/send-bulk-email', perm: 'manage_members' },
    { prefix: '/api/send-email', perm: 'manage_members' },
    { prefix: '/api/email-logs', perm: 'manage_members' },
    { prefix: '/api/attachments', perm: 'edit_members' },
    { prefix: '/api/checklist-templates', perm: 'schedule' },
    { prefix: '/api/checklist-template-items', perm: 'schedule' },
    { prefix: '/api/plan-checklists', perm: 'schedule' },
    { prefix: '/api/messages', perm: 'edit_members' },
    { prefix: '/api/member-exceptions', perm: 'manage_members' },
    { prefix: '/api/communication-preferences', perm: 'edit_members' },
  ]
  if (method === 'GET' || method === 'OPTIONS') return null
  for (const g of RBAC_GUARDS) {
    if (path === g.prefix || path.startsWith(g.prefix + '/') || path.startsWith(g.prefix + '?')) {
      return g.perm
    }
  }
  return null
}

function hasPermission(member, permission) {
  if (!member) return false
  if (member.role === 'admin') return true
  const perms = ROLE_PERMISSIONS[member.role] || []
  return perms.includes('*') || perms.includes(permission)
}

describe('RBAC guard mapping', () => {
  it('allows GET requests without guard', () => {
    expect(checkRbacGuard('/api/members', 'GET')).toBeNull()
    expect(checkRbacGuard('/api/plans/42', 'GET')).toBeNull()
  })

  it('requires edit_members for POST /api/members', () => {
    expect(checkRbacGuard('/api/members', 'POST')).toBe('edit_members')
  })

  it('requires edit_members for PUT /api/members/42', () => {
    expect(checkRbacGuard('/api/members/42', 'PUT')).toBe('edit_members')
  })

  it('requires edit_members for DELETE /api/members/42', () => {
    expect(checkRbacGuard('/api/members/42', 'DELETE')).toBe('edit_members')
  })

  it('requires schedule for POST /api/plans', () => {
    expect(checkRbacGuard('/api/plans', 'POST')).toBe('schedule')
  })

  it('requires edit_music for PUT /api/arrangements/1', () => {
    expect(checkRbacGuard('/api/arrangements/1', 'PUT')).toBe('edit_music')
  })

  it('requires edit_music for POST /api/songs', () => {
    expect(checkRbacGuard('/api/songs', 'POST')).toBe('edit_music')
  })

  it('requires edit_teams for PUT /api/teams/1', () => {
    expect(checkRbacGuard('/api/teams/1', 'PUT')).toBe('edit_teams')
  })

  it('requires edit_members for POST /api/attendances', () => {
    expect(checkRbacGuard('/api/attendances', 'POST')).toBe('edit_members')
  })

  it('requires manage_members for POST /api/send-bulk-email', () => {
    expect(checkRbacGuard('/api/send-bulk-email', 'POST')).toBe('manage_members')
  })

  it('requires manage_members for POST /api/send-email', () => {
    expect(checkRbacGuard('/api/send-email', 'POST')).toBe('manage_members')
  })

  it('requires schedule for POST /api/plan-template-items', () => {
    expect(checkRbacGuard('/api/plan-template-items', 'POST')).toBe('schedule')
  })

  it('requires edit_members for DELETE /api/attachments/1', () => {
    expect(checkRbacGuard('/api/attachments/1', 'DELETE')).toBe('edit_members')
  })

  it('requires schedule for POST /api/checklist-templates', () => {
    expect(checkRbacGuard('/api/checklist-templates', 'POST')).toBe('schedule')
  })

  it('requires schedule for PUT /api/plan-checklists/1', () => {
    expect(checkRbacGuard('/api/plan-checklists/1', 'PUT')).toBe('schedule')
  })

  it('requires edit_members for POST /api/messages', () => {
    expect(checkRbacGuard('/api/messages', 'POST')).toBe('edit_members')
  })

  it('requires manage_members for POST /api/member-exceptions', () => {
    expect(checkRbacGuard('/api/member-exceptions', 'POST')).toBe('manage_members')
  })

  it('does not require guard for unknown paths', () => {
    expect(checkRbacGuard('/api/search', 'POST')).toBeNull()
    expect(checkRbacGuard('/api/attendance-stats', 'PUT')).toBeNull()
    expect(checkRbacGuard('/api/oneclick', 'POST')).toBeNull()
    expect(checkRbacGuard('/api/fcm/register', 'POST')).toBeNull()
    expect(checkRbacGuard('/api/invitations/token123/redeem', 'POST')).toBeNull()
    expect(checkRbacGuard('/api/webhook/incoming/token123', 'POST')).toBeNull()
  })
})

describe('RBAC hasPermission', () => {
  it('admin has all permissions', () => {
    expect(hasPermission({ role: 'admin' }, 'edit_members')).toBe(true)
    expect(hasPermission({ role: 'admin' }, 'anything')).toBe(true)
  })

  it('editor has edit_members but not schedule', () => {
    expect(hasPermission({ role: 'editor' }, 'edit_members')).toBe(true)
    expect(hasPermission({ role: 'editor' }, 'schedule')).toBe(false)
  })

  it('scheduler has schedule but not edit_members', () => {
    expect(hasPermission({ role: 'scheduler' }, 'schedule')).toBe(true)
    expect(hasPermission({ role: 'scheduler' }, 'edit_members')).toBe(false)
  })

  it('music_director has edit_music and schedule', () => {
    expect(hasPermission({ role: 'music_director' }, 'edit_music')).toBe(true)
    expect(hasPermission({ role: 'music_director' }, 'schedule')).toBe(true)
  })

  it('volunteer has no permissions', () => {
    expect(hasPermission({ role: 'volunteer' }, 'schedule')).toBe(false)
    expect(hasPermission({ role: 'volunteer' }, 'edit_members')).toBe(false)
  })

  it('viewer has no permissions', () => {
    expect(hasPermission({ role: 'viewer' }, 'schedule')).toBe(false)
  })

  it('returns false for null member', () => {
    expect(hasPermission(null, 'schedule')).toBe(false)
  })

  it('returns false for undefined role', () => {
    expect(hasPermission({}, 'schedule')).toBe(false)
  })
})
