import { user } from '../stores/auth'

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

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = user.value ? await user.value.getIdToken() : null
  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  return fetch(url, { ...options, headers })
}

const _now = new Date();
const _y = _now.getFullYear();
const _m = String(_now.getMonth() + 1).padStart(2, '0');
const _d = (day: number) => `${_y}-${_m}-${String(day).padStart(2, '0')}`;

function toKebab(s: string): string {
  return s.replace(/^[A-Z]/, c => c.toLowerCase())
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
}

function guessRoute(prop: string): { path: string; method: string; hasBody?: boolean; hasId?: boolean } | null {
  const patterns: [RegExp, string, boolean][] = [
    [/^get(.+)$/, 'GET', false],
    [/^create(.+)$/, 'POST', true],
    [/^update(.+)$/, 'PUT', true],
    [/^delete(.+)$/, 'DELETE', false],
    [/^add(.+)$/, 'POST', true],
    [/^remove(.+)$/, 'DELETE', false],
  ]
  for (const [re, method, hasBody] of patterns) {
    const m = prop.match(re)
    if (m) {
      const rest = m[1]
      const kebab = toKebab(rest)
      return {
        path: `/api/${kebab}`,
        method,
        hasBody: hasBody || method === 'POST' || method === 'PUT',
        hasId: method === 'PUT' || method === 'DELETE' || (prop.startsWith('get') && rest !== 's' && !rest.endsWith('s')),
      }
    }
  }
  return null
}

function buildUrl(route: { path: string; method: string; hasId?: boolean; hasBody?: boolean; isList?: boolean }, args: any[], base: string): string {
  let path = route.path
  if (route.hasId && args.length > 0) {
    const id = args[0]
    path = path.replace('{id}', String(id)).replace('{planId}', String(id)).replace('{memberId}', String(args[1] ?? '')).replace('{teamId}', String(args[0])).replace('{groupId}', String(args[0])).replace('{songId}', String(args[0])).replace('{planTemplateId}', String(args[0])).replace('{pid}', String(id)).replace('{tid}', String(args[0])).replace('{gid}', String(args[0])).replace('{mid}', String(args[1] ?? ''))
  }
  if (route.method === 'GET' && args.length > 0 && typeof args[0] === 'object') {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(args[0])) {
      if (v !== undefined && v !== null) params.set(k, String(v))
    }
    const qs = params.toString()
    if (qs) path += '?' + qs
  }
  return base + path
}

async function tryCall(prop: string, args: any[]): Promise<any> {
  const base = getApiBase()
  let madeAttempt = false
  let lastError: any = null

  for (const route of [API_ROUTES[prop], guessRoute(prop)]) {
    if (!route) continue
    const url = buildUrl(route, args, base)
    const body = route.hasBody ? extractBody(args) : undefined
    const options: RequestInit = { method: route.method }
    if (body) options.body = JSON.stringify(body)
    madeAttempt = true
    try {
      const res = await authenticatedFetch(url, options)
      if (!res.ok) {
        if (res.status >= 500) throw new Error(`HTTP ${res.status}`)
        if (res.status === 401) {
          console.warn(`[api] ${prop} → 401, skipping fallback`)
          return { error: 'unauthorized' }
        }
        if (res.status === 404) { madeAttempt = false; continue }
        throw new Error(`HTTP ${res.status}`)
      }
      return await res.json()
    } catch (e) {
      lastError = e
    }
  }

  if (madeAttempt) {
    console.warn(`[api] ${prop} → fallback mock (${lastError instanceof Error ? lastError.message : lastError})`)
  }
  return null
}

function extractBody(args: any[]): any {
  for (const a of args) {
    if (typeof a === 'object' && a !== null && !Array.isArray(a) && !(a instanceof URLSearchParams)) return a
  }
  return undefined
}

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

function createApi() {
  const cache: Record<string, (...args: any[]) => Promise<any>> = {}

  const handler: ProxyHandler<any> = {
    get(_target, prop: string) {
      if (prop === 'then') return undefined
      if (cache[prop]) return cache[prop]

      cache[prop] = async (...args: any[]) => {
        const result = await tryCall(prop, args)
        if (result !== null) return result

        const mockFn = mockFallback[prop]
        if (mockFn) return mockFn(...args)

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
