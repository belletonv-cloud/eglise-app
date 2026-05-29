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
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

// Helper pour dates dynamiques (mois courant)
const _now = new Date();
const _y = _now.getFullYear();
const _m = String(_now.getMonth() + 1).padStart(2, '0');
const _d = (day: number) => `${_y}-${_m}-${String(day).padStart(2, '0')}`;
const _nextMonth = _now.getMonth() + 1 > 11 ? 0 : _now.getMonth() + 1;
const _y2 = _now.getMonth() + 1 > 11 ? _y + 1 : _y;
const _m2 = String(_nextMonth + 1).padStart(2, '0');

export const api: any = {
  // Plans & Events
  async getPlans(...args: any[]) {
    return [
      { id: 1, title: 'Culte du dimanche', date: _d(1), time: '10:00', theme: 'Louange', attendance_count: 5, service_type_id: 1, service_type_name: 'Culte' },
      { id: 2, title: 'Groupe de jeunes', date: _d(8), time: '14:00', theme: 'Enseignement', attendance_count: 3, service_type_id: 2, service_type_name: 'Jeunes' },
      { id: 3, title: 'Étude biblique', date: _d(15), time: '18:30', theme: 'Prière', attendance_count: 4, service_type_id: 3, service_type_name: 'Étude' },
    ];
  },
  async getPlan(...args: any[]) { return { id: 1, title: 'Culte du dimanche', date: _d(1), items: [{ id: 1, name: 'Chant d\'ouverture', type: 'song', key: 'C', chord_chart: 'Am C G', media: [], arrangement_id: 1 }] }; },
  async getPlanItems(...args: any[]) { return [{ id: 1, title: 'Chant d\'ouverture', name: 'Chant d\'ouverture', type: 'song', key: 'C', chord_chart: 'Am C G', media: [], arrangement_id: 1 }]; },
  async createPlan(...args: any[]) { return { id: 4, title: 'Nouveau plan' }; },
  async updatePlan(...args: any[]) { return { id: 1, title: 'Plan modifié' }; },
  async deletePlan(...args: any[]) { return { success: true }; },
  async createPlanItem(...args: any[]) { return { id: 3, title: 'New item' }; },
  async updatePlanItem(...args: any[]) { return { id: 1, title: 'Updated item' }; },
  async deletePlanItem(...args: any[]) { return { success: true }; },
  async applyPlanTemplate(...args: any[]) { return { applied: true, id: 1 }; },
  async getEvents(...args: any[]) { return [{ id: 1, name: 'Soirée louange', date: _d(15), status: 'confirmed', repeat_period: 'none', start_date: _d(15), time: '19:00' }]; },

  // Songs
  async getSongs(...args: any[]) { return [{ id: 1, title: 'Mock song', arrangements: [{ id: 1, key: 'C', tempo: 120 }], arrangement_count: 3 }]; },
  async getSong(...args: any[]) { return { id: 1, title: 'Mock song', arrangements: [{ id: 1, name: 'Original', key: 'C', tempo: 120, chord_chart: 'Am C G' }] }; },
  async updateSong(...args: any[]) { return { id: 1, title: 'Edited song' }; },
  async createSong(...args: any[]) { return { id: 2, title: 'New song' }; },
  async deleteSong(...args: any[]) { return { deleted: true }; },

  // Arrangements & Checklist
  async getArrangementMedia(...args: any[]) { return [{ url: 'mock.mp3', type: 'audio' }]; },
  async getArrangementAnnotations(...args: any[]) { return [{ text: 'Note', author: 'User', id: 1 }]; },
  async createAnnotation(...args: any[]) { return { id: 2, text: 'Ajouté' }; },
  async updateAnnotation(...args: any[]) { return { id: 1, text: 'Edité' }; },
  async deleteAnnotation(...args: any[]) { return { deleted: true }; },
  async getPlanChecklist(...args: any[]) { return [{ id: 1, label: 'Préparer la sonorisation', checked: false, position: 0 }]; },
  async getChecklistTemplates(...args: any[]) { return [{ id: 1, name: 'Checklist type', items: [{ id: 1, label: 'Vérifier micros', position: 0 }] }]; },
  async addPlanChecklistItem(...args: any[]) { return { id: 2, label: 'Ajouté', checked: false }; },
  async updatePlanChecklist(...args: any[]) { return { id: 1, label: 'Modifié' }; },
  async deletePlanChecklist(...args: any[]) { return { deleted: true }; },

  // Members & Teams
  async getMembers(...args: any[]) { return [{ id: 1, first_name: 'Jean', last_name: 'Dupont', email: 'jean@eglise.tld', phone: '0601020304', teams: [{ id: 1, name: 'Louange' }] }]; },
  async getMember(...args: any[]) { return { id: 1, first_name: 'Jean', last_name: 'Dupont', email: 'jean@eglise.tld', teams: [{ id: 1, name: 'Louange' }] }; },
  async createMember(...args: any[]) { return { id: 2, first_name: 'Nouveau', last_name: 'Membre' }; },
  async updateMember(...args: any[]) { return { id: 1, first_name: 'Modifié', last_name: 'Utilisateur' }; },
  async deleteMember(...args: any[]) { return { deleted: true }; },
  async getTeams(...args: any[]) { return [{ id: 1, name: 'Louange', members: [{ id: 1, first_name: 'Jean', last_name: 'Dupont' }] }, { id: 2, name: 'Sonorisation', members: [] }]; },
  async getTeam(...args: any[]) { return { id: 1, name: 'Louange', members: [{ id: 1, first_name: 'Jean', last_name: 'Dupont' }] }; },
  async createTeam(...args: any[]) { return { id: 3, name: 'Nouvelle équipe' }; },
  async updateTeam(...args: any[]) { return { id: 1, name: 'Louange modifiée' }; },
  async deleteTeam(...args: any[]) { return { deleted: true }; },
  async addTeamMember(...args: any[]) { return { id: 1, memberId: 1 }; },
  async removeTeamMember(...args: any[]) { return { removed: true }; },
  async searchMembers(...args: any[]) { return [{ id: 1, first_name: 'Jean', last_name: 'Dupont' }]; },

  // Attendance
  async getPlanAttendances(...args: any[]) { return [{ id: 1, plan_id: 1, member_id: 1, checked_in_at: new Date().toISOString(), status: 'present', check_in_time: '10:00', first_name: 'Jean', last_name: 'Dupont', member: { first_name: 'Jean', last_name: 'Dupont' } }]; },
  async createAttendance(...args: any[]) { return { id: 2, status: 'created' }; },
  async deleteAttendance(...args: any[]) { return { deleted: true }; },

  // Directory / House Groups / Church Events
  async getDirectory(...args: any[]) { return [{ id: 1, first_name: 'Jean', last_name: 'Dupont', email: 'jean@eglise.tld' }]; },
  async getHouseGroup(...args: any[]) { return { id: 1, name: 'Groupe maison Centre', members: [{ id: 1, first_name: 'Jean', last_name: 'Dupont' }] }; },
  async getHouseGroups(...args: any[]) { return [{ id: 1, name: 'Groupe maison Centre', members: [{ id: 1, first_name: 'Jean', last_name: 'Dupont' }] }, { id: 2, name: 'Groupe maison Nord', members: [] }]; },
  async createHouseGroup(...args: any[]) { return { id: 3, name: 'Nouveau groupe' }; },
  async updateHouseGroup(...args: any[]) { return { id: 1, name: 'Groupe modifié' }; },
  async deleteHouseGroup(...args: any[]) { return { deleted: true }; },
  async addGroupMember(...args: any[]) { return { id: 1, groupId: 1, memberId: 2 }; },
  async removeGroupMember(...args: any[]) { return { removed: true }; },
  async addGroupMeeting(...args: any[]) { return { id: 1, date: _d(10) }; },
  async getChurchEvents(...args: any[]) { return [{ id: 1, name: 'Culte régional', date: _d(22), status: 'scheduled', repeat_period: 'monthly', start_date: _d(22) }]; },
  async createChurchEvent(...args: any[]) { return { id: 2, name: 'Nouvel événement' }; },
  async updateChurchEvent(...args: any[]) { return { id: 1, name: 'Événement modifié' }; },
  async deleteChurchEvent(...args: any[]) { return { deleted: true }; },
  async createChurchEventException(...args: any[]) { return { id: 1, eventId: 1, date: _d(23) }; },

  // Checkins
  async getPlanAudio(...args: any[]) { return [{ url: 'mock.mp3', type: 'audio' }]; },
  async getPlanPeople(...args: any[]) { return [{ id: 1, first_name: 'Jean', last_name: 'Dupont' }]; },
  async generateQRCode(...args: any[]) { return { qr: 'data:image/png;base64,mock' }; },
  async getCheckinSettings(...args: any[]) { return { enabled: true }; },
  async updateCheckinSettings(...args: any[]) { return { enabled: true }; },

  // Announcements
  async getAnnouncements(...args: any[]) { return [{ id: 1, title: 'Annonce importante', content: 'Réunion ce dimanche après le culte', created_at: _d(1) }]; },
  async createAnnouncement(...args: any[]) { return { id: 2, title: 'Nouvelle annonce', content: '' }; },
  async updateAnnouncement(...args: any[]) { return { id: 1, title: 'Annonce modifiée' }; },
  async deleteAnnouncement(...args: any[]) { return { deleted: true }; },

  // Polls / Votes
  async getPolls(...args: any[]) { return [{ id: 1, question: 'Quel jour pour la sortie ?', options: [{ id: 1, text: 'Samedi', votes: 3 }, { id: 2, text: 'Dimanche', votes: 5 }] }]; },
  async createPoll(...args: any[]) { return { id: 2, question: 'Nouveau sondage' }; },
  async deletePoll(...args: any[]) { return { deleted: true }; },
  async votePoll(...args: any[]) { return { voted: true }; },
  async deleteVote(...args: any[]) { return { deleted: true }; },

  // Invitations
  async getInvitation(...args: any[]) { return { id: 1, email: 'invite@eglise.tld', status: 'pending' }; },
  async createInvitation(...args: any[]) { return { id: 2, email: 'new@eglise.tld', status: 'pending' }; },
  async deleteInvitation(...args: any[]) { return { deleted: true }; },

  // Email / Notifications / Webhooks
  async registerFCMToken(...args: any[]) { return { registered: true }; },
  async getEmailTemplates(...args: any[]) { return [{ id: 1, name: 'Bienvenue', subject: 'Bienvenue à l\'église' }]; },
  async createEmailTemplate(...args: any[]) { return { id: 2, name: 'Nouveau template', subject: 'Sujet' }; },
  async deleteEmailTemplate(...args: any[]) { return { deleted: true }; },
  async getEmailLogs(...args: any[]) { return [{ id: 1, status: 'sent', to: 'test@eglise.tld' }]; },
  async sendEmail(...args: any[]) { return { success: true, messageId: 'mock' }; },
  async sendBulkEmail(...args: any[]) { return { success: true, count: 1, failed: 0, errors: [], sent: 1 }; },
  async getWebhooks(...args: any[]) { return [{ id: 1, url: 'https://hook.example.com/' }]; },
  async createWebhook(...args: any[]) { return { id: 2, url: 'https://newhook.example.com/' }; },
  async deleteWebhook(...args: any[]) { return { deleted: true }; },
  async syncPCO(...args: any[]) { return { synced: true, results: { imported: 5, updated: 3, errors: [] } }; },
  async getNotifications(...args: any[]) { return [{ id: 1, message: 'Bienvenue !', read: false }]; },
  async markNotificationRead(...args: any[]) { return { read: true }; },

  // Plan Templates
  async getPlanTemplates(...args: any[]) { return [{ id: 1, name: 'Culte type', description: 'Culte dominical standard', items: [{ id: 1, name: 'Louange', position: 0, key: 'C', chord_chart: '', media: [] }] }]; },
  async createPlanTemplate(...args: any[]) { return { id: 2, name: 'Nouveau template', items: [] }; },
  async updatePlanTemplate(...args: any[]) { return { id: 1, name: 'Template modifié', items: [] }; },
  async deletePlanTemplate(...args: any[]) { return { deleted: true }; },
  async createPlanTemplateItem(...args: any[]) { return { id: 3, name: 'New template item' }; },
  async updatePlanTemplateItem(...args: any[]) { return { id: 1, name: 'Updated template item' }; },
  async deletePlanTemplateItem(...args: any[]) { return { deleted: true }; },

  // Schedule
  async updateSchedule(...args: any[]) { return { updated: true }; },
  async schedulePerson(...args: any[]) { return { scheduled: true }; },
  async removeSchedule(...args: any[]) { return { removed: true }; },
  async getReplacements(...args: any[]) { return [{ id: 1, name: 'Marie Remplacement' }]; },
  async applyReplacement(...args: any[]) { return { applied: true }; },
  async updateTeamMember(...args: any[]) { return { updated: true }; },

  // Me / Account
  async getMe(...args: any[]) { return { id: 1, first_name: 'Admin', last_name: 'Demo', email: 'admin@demo.church', phone: '+33600000000', notes: 'Compte démo', birth_date: '1990-01-01' }; },
  async getMySchedule(...args: any[]) { return [{ id: 1, planId: 1, role: 'music' }]; },
  async updateMe(...args: any[]) { return { id: 1, first_name: 'Updated' }; },
  async getMemberAvailability(...args: any[]) { return { available: true }; },
  async updateMemberAvailability(...args: any[]) { return { updated: true }; },

  // Invitations
  async redeemInvitation(...args: any[]) { return { redeemed: true }; },

  // Audio / Sermons
  async getAudioSegments(...args: any[]) { return { segments: [{ start: 0, end: 10, label: 'Intro' }], songs: [], duration_seconds: 120 }; },
  async uploadPlanAudio(...args: any[]) { return { url: 'mock.mp3', audio_splitter: { status: 'ready' } }; },
  async deleteAttachment(...args: any[]) { return { deleted: true }; },

  // Voting (sondages)
  async createVote(...args: any[]) { return { voted: true }; },
  async createPollOption(...args: any[]) { return { id: 1, text: 'Option' }; },

  // Plan Templates (singular)
  async getPlanTemplate(...args: any[]) { return { id: 1, name: 'Culte type', description: 'Standard', items: [{ id: 1, name: 'Louange', key: 'C', chord_chart: '', media: [] }] }; },
  async getPlanTemplateItems(...args: any[]) { return [{ id: 1, name: 'Louange' }]; },
  async updateArrangement(...args: any[]) { return { id: 1, name: 'Arrangement modifié' }; },
  async getFeed(...args: any[]) { return [{ id: 1, action: 'created', target: 'plan' }]; },
  async postToFeed(...args: any[]) { return { id: 2, posted: true }; },

  // Roles / Permissions
  async getRoles(...args: any[]) { return [{ id: 1, name: 'admin', permissions: ['all'] }]; },
  async updateRole(...args: any[]) { return { updated: true }; },

  // Backup / Audit
  async getBackupStatus(...args: any[]) { return { lastBackup: _d(1), status: 'ok' }; },
  async createBackup(...args: any[]) { return { created: true }; },
  async getAuditLogs(...args: any[]) { return [{ id: 1, action: 'update', user: 'admin' }]; },

  // Files
  async uploadFile(...args: any[]) { return { url: 'https://mock.upload/file.pdf', name: 'file.pdf' }; },
  async deleteFile(...args: any[]) { return { deleted: true }; },

  // Misc
  async getStats(...args: any[]) { return { members: 25, activeMembers: 18, upcomingPlans: 3, songsWithArrangements: 20, pendingConfirmations: 2, teams: 5 }; },
  async getAttendanceStats(...args: any[]) { return { total: 45, perMember: [], perMonth: [{ month: _m, count: 12 }], recent: [] }; },
  async getVolunteerPreferences(...args: any[]) { return { available: true, max_services_per_month: 4, notes: '', unavailable_dates: [] as string[] }; },
  async updateVolunteerPreferences(...args: any[]) { return { updated: true }; },
  async getInbox(...args: any[]) { return [{ id: 1, title: 'Bienvenue dans l\'app', unread: 1 }]; },
  async getMessage(...args: any[]) { return { id: 1, text: 'Message de bienvenue', read: false }; },
  async markMessageRead(...args: any[]) { return { read: true }; },
  async sendMessage(...args: any[]) { return { sent: true }; },
  async getConflictLogs(...args: any[]) { return [{ id: 1, message: 'Conflit de planning' }]; },
  async getSongMedia(...args: any[]) { return [{ url: 'mock.mp3' }]; },
  async getSongArrangements(...args: any[]) { return [{ id: 1, name: 'Arrangement', chart: 'Am C G' }]; },
  async getServiceTypes(...args: any[]) { return [{ id: 1, name: 'Culte' }, { id: 2, name: 'Jeunes' }, { id: 3, name: 'Étude' }]; },
  async getActivityFeed(...args: any[]) { return [{ id: 1, action: 'created', target: 'plan' }]; },
  async getMembersDirectory(...args: any[]) { return [{ id: 1, first_name: 'Jean', last_name: 'Dupont' }]; },
  async exportData(...args: any[]) { return { csv: 'id,name\n1,Jean' }; },
  async importData(...args: any[]) { return { imported: 5 }; },
  async getPlansByDate(...args: any[]) {
    return [
      { id: 1, title: 'Culte du dimanche', date: _d(1), time: '10:00' },
      { id: 2, title: 'Groupe de jeunes', date: _d(8), time: '14:00' },
    ];
  },
};

export default api;
