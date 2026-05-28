// src/utils/api.ts

declare global {
  var __API_BASE__: string | undefined;
}
globalThis.__API_BASE__ = globalThis.__API_BASE__ || 'https://eglise-app.belletonv.workers.dev';

export function getApiBase(): string {
  return globalThis.__API_BASE__ || 'https://eglise-app.belletonv.workers.dev';
}

export const api: any = {
  // Plans & Events
  async getPlans(...args: any[]) { return [{ id: 1, title: 'Plan mock', date: '2023-01-01', time: '10:00', theme: 'Louange', attendance_count: 0, service_type_id: 1, service_type_name: 'Culte' }]; },
  async getPlan(...args: any[]) { return { id: 1, title: 'Plan mock', items: [{ id: 1, name: 'Item mock', key: 'C', chord_chart: '', media: [] }] }; },
  async getPlanItems(...args: any[]) { return [{ id: 1, title: 'Item mock', name: 'Item mock', key: 'C', chord_chart: '', media: [] }]; },
  async createPlan(...args: any[]) { return { id: 2, title: 'Nouveau plan' }; },
  async updatePlan(...args: any[]) { return { id: 1, title: 'Plan modifié' }; },
  async deletePlan(...args: any[]) { return { success: true }; },
  async createPlanItem(...args: any[]) { return { id: 3, title: 'New item' }; },
  async updatePlanItem(...args: any[]) { return { id: 1, title: 'Updated item' }; },
  async deletePlanItem(...args: any[]) { return { success: true }; },
  async applyPlanTemplate(...args: any[]) { return { applied: true, id: 1 }; },
  async getEvents(...args: any[]) { return [{ id: 1, name: 'Event', date: '2023-05-01', status: 'confirmed', repeat_period: 'none', start_date: '2023-05-01', time: '10:00' }]; },

  // Songs
  async getSongs(...args: any[]) { return [{ id: 1, title: 'Mock song', arrangements: [] }]; },
  async getSong(...args: any[]) { return { id: 1, title: 'Mock song', arrangements: [] }; },
  async updateSong(...args: any[]) { return { id: 1, title: 'Edited song' }; },
  async createSong(...args: any[]) { return { id: 2, title: 'New song' }; },
  async deleteSong(...args: any[]) { return { deleted: true }; },

  // Arrangements & Checklist
  async getArrangementMedia(...args: any[]) { return [{ url: 'mock.mp3', type: 'audio' }]; },
  async getArrangementAnnotations(...args: any[]) { return [{ text: 'Note', author: 'User', id: 1 }]; },
  async createAnnotation(...args: any[]) { return { id: 2, text: 'Ajouté' }; },
  async updateAnnotation(...args: any[]) { return { id: 1, text: 'Edité' }; },
  async deleteAnnotation(...args: any[]) { return { deleted: true }; },
  async getPlanChecklist(...args: any[]) { return [{ id: 1, label: 'Mock item', checked: false, position: 0 }]; },
  async getChecklistTemplates(...args: any[]) { return [{ id: 1, name: 'Checklist template', items: [{ id: 1, label: 'Item', position: 0 }] }]; },
  async addPlanChecklistItem(...args: any[]) { return { id: 2, label: 'Ajouté', checked: false }; },
  async updatePlanChecklist(...args: any[]) { return { id: 1, label: 'Modifié' }; },
  async deletePlanChecklist(...args: any[]) { return { deleted: true }; },

  // Members & Teams
  async getMembers(...args: any[]) { return [{ id: 1, first_name: 'Mock', last_name: 'User', teams: [] }]; },
  async getMember(...args: any[]) { return { id: 1, first_name: 'Mock', last_name: 'User', email: 'mock@church.tld', teams: [] }; },
  async createMember(...args: any[]) { return { id: 2, first_name: 'Nouveau', last_name: 'Membre' }; },
  async updateMember(...args: any[]) { return { id: 1, first_name: 'Modifié', last_name: 'Utilisateur' }; },
  async deleteMember(...args: any[]) { return { deleted: true }; },
  async getTeams(...args: any[]) { return [{ id: 1, name: 'Équipe mock', members: [] }]; },
  async getTeam(...args: any[]) { return { id: 1, name: 'Équipe mock', members: [] }; },
  async createTeam(...args: any[]) { return { id: 2, name: 'Nouvelle équipe' }; },
  async updateTeam(...args: any[]) { return { id: 1, name: 'Équipe modifiée' }; },
  async deleteTeam(...args: any[]) { return { deleted: true }; },
  async addTeamMember(...args: any[]) { return { id: 1, memberId: 1 }; },
  async removeTeamMember(...args: any[]) { return { removed: true }; },
  async searchMembers(...args: any[]) { return [{ id: 1, first_name: 'Mock', last_name: 'User' }]; },

  // Attendance
  async getPlanAttendances(...args: any[]) { return [{ id: 1, plan_id: 1, member_id: 1, checked_in_at: '2023-01-01T10:00:00Z', status: 'present', check_in_time: '10:00', first_name: 'Mock', last_name: 'User', member: { first_name: 'Mock', last_name: 'User' } }]; },
  async createAttendance(...args: any[]) { return { id: 1, status: 'created' }; },
  async deleteAttendance(...args: any[]) { return { deleted: true }; },

  // Directory / House Groups / Church Events
  async getDirectory(...args: any[]) { return [{ id: 1, name: 'Mock member', email: 'mock@church.tld' }]; },
  async getHouseGroup(...args: any[]) { return { id: 1, name: 'Maison mock', members: [] }; },
  async getHouseGroups(...args: any[]) { return [{ id: 1, name: 'Maison mock', members: [] }]; },
  async createHouseGroup(...args: any[]) { return { id: 2, name: 'Nouvelle maison' }; },
  async updateHouseGroup(...args: any[]) { return { id: 1, name: 'Maison modifiée' }; },
  async deleteHouseGroup(...args: any[]) { return { deleted: true }; },
  async addGroupMember(...args: any[]) { return { id: 1, groupId: 1, memberId: 1 }; },
  async removeGroupMember(...args: any[]) { return { removed: true }; },
  async addGroupMeeting(...args: any[]) { return { id: 1, date: '2023-01-01' }; },
  async getChurchEvents(...args: any[]) { return [{ id: 1, name: 'Event mock', date: '2023-04-01', status: 'scheduled', repeat_period: 'none', start_date: '2023-04-01' }]; },
  async createChurchEvent(...args: any[]) { return { id: 2, name: 'Nouvel event' }; },
  async updateChurchEvent(...args: any[]) { return { id: 1, name: 'Event modifié' }; },
  async deleteChurchEvent(...args: any[]) { return { deleted: true }; },
  async createChurchEventException(...args: any[]) { return { id: 1, eventId: 1, date: '2023-04-02' }; },

  // Checkins
  async getPlanAudio(...args: any[]) { return [{ url: 'mock.mp3', type: 'audio' }]; },
  async getPlanPeople(...args: any[]) { return [{ id: 1, name: 'Mock user' }]; },
  async generateQRCode(...args: any[]) { return { qr: 'data:image/png;base64,mock' }; },
  async getCheckinSettings(...args: any[]) { return { enabled: true }; },
  async updateCheckinSettings(...args: any[]) { return { enabled: true }; },

  // Announcements
  async getAnnouncements(...args: any[]) { return [{ id: 1, title: 'Annonce mock', content: 'Contenu' }]; },
  async createAnnouncement(...args: any[]) { return { id: 2, title: 'Nouvelle annonce', content: '' }; },
  async updateAnnouncement(...args: any[]) { return { id: 1, title: 'Annonce modifiée' }; },
  async deleteAnnouncement(...args: any[]) { return { deleted: true }; },

  // Polls / Votes
  async getPolls(...args: any[]) { return [{ id: 1, question: 'Question?', options: [] }]; },
  async createPoll(...args: any[]) { return { id: 2, question: 'Nouveau sondage' }; },
  async deletePoll(...args: any[]) { return { deleted: true }; },
  async votePoll(...args: any[]) { return { voted: true }; },
  async deleteVote(...args: any[]) { return { deleted: true }; },

  // Invitations
  async getInvitation(...args: any[]) { return { id: 1, email: 'invite@church.tld', status: 'pending' }; },
  async createInvitation(...args: any[]) { return { id: 2, email: 'new@church.tld', status: 'pending' }; },
  async deleteInvitation(...args: any[]) { return { deleted: true }; },

  // Email / Notifications / Webhooks
  async registerFCMToken(...args: any[]) { return { registered: true }; },
  async getEmailTemplates(...args: any[]) { return [{ id: 1, name: 'Mail mock', subject: 'Sujet' }]; },
  async createEmailTemplate(...args: any[]) { return { id: 2, name: 'Nouveau template', subject: 'Sujet' }; },
  async deleteEmailTemplate(...args: any[]) { return { deleted: true }; },
  async getEmailLogs(...args: any[]) { return [{ id: 1, status: 'sent', to: 'test@church.tld' }]; },
  async sendEmail(...args: any[]) { return { success: true, messageId: 'mock' }; },
  async sendBulkEmail(...args: any[]) { return { success: true, count: 1, failed: 0, errors: [], sent: 1 }; },
  async getWebhooks(...args: any[]) { return [{ id: 1, url: 'https://hook/' }]; },
  async createWebhook(...args: any[]) { return { id: 2, url: 'https://newhook/' }; },
  async deleteWebhook(...args: any[]) { return { deleted: true }; },
  async syncPCO(...args: any[]) { return { synced: true, results: { imported: 5, updated: 3, errors: [] } }; },
  async getNotifications(...args: any[]) { return [{ id: 1, message: 'Notification', read: false }]; },
  async markNotificationRead(...args: any[]) { return { read: true }; },

  // Plan Templates
  async getPlanTemplates(...args: any[]) { return [{ id: 1, name: 'Template mock', description: 'Description', items: [{ id: 1, name: 'Item', position: 0, key: 'C', chord_chart: '', media: [] }] }]; },
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
  async getReplacements(...args: any[]) { return [{ id: 1, name: 'Replacement' }]; },
  async applyReplacement(...args: any[]) { return { applied: true }; },
  async updateTeamMember(...args: any[]) { return { updated: true }; },

  // Me / Account
  async getMe(...args: any[]) { return { id: 1, first_name: 'Mock', last_name: 'User', email: 'mock@church.tld', phone: '+33600000000', notes: '', birth_date: '1990-01-01' }; },
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
  async getPlanTemplate(...args: any[]) { return { id: 1, name: 'Template mock', description: 'Description', items: [{ id: 1, name: 'Item', key: 'C', chord_chart: '', media: [] }] }; },
  async getPlanTemplateItems(...args: any[]) { return [{ id: 1, name: 'Item mock' }]; },
  async updateArrangement(...args: any[]) { return { id: 1, name: 'Arrangement modifié' }; },
  async getFeed(...args: any[]) { return [{ id: 1, action: 'created', target: 'plan' }]; },
  async postToFeed(...args: any[]) { return { id: 2, posted: true }; },

  // Roles / Permissions
  async getRoles(...args: any[]) { return [{ id: 1, name: 'admin', permissions: [] }]; },
  async updateRole(...args: any[]) { return { updated: true }; },

  // Backup / Audit
  async getBackupStatus(...args: any[]) { return { lastBackup: '2023-01-01', status: 'ok' }; },
  async createBackup(...args: any[]) { return { created: true }; },
  async getAuditLogs(...args: any[]) { return [{ id: 1, action: 'update', user: 'admin' }]; },

  // Files
  async uploadFile(...args: any[]) { return { url: 'https://mock.upload/file.pdf', name: 'file.pdf' }; },
  async deleteFile(...args: any[]) { return { deleted: true }; },

  // Misc
  async getStats(...args: any[]) { return { members: 10, activeMembers: 8, upcomingPlans: 3, songsWithArrangements: 20, pendingConfirmations: 2, teams: 5 }; },
  async getAttendanceStats(...args: any[]) { return { total: 10, perMember: [], perMonth: [{ month: '2023-01', count: 5 }], recent: [] }; },
  async getVolunteerPreferences(...args: any[]) { return { available: true, max_services_per_month: 4, notes: '', unavailable_dates: [] as string[] }; },
  async updateVolunteerPreferences(...args: any[]) { return { updated: true }; },
  async getInbox(...args: any[]) { return [{ id: 1, title: 'Inbox', unread: 1 }]; },
  async getMessage(...args: any[]) { return { id: 1, text: 'Test message', read: false }; },
  async markMessageRead(...args: any[]) { return { read: true }; },
  async sendMessage(...args: any[]) { return { sent: true }; },
  async getConflictLogs(...args: any[]) { return [{ id: 1, message: 'Conflit' }]; },
  async getSongMedia(...args: any[]) { return [{ url: 'mock.mp3' }]; },
  async getSongArrangements(...args: any[]) { return [{ id: 1, name: 'Arrangement', chart: '' }]; },
  async getServiceTypes(...args: any[]) { return [{ id: 1, name: 'Service Type' }]; },
  async getActivityFeed(...args: any[]) { return [{ id: 1, action: 'created', target: 'plan' }]; },
  async getMembersDirectory(...args: any[]) { return [{ id: 1, name: 'Mock member' }]; },
  async exportData(...args: any[]) { return { csv: 'id,name\n1,Mock' }; },
  async importData(...args: any[]) { return { imported: 5 }; },
  async getPlansByDate(...args: any[]) { return [{ id: 1, title: 'Plan mock', date: '2023-01-01' }]; },
};

export default api;
