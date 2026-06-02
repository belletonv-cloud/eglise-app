export type Role =
  | 'admin'
  | 'member'
  | 'scheduler'
  | 'editor'
  | 'music_director'
  | 'tech_director'
  | 'volunteer'
  | 'viewer'
  | 'guest'
  | null
  | undefined
  | string

// Keep this aligned with backend src/auth.js (ROLE_PERMISSIONS).
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  member: ['annotate', 'respond_schedule', 'edit_own_profile'],
  scheduler: ['schedule', 'view_conflicts', 'force_schedule'],
  editor: ['edit_members', 'edit_teams', 'manage_members', 'edit_announcements'],
  music_director: ['schedule', 'edit_music', 'view_conflicts', 'edit_announcements'],
  tech_director: ['schedule', 'view_conflicts', 'edit_tech'],
  volunteer: [],
  viewer: [],
  guest: [],
}

export function hasRolePermission(role: Role, permission: string): boolean {
  if (!role || !permission) return false
  if (role === 'admin') return true

  const perms = ROLE_PERMISSIONS[role] || []
  return perms.includes('*') || perms.includes(permission)
}

export function roleHasAnyPermission(role: Role, permissions: string[]): boolean {
  return permissions.some((p) => hasRolePermission(role, p))
}
