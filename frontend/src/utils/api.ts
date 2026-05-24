import type { Song, Arrangement, Member, Team, Plan, PlanItem, ServiceType, ScheduledPerson, Attendance, HouseGroup, EmailTemplate, EmailLog, Attachment, VolunteerPreferences, PlanTemplate, PlanTemplateItem } from './types'
import { user } from '../stores/auth'
import { isInteractiveView, interactiveUser } from '../stores/demo'
import {
  interactiveSongs, interactiveMembers, interactiveTeams,
  interactivePlans, interactiveHouseGroups, demoAnnouncements,
  demoPolls, demoServiceTypes, demoPlanTemplates, demoEmailTemplates,
  interactiveStats, demoTeamMembers,
} from '../stores/demoData'

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8787/api' : 'https://eglise-app.belletonv.workers.dev/api')

export function getApiBase() {
  return API_BASE
}

// Demo fallback: map API paths to curated demo data when in interactive demo mode
const demoFallbacks: [RegExp, (...args: string[]) => any][] = [
  [/^\/songs$/, () => interactiveSongs],
  [/^\/members$/, () => interactiveMembers.map(m => ({
    ...m, membership_type: (m as any).member_type || 'regular',
  }))],
  [/^\/teams$/, () => interactiveTeams],
  [/^\/plans$/, () => interactivePlans.map(p => {
    const { items, ...plan } = p
    return { ...plan, item_count: items.length }
  })],
  [/^\/house-groups$/, () => interactiveHouseGroups],
  [/^\/announcements$/, () => demoAnnouncements],
  [/^\/polls$/, () => demoPolls],
  [/^\/service-types$/, () => demoServiceTypes],
  [/^\/email-templates$/, () => demoEmailTemplates],
  [/^\/plan-templates$/, () => demoPlanTemplates.map(t => {
    const { items, ...rest } = t
    return { ...rest, item_count: items?.length || 0 }
  })],
  [/^\/directory$/, () => interactiveMembers.map(m => ({
    ...m, membership_type: (m as any).member_type || 'regular',
  }))],
  [/^\/stats$/, () => interactiveStats],
  [/^\/attendance-stats/, () => ({
    total: 0, perMember: [], perMonth: [], recent: [],
  })],

  // Single items
  [/^\/songs\/(\d+)$/, (id) => interactiveSongs.find(s => s.id === Number(id)) || interactiveSongs[0]],
  [/^\/members\/(\d+)$/, (id) => {
    const m = interactiveMembers.find(mm => mm.id === Number(id))
    const fallback = m || interactiveMembers[0]
    return { ...fallback, membership_type: (fallback as any).member_type || 'regular' }
  }],
  [/^\/teams\/(\d+)$/, (id) => interactiveTeams.find(t => t.id === Number(id)) || interactiveTeams[0]],
  [/^\/plans\/(\d+)$/, (id) => {
    const plan = interactivePlans.find(p => p.id === Number(id))
    if (!plan) return interactivePlans[0]
    const { items, ...planData } = plan
    return planData
  }],
  [/^\/plans\/(\d+)\/items$/, (id) => {
    const plan = interactivePlans.find(p => p.id === Number(id))
    return plan ? plan.items : []
  }],
  [/^\/plans\/(\d+)\/scheduled-people$/, () => demoTeamMembers],
  [/^\/house-groups\/(\d+)$/, (id) => interactiveHouseGroups.find(g => g.id === Number(id)) || interactiveHouseGroups[0]],
  [/^\/teams\/(\d+)\/members$/, (id) => demoTeamMembers.filter(tm => tm.team_id === Number(id))],
  [/^\/email-templates\/(\d+)$/, (id) => demoEmailTemplates.find(t => t.id === Number(id)) || demoEmailTemplates[0]],
  [/^\/plan-templates\/(\d+)$/, (id) => {
    const t = demoPlanTemplates.find(pt => pt.id === Number(id))
    return t || demoPlanTemplates[0]
  }],
  [/^\/plan-templates\/(\d+)\/items$/, (id) => {
    const t = demoPlanTemplates.find(pt => pt.id === Number(id))
    return t ? t.items : []
  }],
  [/^\/me$/, () => ({
    id: 999, first_name: 'Admin', last_name: 'Démo',
    email: 'admin@cieuxouverts.bzh', role: 'admin',
    membership_type: 'staff',
  })],
]

function getDemoFallback(path: string): any {
  const qIdx = path.indexOf('?')
  const cleanPath = qIdx >= 0 ? path.slice(0, qIdx) : path
  for (const [regex, handler] of demoFallbacks) {
    const match = cleanPath.match(regex)
    if (match) {
      return handler(...match.slice(1))
    }
  }
  return null
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()

  // Demo mode: serve curated demo data for GET requests instead of hitting empty API
  if (isInteractiveView.value && method === 'GET') {
    const fallback = getDemoFallback(path)
    if (fallback !== null) {
      return fallback as T
    }
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) }
  try {
    const activeUser = isInteractiveView.value ? interactiveUser.value : user.value
    if (isInteractiveView.value) {
      headers['x-demo-email'] = activeUser.email
    } else if (activeUser && activeUser.email) {
      headers['x-user-email'] = activeUser.email
    }
    if (import.meta.env.VITE_DEV_AUTH_SECRET) headers['X-Auth-Secret'] = import.meta.env.VITE_DEV_AUTH_SECRET
    if (activeUser && typeof activeUser.getIdToken === 'function') {
      const token = await activeUser.getIdToken(true).catch(() => null)
      if (token) headers['Authorization'] = `Bearer ${token}`
    }
  } catch {}
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    const e = new Error(body.error || res.statusText)
    ;(e as any).status = res.status
    ;(e as any).errorBody = body
    throw e
  }
  return res.json()
}

export const api = {
  getSongs: () => request<Song[]>('/songs'),
  getSong: (id: number) => request<Song>(`/songs/${id}`),
  updateArrangement: (id: number, data: Partial<Arrangement>) =>
    request<Arrangement>(`/arrangements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getMembers: () => request<Member[]>('/members'),
  getMember: (id: number) => request<Member>(`/members/${id}`),
  createMember: (data: Partial<Member>) => request<Member>('/members', { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (id: number, data: Partial<Member>) => request<Member>(`/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMember: (id: number) => request<{ success: boolean }>(`/members/${id}`, { method: 'DELETE' }),

  getTeams: () => request<Team[]>('/teams'),
  getTeam: (id: number) => request<Team>(`/teams/${id}`),
  createTeam: (data: Partial<Team>) => request<Team>('/teams', { method: 'POST', body: JSON.stringify(data) }),
  updateTeam: (id: number, data: Partial<Team>) => request<Team>(`/teams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTeam: (id: number) => request<{ success: boolean }>(`/teams/${id}`, { method: 'DELETE' }),
  addTeamMember: (teamId: number, memberId: number, position?: string) =>
    request<{ success: boolean }>(`/teams/${teamId}/members`, { method: 'POST', body: JSON.stringify({ member_id: memberId, position }) }),
  removeTeamMember: (teamId: number, memberId: number) =>
    request<{ success: boolean }>(`/teams/${teamId}/members/${memberId}`, { method: 'DELETE' }),
  updateTeamMember: (teamId: number, memberId: number, data: { position?: string }) =>
    request<any>(`/teams/${teamId}/members/${memberId}`, { method: 'PUT', body: JSON.stringify(data) }),

  getServiceTypes: () => request<ServiceType[]>('/service-types'),

  getPlans: (month?: number, year?: number) => {
    const params = new URLSearchParams()
    if (month !== undefined) params.set('month', String(month))
    if (year !== undefined) params.set('year', String(year))
    const qs = params.toString()
    return request<Plan[]>(`/plans${qs ? '?' + qs : ''}`)
  },
  getPlan: (id: number) => request<Plan>(`/plans/${id}`),
  createPlan: (data: Partial<Plan>) => request<Plan>('/plans', { method: 'POST', body: JSON.stringify(data) }),
  updatePlan: (id: number, data: Partial<Plan>) => request<Plan>(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlan: (id: number) => request<{ success: boolean }>(`/plans/${id}`, { method: 'DELETE' }),

  getPlanItems: (planId: number) => request<PlanItem[]>(`/plans/${planId}/items`),
  createPlanItem: (planId: number, data: Partial<PlanItem>) =>
    request<PlanItem>(`/plans/${planId}/items`, { method: 'POST', body: JSON.stringify(data) }),
  updatePlanItem: (itemId: number, data: Partial<PlanItem>) =>
    request<PlanItem>(`/plan-items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlanItem: (itemId: number) =>
    request<{ success: boolean }>(`/plan-items/${itemId}`, { method: 'DELETE' }),

  getPlanPeople: (planId: number) => request<ScheduledPerson[]>(`/plans/${planId}/scheduled-people`),
  schedulePerson: (planId: number, data: Partial<ScheduledPerson>) =>
    request<ScheduledPerson>(`/plans/${planId}/scheduled-people`, { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: (planId: number, personId: number, data: Partial<ScheduledPerson>) =>
    request<ScheduledPerson>(`/plans/${planId}/scheduled-people/${personId}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeSchedule: (planId: number, personId: number) =>
    request<{ success: boolean }>(`/plans/${planId}/scheduled-people/${personId}`, { method: 'DELETE' }),

  // Attendances (Check-in)
  getAttendances: () => request<Attendance[]>('/attendances'),
  createAttendance: (data: Partial<Attendance>) => request<Attendance>('/attendances', { method: 'POST', body: JSON.stringify(data) }),
  getAttendance: (id: number) => request<Attendance>(`/attendances/${id}`),
  updateAttendance: (id: number, data: Partial<Attendance>) => request<Attendance>(`/attendances/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAttendance: (id: number) => request<{ success: boolean }>(`/attendances/${id}`, { method: 'DELETE' }),
  getPlanAttendances: (planId: number) => request<Attendance[]>(`/plans/${planId}/attendances`),

  // House Groups
  getHouseGroups: () => request<HouseGroup[]>('/house-groups'),
  createHouseGroup: (data: Partial<HouseGroup>) => request<HouseGroup>('/house-groups', { method: 'POST', body: JSON.stringify(data) }),
  getHouseGroup: (id: number) => request<HouseGroup>(`/house-groups/${id}`),
  updateHouseGroup: (id: number, data: Partial<HouseGroup>) => request<HouseGroup>(`/house-groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHouseGroup: (id: number) => request<{ success: boolean }>(`/house-groups/${id}`, { method: 'DELETE' }),
  addGroupMember: (groupId: number, data: { member_id: number; role?: string }) =>
    request<{ success: boolean }>(`/house-groups/${groupId}/members`, { method: 'POST', body: JSON.stringify(data) }),
  removeGroupMember: (groupId: number, memberId: number) =>
    request<{ success: boolean }>(`/house-groups/${groupId}/members/${memberId}`, { method: 'DELETE' }),
  addGroupMeeting: (groupId: number, data: { date: string; notes?: string }) =>
    request<{ success: boolean }>(`/house-groups/${groupId}/meetings`, { method: 'POST', body: JSON.stringify(data) }),

  // Email Templates
  getEmailTemplates: () => request<EmailTemplate[]>('/email-templates'),
  createEmailTemplate: (data: Partial<EmailTemplate>) => request<EmailTemplate>('/email-templates', { method: 'POST', body: JSON.stringify(data) }),
  getEmailTemplate: (id: number) => request<EmailTemplate>(`/email-templates/${id}`),
  updateEmailTemplate: (id: number, data: Partial<EmailTemplate>) => request<EmailTemplate>(`/email-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmailTemplate: (id: number) => request<{ success: boolean }>(`/email-templates/${id}`, { method: 'DELETE' }),
  createEmailLog: (data: Partial<EmailLog>) => request<EmailLog>('/email-logs', { method: 'POST', body: JSON.stringify(data) }),
  getEmailLogs: () => request<EmailLog[]>('/email-logs'),
  // Member exceptions admin
  getMemberExceptions: () => request<any[]>('/member-exceptions'),
  createMemberException: (data: { member_id: number; permission: string; granted: boolean }) => request<any>('/member-exceptions', { method: 'POST', body: JSON.stringify(data) }),
  deleteMemberException: (id: number) => request<any>(`/member-exceptions/${id}`, { method: 'DELETE' }),
  updateMemberRole: (id: number, data: { role: string }) => request<any>(`/members/${id}/role`, { method: 'PUT', body: JSON.stringify(data) }),
  getConflictLogs: (planId?: number, page?: number, per?: number, member?: string) => {
    const params = new URLSearchParams()
    if (planId) params.set('plan_id', String(planId))
    if (page) params.set('page', String(page))
    if (per) params.set('per', String(per))
    if (member) params.set('member', member)
    const qs = params.toString()
    return request<any[]>(`/scheduled-conflict-logs${qs ? '?' + qs : ''}`)
  },
  getCommunicationPreferences: (memberId: number) => request<any>(`/communication-preferences/${memberId}`),
  updateCommunicationPreferences: (data: any) => request<any>('/communication-preferences', { method: 'POST', body: JSON.stringify(data) }),
  sendEmail: (data: { recipient_email: string; subject: string; body: string; template_id?: number; recipient_member_id?: number }) =>
    request<{ success: boolean; status: string }>('/send-email', { method: 'POST', body: JSON.stringify(data) }),
  sendOneClick: (token: string) => request<any>('/oneclick', { method: 'POST', body: JSON.stringify({ token }) }),

  // Member Portal (self-service)
  getMe: () => request<any>('/me'),
  updateMe: (data: { phone?: string; notes?: string; birth_date?: string }) =>
    request<any>('/me', { method: 'PUT', body: JSON.stringify(data) }),
  getMySchedule: () => request<any[]>('/me/schedule'),

  // Volunteer Preferences
  getVolunteerPreferences: (memberId: number) => request<VolunteerPreferences>(`/volunteer-preferences/${memberId}`),
  updateVolunteerPreferences: (memberId: number, data: Partial<VolunteerPreferences>) =>
    request<VolunteerPreferences>(`/volunteer-preferences/${memberId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Plan Templates
  getPlanTemplates: () => request<PlanTemplate[]>('/plan-templates'),
  createPlanTemplate: (data: Partial<PlanTemplate>) => request<PlanTemplate>('/plan-templates', { method: 'POST', body: JSON.stringify(data) }),
  getPlanTemplate: (id: number) => request<PlanTemplate>(`/plan-templates/${id}`),
  updatePlanTemplate: (id: number, data: Partial<PlanTemplate>) => request<PlanTemplate>(`/plan-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlanTemplate: (id: number) => request<{ success: boolean }>(`/plan-templates/${id}`, { method: 'DELETE' }),
  getPlanTemplateItems: (id: number) => request<PlanTemplateItem[]>(`/plan-templates/${id}/items`),
  createPlanTemplateItem: (templateId: number, data: Partial<PlanTemplateItem>) =>
    request<PlanTemplateItem>(`/plan-templates/${templateId}/items`, { method: 'POST', body: JSON.stringify(data) }),
  updatePlanTemplateItem: (itemId: number, data: Partial<PlanTemplateItem>) =>
    request<PlanTemplateItem>(`/plan-template-items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlanTemplateItem: (itemId: number) => request<{ success: boolean }>(`/plan-template-items/${itemId}`, { method: 'DELETE' }),
  applyPlanTemplate: (templateId: number, data: { date: string; time?: string; theme?: string; notes?: string }) =>
    request<Plan>(`/plan-templates/${templateId}/apply`, { method: 'POST', body: JSON.stringify(data) }),

  // Stats
  getStats: () => request<{
    members: number; activeMembers: number; upcomingPlans: number;
    songsWithArrangements: number; pendingConfirmations: number; teams: number;
  }>('/stats'),

  // Bulk email
  sendBulkEmail: (data: { subject: string; body: string; team_id?: number; plan_id?: number; member_ids?: number[] }) =>
    request<{ sent: number; failed: number; errors: string[] }>('/send-bulk-email', { method: 'POST', body: JSON.stringify(data) }),

  // FCM Notifications
  registerFCMToken: (memberId: number, token: string, deviceType?: string) =>
    request<{ success: boolean }>('/fcm/register', { method: 'POST', body: JSON.stringify({ member_id: memberId, token, device_type: deviceType || 'web' }) }),
  sendFCMNotification: (data: { member_id?: number; plan_id?: number; tokens?: string[]; title: string; message: string }) =>
    request<{ success: boolean; sent: number; failed: number }>('/fcm/send', { method: 'POST', body: JSON.stringify(data) }),

  // Annotations
  getArrangementAnnotations: (arrangementId: number) => request<any[]>(`/arrangements/${arrangementId}/annotations`),
  createAnnotation: (arrangementId: number, data: { content: string; is_shared?: boolean }) =>
    request<any>(`/arrangements/${arrangementId}/annotations`, { method: 'POST', body: JSON.stringify(data) }),
  updateAnnotation: (id: number, data: { content?: string; is_shared?: boolean }) =>
    request<any>(`/annotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnotation: (id: number) => request<{ success: boolean }>(`/annotations/${id}`, { method: 'DELETE' }),

  // Resource Permissions (RBAC)
  getResourcePermissions: () => request<any[]>('/resource-permissions'),
  createResourcePermission: (data: { member_id: number; resource_type: string; resource_id: number; permission: string; granted?: boolean }) =>
    request<any>('/resource-permissions', { method: 'POST', body: JSON.stringify(data) }),
  deleteResourcePermission: (id: number) => request<{ success: boolean }>(`/resource-permissions/${id}`, { method: 'DELETE' }),

  // Media (Attachments)
  getArrangementMedia: (arrangementId: number) => request<Attachment[]>(`/arrangements/${arrangementId}/media`),
  addArrangementMedia: (arrangementId: number, data: { file_url: string; filename: string; file_type?: string }) =>
    request<Attachment>(`/arrangements/${arrangementId}/media`, { method: 'POST', body: JSON.stringify(data) }),
  deleteAttachment: (id: number) => request<{ success: boolean }>(`/attachments/${id}`, { method: 'DELETE' }),

  // Push notifications - register service worker token
  registerForPush: async (memberId: number) => {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return
    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return
    }
    // Register or find existing SW
    const reg = await navigator.serviceWorker.register('/sw.js')
    // We use FCM directly via the API, no need for VAPID keys
    return reg
  },

  // Invitations
  getInvitation: (token: string) => request<any>(`/invitations/${token}`),
  redeemInvitation: (token: string, firebaseUid: string) =>
    request<any>(`/invitations/${token}/redeem`, { method: 'POST', body: JSON.stringify({ firebase_uid: firebaseUid }) }),
  createInvitation: (email: string) =>
    request<any>('/invitations', { method: 'POST', body: JSON.stringify({ email }) }),

  // Attendance stats
  getAttendanceStats: (year?: string) => {
    const params = year ? `?year=${year}` : ''
    return request<any>(`/attendance-stats${params}`)
  },

  // Firebase link status
  getFirebaseStatus: () => request<any>('/me/firebase-status'),

  // iCal export
  getPlanIcalUrl: (planId: number) => `${API_BASE}/plans/${planId}/ical`,

  // Directory (annuaire)
  getDirectory: () => request<any[]>('/directory'),

  // Messages
  getInbox: () => request<any[]>('/messages/inbox'),
  getMessage: (id: number) => request<any>(`/messages/${id}`),
  sendMessage: (data: { subject?: string; content: string; recipients: number[] }) => request<any>('/messages', { method: 'POST', body: JSON.stringify(data) }),
  markMessageRead: (id: number) => request<any>(`/messages/${id}/read`, { method: 'POST' }),

  // Checklist templates
  getChecklistTemplates: (serviceTypeId?: number) => {
    const params = serviceTypeId ? `?service_type_id=${serviceTypeId}` : ''
    return request<any[]>(`/checklist-templates${params}`)
  },
  createChecklistTemplate: (data: { service_type_id?: number; position: string; label: string }) =>
    request<any>('/checklist-templates', { method: 'POST', body: JSON.stringify(data) }),
  deleteChecklistTemplate: (id: number) =>
    request<{ success: boolean }>(`/checklist-templates/${id}`, { method: 'DELETE' }),
  addChecklistTemplateItem: (checklistId: number, data: { label: string; position?: number }) =>
    request<any>(`/checklist-templates/${checklistId}/items`, { method: 'POST', body: JSON.stringify(data) }),
  deleteChecklistTemplateItem: (id: number) =>
    request<{ success: boolean }>(`/checklist-template-items/${id}`, { method: 'DELETE' }),

  // Plan checklists
  getPlanChecklist: (planId: number) => request<any[]>(`/plans/${planId}/checklist`),
  addPlanChecklistItem: (planId: number, data: { position: string; label: string; member_id?: number }) =>
    request<any>(`/plans/${planId}/checklist`, { method: 'POST', body: JSON.stringify(data) }),
  updatePlanChecklist: (id: number, data: { done: boolean }) =>
    request<any>(`/plan-checklists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlanChecklist: (id: number) =>
    request<{ success: boolean }>(`/plan-checklists/${id}`, { method: 'DELETE' }),

  // Sermon audio
  getPlanAudio: (planId: number) => request<{ audio_url: string | null; audio_title: string | null; attachments: any[] }>(`/plans/${planId}/audio`),
  uploadPlanAudio: async (planId: number, file: File, title: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    const headers: Record<string, string> = {}
    try {
      if (user.value && user.value.email) headers['x-user-email'] = user.value.email
      if (user.value && typeof user.value.getIdToken === 'function') {
        const token = await user.value.getIdToken(true).catch(() => null)
        if (token) headers['Authorization'] = `Bearer ${token}`
      }
    } catch {}
    const res = await fetch(`${API_BASE}/plans/${planId}/audio`, { method: 'POST', headers, body: formData })
    if (!res.ok) { const e = new Error((await res.json().catch(() => ({ error: res.statusText }))).error); throw e }
    return res.json()
  },
  deletePlanAudio: (planId: number) => request<{ success: boolean }>(`/plans/${planId}/audio`, { method: 'DELETE' }),

  getAudioSegments: (planId: number) => request<{ segments: any[]; songs: any[] }>(`/plans/${planId}/audio-segments`),

  // Replacements
  getReplacements: (planId: number, scheduledId: number) =>
    request<any[]>(`/plans/${planId}/replacements/${scheduledId}`),
  applyReplacement: (planId: number, scheduledId: number, newMemberId: number) =>
    request<any>(`/plans/${planId}/replacements/${scheduledId}`, { method: 'POST', body: JSON.stringify({ new_member_id: newMemberId }) }),

  getPolls: () => request<any[]>('/polls'),
  createPoll: (data: { question: string; max_votes?: number }) =>
    request<any>('/polls', { method: 'POST', body: JSON.stringify(data) }),
  deletePoll: (id: number) => request<{ success: boolean }>(`/polls/${id}`, { method: 'DELETE' }),
  createPollOption: (pollId: number, label: string) =>
    request<any>(`/polls/${pollId}/options`, { method: 'POST', body: JSON.stringify({ label }) }),
  deletePollOption: (id: number) =>
    request<{ success: boolean }>(`/poll-options/${id}`, { method: 'DELETE' }),
  createVote: (pollId: number, optionId: number) =>
    request<any>(`/polls/${pollId}/vote`, { method: 'POST', body: JSON.stringify({ option_id: optionId }) }),
  deleteVote: (pollId: number, optionId: number) =>
    request<any>(`/polls/${pollId}/vote`, { method: 'DELETE', body: JSON.stringify({ option_id: optionId }) }),

  getAnnouncements: (type?: string) => {
    const params = type ? `?type=${type}` : ''
    return request<any[]>(`/announcements${params}`)
  },
  createAnnouncement: (data: { type: string; content: string; plan_id?: number }) =>
    request<any>('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  updateAnnouncement: (id: number, data: { content: string; type?: string }) =>
    request<any>(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnouncement: (id: number) =>
    request<{ success: boolean }>(`/announcements/${id}`, { method: 'DELETE' }),

  // Church Events (external scraped events)
  getChurchEvents: (source?: string, includeExceptions?: boolean) => {
    const params = new URLSearchParams()
    if (source) params.set('source', source)
    if (includeExceptions) params.set('include_exceptions', '1')
    const qs = params.toString()
    return request<any[]>(`/church-events${qs ? '?' + qs : ''}`)
  },
  getChurchEvent: (id: number) => request<any>(`/church-events/${id}`),
  updateChurchEvent: (id: number, data: Partial<any>) =>
    request<any>(`/church-events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getChurchEventExceptions: (id: number) => request<any[]>(`/church-events/${id}/exceptions`),
  createChurchEventException: (id: number, data: { type: string; exception_date?: string; new_date?: string; new_repeat_period?: string; reason?: string }) =>
    request<any>(`/church-events/${id}/exceptions`, { method: 'POST', body: JSON.stringify(data) }),
  deleteChurchEventException: (id: number, exceptionId: number) =>
    request<any>(`/church-events/${id}/exceptions/${exceptionId}`, { method: 'DELETE' }),

  // PCO Sync
  syncPCO: () => request<any>('/pco-sync', { method: 'POST' }),

  // Webhooks
  getWebhooks: () => request<any[]>('/webhooks'),
  createWebhook: (data: { url: string; events: string[]; label?: string; secret?: string }) =>
    request<any>('/webhooks', { method: 'POST', body: JSON.stringify(data) }),
  updateWebhook: (id: number, data: any) =>
    request<any>(`/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWebhook: (id: number) =>
    request<{ success: boolean }>(`/webhooks/${id}`, { method: 'DELETE' }),
  getWebhookLogs: () => request<any[]>('/webhook-logs'),

  exportCsv: (entity: string) => {
    const base = import.meta.env.VITE_API_BASE || 'https://eglise-app.belletonv.workers.dev/api'
    return `${base}/export/${entity}`
  },
  importCsv: async (entity: string, csvContent: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'text/csv' }
    try {
      const { user } = await import('../stores/auth')
      if (user.value && user.value.email) headers['x-user-email'] = user.value.email
    } catch {}
    const base = import.meta.env.VITE_API_BASE || 'https://eglise-app.belletonv.workers.dev/api'
    const res = await fetch(`${base}/import/${entity}`, { method: 'POST', headers, body: csvContent })
    if (!res.ok) { const e = new Error((await res.json().catch(() => ({ error: res.statusText }))).error); throw e }
    return res.json()
  },
}
