import type { Song, Arrangement, Member, Team, Plan, PlanItem, ServiceType, ScheduledPerson, Attendance, HouseGroup, EmailTemplate, EmailLog, Attachment } from './types'
import { user } from '../stores/auth'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://eglise-app.belletonv.workers.dev/api'

export function getApiBase() {
  return API_BASE
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) }
  try {
    if (user.value && user.value.email) headers['x-user-email'] = user.value.email
    // Try to attach Firebase ID token for robust server-side auth
    if (user.value && typeof user.value.getIdToken === 'function') {
      const token = await user.value.getIdToken(true).catch(() => null)
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

  // FCM Notifications
  registerFCMToken: (memberId: number, token: string, deviceType?: string) =>
    request<{ success: boolean }>('/fcm/register', { method: 'POST', body: JSON.stringify({ member_id: memberId, token, device_type: deviceType || 'web' }) }),
  sendFCMNotification: (data: { member_id?: number; plan_id?: number; tokens?: string[]; title: string; message: string }) =>
    request<{ success: boolean; sent: number; failed: number }>('/fcm/send', { method: 'POST', body: JSON.stringify(data) }),

  // Media (Attachments)
  getArrangementMedia: (arrangementId: number) => request<Attachment[]>(`/arrangements/${arrangementId}/media`),
  addArrangementMedia: (arrangementId: number, data: { file_url: string; filename: string; file_type?: string }) =>
    request<Attachment>(`/arrangements/${arrangementId}/media`, { method: 'POST', body: JSON.stringify(data) }),
  deleteAttachment: (id: number) => request<{ success: boolean }>(`/attachments/${id}`, { method: 'DELETE' }),
}
