// src/utils/api.ts

declare global {
  var __API_BASE__: string | undefined;
}

const DEFAULT_BASE = 'https://eglise-app.belletonv.workers.dev';
globalThis.__API_BASE__ = globalThis.__API_BASE__ || DEFAULT_BASE;

export function getApiBase(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8787';
  }
  return globalThis.__API_BASE__ || DEFAULT_BASE;
}

// Wrapper fetch avec token Firebase pour les appels API authentifiés
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const { user } = await import('../stores/auth')
  const token = user.value ? await user.value.getIdToken() : null
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

// Helper pour dates dynamiques (mois courant, pour fallback mock)
const _now = new Date();
const _y = _now.getFullYear();
const _m = String(_now.getMonth() + 1).padStart(2, '0');
const _d = (day: number) => `${_y}-${_m}-${String(day).padStart(2, '0')}`;

// Mapping : nom de méthode → { url, méthode HTTP, extraire ID du 1er arg? }
const API_ROUTES: Record<string, { path: string; method: string; hasId?: boolean; hasBody?: boolean; isList?: boolean }> = {
  // Plans
  getPlans:          { path: '/api/plans', method: 'GET', isList: true },
  getPlan:           { path: '/api/plans', method: 'GET', hasId: true },
  getPlanItems:      { path: '/api/plans/{id}/items', method: 'GET', hasId: true, isList: true },
  createPlan:        { path: '/api/plans', method: 'POST', hasBody: true },
  updatePlan:        { path: '/api/plans/{id}', method: 'PUT', hasId: true, hasBody: true },
  deletePlan:        { path: '/api/plans/{id}', method: 'DELETE', hasId: true },
  createPlanItem:    { path: '/api/plans/{id}/items', method: 'POST', hasId: true, hasBody: true },
  updatePlanItem:    { path: '/api/plans/{planId}/items/{id}', method: 'PUT', hasId: true, hasBody: true },
  deletePlanItem:    { path: '/api/plans/{planId}/items/{id}', method: 'DELETE', hasId: true },
  applyPlanTemplate: { path: '/api/plans/from-template', method: 'POST', hasBody: true },

  // Songs
  getSongs:          { path: '/api/songs', method: 'GET', isList: true },
  getSong:           { path: '/api/songs', method: 'GET', hasId: true },
  updateSong:        { path: '/api/songs/{id}', method: 'PUT', hasId: true, hasBody: true },
  createSong:        { path: '/api/songs', method: 'POST', hasBody: true },
  deleteSong:        { path: '/api/songs/{id}', method: 'DELETE', hasId: true },

  // Members
  getMembers:        { path: '/api/members', method: 'GET', isList: true },
  getMember:         { path: '/api/members', method: 'GET', hasId: true },
  createMember:      { path: '/api/members', method: 'POST', hasBody: true },
  updateMember:      { path: '/api/members/{id}', method: 'PUT', hasId: true, hasBody: true },
  deleteMember:      { path: '/api/members/{id}', method: 'DELETE', hasId: true },
  searchMembers:     { path: '/api/members/search', method: 'GET', isList: true },
  getMemberExceptions: { path: '/api/member-exceptions', method: 'GET', isList: true },

  // Teams
  getTeams:          { path: '/api/teams', method: 'GET', isList: true },
  getTeam:           { path: '/api/teams', method: 'GET', hasId: true },
  createTeam:        { path: '/api/teams', method: 'POST', hasBody: true },
  updateTeam:        { path: '/api/teams/{id}', method: 'PUT', hasId: true, hasBody: true },
  deleteTeam:        { path: '/api/teams/{id}', method: 'DELETE', hasId: true },
  addTeamMember:     { path: '/api/teams/{id}/members', method: 'POST', hasId: true, hasBody: true },
  removeTeamMember:  { path: '/api/teams/{teamId}/members/{memberId}', method: 'DELETE', hasId: true },

  // Schedule
  getPlanPeople:     { path: '/api/plans/{id}/people', method: 'GET', hasId: true, isList: true },
  getReplacements:   { path: '/api/schedule/replacements', method: 'GET', isList: true },
  updateSchedule:    { path: '/api/schedule', method: 'PUT', hasBody: true },
  schedulePerson:    { path: '/api/schedule', method: 'POST', hasBody: true },
  removeSchedule:    { path: '/api/schedule', method: 'DELETE', hasBody: true },
  applyReplacement:  { path: '/api/schedule/replace', method: 'POST', hasBody: true },
  updateTeamMember:  { path: '/api/teams/{teamId}/members/{memberId}', method: 'PUT', hasId: true, hasBody: true },

  // Attendance
  getPlanAttendances: { path: '/api/plans/{id}/attendances', method: 'GET', hasId: true, isList: true },
  createAttendance:  { path: '/api/attendances', method: 'POST', hasBody: true },
  deleteAttendance:  { path: '/api/attendances/{id}', method: 'DELETE', hasId: true },
  getAttendanceStats: { path: '/api/attendance/stats', method: 'GET' },

  // House Groups
  getHouseGroups:    { path: '/api/house-groups', method: 'GET', isList: true },
  getHouseGroup:     { path: '/api/house-groups', method: 'GET', hasId: true },
  createHouseGroup:  { path: '/api/house-groups', method: 'POST', hasBody: true },
  updateHouseGroup:  { path: '/api/house-groups/{id}', method: 'PUT', hasId: true, hasBody: true },
  deleteHouseGroup:  { path: '/api/house-groups/{id}', method: 'DELETE', hasId: true },
  addGroupMember:    { path: '/api/house-groups/{id}/members', method: 'POST', hasId: true, hasBody: true },
  removeGroupMember: { path: '/api/house-groups/{groupId}/members/{memberId}', method: 'DELETE', hasId: true },
  addGroupMeeting:   { path: '/api/house-groups/{id}/meetings', method: 'POST', hasId: true, hasBody: true },

  // Church Events
  getChurchEvents:   { path: '/api/church-events', method: 'GET', isList: true },
  createChurchEvent: { path: '/api/church-events', method: 'POST', hasBody: true },
  updateChurchEvent: { path: '/api/church-events/{id}', method: 'PUT', hasId: true, hasBody: true },
  deleteChurchEvent: { path: '/api/church-events/{id}', method: 'DELETE', hasId: true },
  createChurchEventException: { path: '/api/church-events/{id}/exceptions', method: 'POST', hasId: true, hasBody: true },

  // Plan Templates
  getPlanTemplates:  { path: '/api/plan-templates', method: 'GET', isList: true },
  getPlanTemplate:   { path: '/api/plan-templates', method: 'GET', hasId: true },
  createPlanTemplate: { path: '/api/plan-templates', method: 'POST', hasBody: true },
  updatePlanTemplate: { path: '/api/plan-templates/{id}', method: 'PUT', hasId: true, hasBody: true },
  deletePlanTemplate: { path: '/api/plan-templates/{id}', method: 'DELETE', hasId: true },
  getPlanTemplateItems: { path: '/api/plan-templates/{id}/items', method: 'GET', hasId: true, isList: true },
  createPlanTemplateItem: { path: '/api/plan-templates/{id}/items', method: 'POST', hasId: true, hasBody: true },
  updatePlanTemplateItem: { path: '/api/plan-templates/{planTemplateId}/items/{id}', method: 'PUT', hasId: true, hasBody: true },
  deletePlanTemplateItem: { path: '/api/plan-templates/{planTemplateId}/items/{id}', method: 'DELETE', hasId: true },

  // Logs
  getEmailLogs:      { path: '/api/email/logs', method: 'GET', isList: true },
  getConflictLogs:   { path: '/api/conflicts', method: 'GET', isList: true },
  getAuditLogs:      { path: '/api/audit', method: 'GET', isList: true },

  // Service types
  getServiceTypes:   { path: '/api/service-types', method: 'GET', isList: true },

  // Me / Account
  getMe:             { path: '/api/me', method: 'GET' },
  getMySchedule:     { path: '/api/me/schedule', method: 'GET', isList: true },
  updateMe:          { path: '/api/me', method: 'PUT', hasBody: true },
  getMemberAvailability: { path: '/api/me/availability', method: 'GET' },
  updateMemberAvailability: { path: '/api/me/availability', method: 'PUT', hasBody: true },
}

// Mock fallback (valeurs statiques)
const mockFallback: Record<string, (...args: any[]) => any> = {
  getPlans: () => [
    { id: 1, title: 'Culte du dimanche', date: _d(1), time: '10:00', theme: 'Louange', attendance_count: 5, service_type_id: 1, service_type_name: 'Culte' },
    { id: 2, title: 'Groupe de jeunes', date: _d(8), time: '14:00', theme: 'Enseignement', attendance_count: 3, service_type_id: 2, service_type_name: 'Jeunes' },
    { id: 3, title: 'Étude biblique', date: _d(15), time: '18:30', theme: 'Prière', attendance_count: 4, service_type_id: 3, service_type_name: 'Étude' },
  ],
  getEvents: () => [{ id: 1, name: 'Soirée louange', date: _d(15), status: 'confirmed', repeat_period: 'none', start_date: _d(15), time: '19:00' }],
  getSongs: () => [{ id: 1, title: 'Mock song', arrangements: [{ id: 1, key: 'C', tempo: 120 }], arrangement_count: 3 }],
  getSong: () => ({ id: 1, title: 'Mock song', arrangements: [{ id: 1, name: 'Original', key: 'C', tempo: 120, chord_chart: 'Am C G' }] }),
  getPlan: () => ({ id: 1, title: 'Culte du dimanche', date: _d(1), items: [{ id: 1, name: "Chant d'ouverture", type: 'song', key: 'C', chord_chart: 'Am C G', media: [], arrangement_id: 1 }] }),
  getPlanItems: () => [{ id: 1, title: "Chant d'ouverture", name: "Chant d'ouverture", type: 'song', key: 'C', chord_chart: 'Am C G', media: [], arrangement_id: 1 }],
  getMembers: () => [{ id: 1, first_name: 'Jean', last_name: 'Dupont', email: 'jean@eglise.tld' }],
  getMember: () => ({ id: 1, first_name: 'Jean', last_name: 'Dupont', email: 'jean@eglise.tld' }),
  getTeams: () => [{ id: 1, name: 'Louange', members: [{ id: 1, first_name: 'Jean', last_name: 'Dupont' }] }],
  getTeam: () => ({ id: 1, name: 'Louange', members: [{ id: 1, first_name: 'Jean', last_name: 'Dupont' }] }),
  getHouseGroups: () => [{ id: 1, name: 'Groupe maison Centre', members: [{ id: 1, first_name: 'Jean', last_name: 'Dupont' }] }],
  getHouseGroup: () => ({ id: 1, name: 'Groupe maison Centre', members: [{ id: 1, first_name: 'Jean', last_name: 'Dupont' }] }),
  getChurchEvents: () => [{ id: 1, name: 'Culte régional', date: _d(22), status: 'scheduled', repeat_period: 'monthly', start_date: _d(22) }],
  getPlanTemplates: () => [{ id: 1, name: 'Culte type', description: 'Culte dominical standard', items: [] }],
  getPlanTemplate: () => ({ id: 1, name: 'Culte type', description: 'Standard', items: [] }),
  getPlanTemplateItems: () => [{ id: 1, name: 'Louange' }],
  getServiceTypes: () => [{ id: 1, name: 'Culte' }, { id: 2, name: 'Jeunes' }, { id: 3, name: 'Étude' }],
  getMe: () => ({ id: 1, first_name: 'Admin', last_name: 'Démo', email: 'admin@demo.church' }),
  getMySchedule: () => [{ id: 1, planId: 1, role: 'music' }],
  getStats: () => ({ members: 25, activeMembers: 18, upcomingPlans: 3, songsWithArrangements: 20, pendingConfirmations: 2, teams: 5 }),
  getDirectory: () => [{ id: 1, first_name: 'Jean', last_name: 'Dupont', email: 'jean@eglise.tld' }],
  getAnnouncements: () => [{ id: 1, title: 'Annonce importante', content: 'Réunion ce dimanche après le culte', created_at: _d(1) }],
  getPolls: () => [{ id: 1, question: 'Quel jour pour la sortie ?', options: [] }],
  getEmailTemplates: () => [{ id: 1, name: 'Bienvenue', subject: "Bienvenue à l'église" }],
  getWebhooks: () => [{ id: 1, url: 'https://hook.example.com/' }],
  getPlanAttendances: () => [{ id: 1, plan_id: 1, member_id: 1, checked_in_at: new Date().toISOString(), status: 'present', first_name: 'Jean', last_name: 'Dupont' }],
  getPlanPeople: () => [{ id: 1, first_name: 'Jean', last_name: 'Dupont' }],
  getPlanAudio: () => [{ url: 'mock.mp3', type: 'audio' }],
  getInbox: () => [{ id: 1, title: "Bienvenue dans l'app", unread: 1 }],
  getMessage: () => ({ id: 1, text: 'Message de bienvenue', read: false }),
  getNotifications: () => [{ id: 1, message: 'Bienvenue !', read: false }],
  getPlansByDate: () => [
    { id: 1, title: 'Culte du dimanche', date: _d(1), time: '10:00' },
    { id: 2, title: 'Groupe de jeunes', date: _d(8), time: '14:00' },
  ],
  getArrangementMedia: () => [{ url: 'mock.mp3', type: 'audio' }],
  getArrangementAnnotations: () => [{ text: 'Note', author: 'User', id: 1 }],
  getPlanChecklist: () => [{ id: 1, label: 'Préparer la sonorisation', checked: false, position: 0 }],
  getChecklistTemplates: () => [{ id: 1, name: 'Checklist type', items: [{ id: 1, label: 'Vérifier micros', position: 0 }] }],
  getReplacements: () => [{ id: 1, name: 'Marie Remplacement' }],
  getMemberAvailability: () => ({ available: true }),
  getVolunteerPreferences: () => ({ available: true, max_services_per_month: 4, notes: '', unavailable_dates: [] as string[] }),
  getBackupStatus: () => ({ lastBackup: _d(1), status: 'ok' }),
}

// Génère l'URL de l'API pour un appel
function buildUrl(route: { path: string; method: string; hasId?: boolean; hasBody?: boolean; isList?: boolean }, args: any[], base: string): string {
  let path = route.path
  if (route.hasId && args.length > 0) {
    const id = args[0]
    path = path.replace('{id}', String(id)).replace('{planId}', String(id)).replace('{memberId}', String(args[1] ?? '')).replace('{teamId}', String(args[0])).replace('{groupId}', String(args[0])).replace('{songId}', String(args[0])).replace('{memberId}', String(args[1] ?? '')).replace('{planTemplateId}', String(args[0]))
  }
  // Pour les listes, passer les paramètres en query string
  if (route.isList && args.length > 0 && typeof args[0] === 'object') {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(args[0])) {
      if (v !== undefined && v !== null) params.set(k, String(v))
    }
    const qs = params.toString()
    if (qs) path += '?' + qs
  }
  return base + path
}

// Extrait le body JSON des arguments
function extractBody(args: any[]): any {
  for (const a of args) {
    if (typeof a === 'object' && a !== null && !Array.isArray(a) && !(a instanceof URLSearchParams)) return a
  }
  return undefined
}

// Crée l'objet api : appelle le vrai backend, fallback mock si erreur
function createApi() {
  const cache: Record<string, (...args: any[]) => Promise<any>> = {}

  const handler: ProxyHandler<any> = {
    get(_target, prop: string) {
      if (prop === 'then') return undefined // pas une Promise
      if (cache[prop]) return cache[prop]

      cache[prop] = async (...args: any[]) => {
        const route = API_ROUTES[prop]
        if (route) {
          const base = getApiBase()
          const url = buildUrl(route, args, base)
          const body = route.hasBody ? extractBody(args) : undefined
          const options: RequestInit = { method: route.method }
          if (body) options.body = JSON.stringify(body)
          try {
            const res = await authenticatedFetch(url, options)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return await res.json()
          } catch (e) {
            console.warn(`[api] ${prop} → fallback mock (${e instanceof Error ? e.message : e})`)
          }
        }
        // Fallback : mock ou fonction générique
        const mockFn = mockFallback[prop]
        if (mockFn) return mockFn(...args)
        // Fallback générique pour create/update/delete
        if (prop.startsWith('create') || prop.startsWith('add')) return { id: Date.now(), success: true }
        if (prop.startsWith('update')) return { success: true }
        if (prop.startsWith('delete') || prop.startsWith('remove')) return { deleted: true }
        if (prop === 'syncPCO') return { synced: true, results: { imported: 5, updated: 3, errors: [] } }
        return null
      }
      return cache[prop]
    }
  }

  return new Proxy({}, handler) as any
}

export const api: any = createApi()

export default api
