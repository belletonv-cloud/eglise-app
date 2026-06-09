import { user, isImpersonating } from "../stores/auth";

declare global {
  var __API_BASE__: string | undefined;
}

const DEFAULT_BASE = "https://eglise-app.belletonv.workers.dev";
globalThis.__API_BASE__ = globalThis.__API_BASE__ || DEFAULT_BASE;

// Detect demo mode - force mock data
const isDemoMode =
  typeof window !== "undefined" && window.location.search.includes("demo=1");

export function getApiBase(): string {
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    return "http://localhost:8787";
  }
  return globalThis.__API_BASE__ || DEFAULT_BASE;
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
) {
  // In demo mode or impersonation mode, send x-demo-email instead of Firebase token
  if (isDemoMode || isImpersonating.value) {
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
      ...(user.value?.email ? { "x-demo-email": user.value.email } : {}),
    };
    return fetch(url, { ...options, headers });
  }
  const token = user.value ? await (user.value as any).getIdToken() : null;
  const headers: Record<string, string> = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...((options.headers as Record<string, string>) || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...options, headers });
}

const _now = new Date();
const _y = _now.getFullYear();
const _m = String(_now.getMonth() + 1).padStart(2, "0");
const _d = (day: number) => `${_y}-${_m}-${String(day).padStart(2, "0")}`;

// Routes explicites (patterns irreguliers)
const API_ROUTES: Record<
  string,
  {
    path: string;
    method: string;
    hasId?: boolean;
    hasBody?: boolean;
    isList?: boolean;
  }
> = {
  // Plans
  getPlans: { path: "/api/plans", method: "GET", isList: true },
  getPlan: { path: "/api/plans", method: "GET", hasId: true },
  getPlanItems: {
    path: "/api/plans/{id}/items",
    method: "GET",
    hasId: true,
    isList: true,
  },
  createPlan: { path: "/api/plans", method: "POST", hasBody: true },
  updatePlan: {
    path: "/api/plans/{id}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },
  deletePlan: { path: "/api/plans/{id}", method: "DELETE", hasId: true },
  createPlanItem: {
    path: "/api/plans/{id}/items",
    method: "POST",
    hasId: true,
    hasBody: true,
  },
  updatePlanItem: {
    path: "/api/plan-items/{id}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },
  deletePlanItem: {
    path: "/api/plan-items/{id}",
    method: "DELETE",
    hasId: true,
  },
  applyPlanTemplate: {
    path: "/api/plans/from-template",
    method: "POST",
    hasBody: true,
  },

  // Songs
  getSongs: { path: "/api/songs", method: "GET", isList: true },
  getSong: { path: "/api/songs", method: "GET", hasId: true },
  updateSong: {
    path: "/api/arrangements/{id}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },
  createSong: { path: "/api/songs", method: "POST", hasBody: true },
  deleteSong: { path: "/api/songs/{id}", method: "DELETE", hasId: true },

  // Arrangements
  updateArrangement: {
    path: "/api/arrangements/{id}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },
  getArrangementMedia: {
    path: "/api/arrangements/{id}/media",
    method: "GET",
    hasId: true,
    isList: true,
  },
  getArrangementAnnotations: {
    path: "/api/arrangements/{id}/annotations",
    method: "GET",
    hasId: true,
    isList: true,
  },
  createAnnotation: {
    path: "/api/arrangements/{id}/annotations",
    method: "POST",
    hasId: true,
    hasBody: true,
  },
  updateAnnotation: {
    path: "/api/annotations/{id}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },
  deleteAnnotation: {
    path: "/api/annotations/{id}",
    method: "DELETE",
    hasId: true,
  },

  // Drawings (canvas annotations)
  getArrangementDrawings: {
    path: "/api/arrangements/{id}/drawings",
    method: "GET",
    hasId: true,
    isList: true,
  },
  saveArrangementDrawing: {
    path: "/api/arrangements/{id}/drawings",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },
  deleteArrangementDrawing: {
    path: "/api/arrangements/{id}/drawings",
    method: "DELETE",
    hasId: true,
  },

  // Members
  getMembers: { path: "/api/members", method: "GET", isList: true },
  getMember: { path: "/api/members", method: "GET", hasId: true },
  createMember: { path: "/api/members", method: "POST", hasBody: true },
  updateMember: {
    path: "/api/members/{id}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },
  deleteMember: { path: "/api/members/{id}", method: "DELETE", hasId: true },
  searchMembers: { path: "/api/members/search", method: "GET", isList: true },
  getMemberExceptions: {
    path: "/api/member-exceptions",
    method: "GET",
    isList: true,
  },
  createMemberException: {
    path: "/api/member-exceptions",
    method: "POST",
    hasBody: true,
  },
  deleteMemberException: {
    path: "/api/member-exceptions/{id}",
    method: "DELETE",
    hasId: true,
  },
  updateMemberRole: {
    path: "/api/members/{id}/role",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },

  // Teams
  getTeams: { path: "/api/teams", method: "GET", isList: true },
  getTeam: { path: "/api/teams", method: "GET", hasId: true },
  createTeam: { path: "/api/teams", method: "POST", hasBody: true },
  updateTeam: {
    path: "/api/teams/{id}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },
  deleteTeam: { path: "/api/teams/{id}", method: "DELETE", hasId: true },
  addTeamMember: {
    path: "/api/teams/{id}/members",
    method: "POST",
    hasId: true,
    hasBody: true,
  },
  removeTeamMember: {
    path: "/api/teams/{teamId}/members/{memberId}",
    method: "DELETE",
    hasId: true,
  },
  updateTeamMember: {
    path: "/api/teams/{teamId}/members/{memberId}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },

  // Schedule
  getPlanPeople: {
    path: "/api/plans/{id}/scheduled-people",
    method: "GET",
    hasId: true,
    isList: true,
  },
  updateSchedule: {
    path: "/api/plans/{pid}/scheduled-people/{sid}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },
  schedulePerson: {
    path: "/api/plans/{id}/scheduled-people",
    method: "POST",
    hasId: true,
    hasBody: true,
  },
  removeSchedule: {
    path: "/api/plans/{pid}/scheduled-people/{sid}",
    method: "DELETE",
    hasId: true,
    hasBody: true,
  },
  applyReplacement: {
    path: "/api/schedule/replace",
    method: "POST",
    hasBody: true,
  },

  // Attendance
  getPlanAttendances: {
    path: "/api/plans/{id}/attendances",
    method: "GET",
    hasId: true,
    isList: true,
  },
  createAttendance: { path: "/api/attendances", method: "POST", hasBody: true },
  deleteAttendance: {
    path: "/api/attendances/{id}",
    method: "DELETE",
    hasId: true,
  },
  getAttendanceStats: { path: "/api/attendance-stats", method: "GET" },

  // House Groups
  getHouseGroups: { path: "/api/house-groups", method: "GET", isList: true },
  getHouseGroup: { path: "/api/house-groups", method: "GET", hasId: true },
  createHouseGroup: {
    path: "/api/house-groups",
    method: "POST",
    hasBody: true,
  },
  updateHouseGroup: {
    path: "/api/house-groups/{id}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },
  deleteHouseGroup: {
    path: "/api/house-groups/{id}",
    method: "DELETE",
    hasId: true,
  },
  addGroupMember: {
    path: "/api/house-groups/{id}/members",
    method: "POST",
    hasId: true,
    hasBody: true,
  },
  removeGroupMember: {
    path: "/api/house-groups/{groupId}/members/{memberId}",
    method: "DELETE",
    hasId: true,
  },
  addGroupMeeting: {
    path: "/api/house-groups/{id}/meetings",
    method: "POST",
    hasId: true,
    hasBody: true,
  },

  // Church Events
  getChurchEvents: { path: "/api/church-events", method: "GET", isList: true },
  createChurchEvent: {
    path: "/api/church-events",
    method: "POST",
    hasBody: true,
  },
  updateChurchEvent: {
    path: "/api/church-events/{id}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },
  deleteChurchEvent: {
    path: "/api/church-events/{id}",
    method: "DELETE",
    hasId: true,
  },
  createChurchEventException: {
    path: "/api/church-events/{id}/exceptions",
    method: "POST",
    hasId: true,
    hasBody: true,
  },

  // Plan Templates
  getPlanTemplates: {
    path: "/api/plan-templates",
    method: "GET",
    isList: true,
  },
  getPlanTemplate: { path: "/api/plan-templates", method: "GET", hasId: true },
  createPlanTemplate: {
    path: "/api/plan-templates",
    method: "POST",
    hasBody: true,
  },
  updatePlanTemplate: {
    path: "/api/plan-templates/{id}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },
  deletePlanTemplate: {
    path: "/api/plan-templates/{id}",
    method: "DELETE",
    hasId: true,
  },
  getPlanTemplateItems: {
    path: "/api/plan-templates/{id}/items",
    method: "GET",
    hasId: true,
    isList: true,
  },
  createPlanTemplateItem: {
    path: "/api/plan-templates/{id}/items",
    method: "POST",
    hasId: true,
    hasBody: true,
  },
  updatePlanTemplateItem: {
    path: "/api/plan-template-items/{id}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },
  deletePlanTemplateItem: {
    path: "/api/plan-template-items/{id}",
    method: "DELETE",
    hasId: true,
  },

  // Logs
  getEmailLogs: { path: "/api/email-logs", method: "GET", isList: true },
  getConflictLogs: {
    path: "/api/scheduled-conflict-logs",
    method: "GET",
    isList: true,
  },
  getAuditLogs: { path: "/api/audit", method: "GET", isList: true },

  // Service types
  getServiceTypes: { path: "/api/service-types", method: "GET", isList: true },

  // Me / Account
  getMe: { path: "/api/me", method: "GET" },
  getMySchedule: { path: "/api/me/schedule", method: "GET", isList: true },
  updateMe: { path: "/api/me", method: "PUT", hasBody: true },

  // Volunteer preferences
  getVolunteerPreferences: {
    path: "/api/volunteer-preferences/{memberId}",
    method: "GET",
    hasId: true,
  },
  updateVolunteerPreferences: {
    path: "/api/volunteer-preferences/{memberId}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },

  // Messages
  getInbox: { path: "/api/messages/inbox", method: "GET", isList: true },
  getMessage: { path: "/api/messages/{id}", method: "GET", hasId: true },
  markMessageRead: {
    path: "/api/messages/{id}/read",
    method: "POST",
    hasId: true,
    hasBody: true,
  },
  sendMessage: { path: "/api/messages", method: "POST", hasBody: true },

  // Email
  sendEmail: { path: "/api/send-email", method: "POST", hasBody: true },
  sendBulkEmail: {
    path: "/api/send-bulk-email",
    method: "POST",
    hasBody: true,
  },
  getEmailTemplates: {
    path: "/api/email-templates",
    method: "GET",
    isList: true,
  },
  createEmailTemplate: {
    path: "/api/email-templates",
    method: "POST",
    hasBody: true,
  },
  deleteEmailTemplate: {
    path: "/api/email-templates/{id}",
    method: "DELETE",
    hasId: true,
  },

  // Webhooks
  getWebhooks: { path: "/api/webhooks", method: "GET", isList: true },
  createWebhook: { path: "/api/webhooks", method: "POST", hasBody: true },
  deleteWebhook: { path: "/api/webhooks/{id}", method: "DELETE", hasId: true },

  // Polls
  getPolls: { path: "/api/polls", method: "GET", isList: true },
  createPoll: { path: "/api/polls", method: "POST", hasBody: true },
  deletePoll: { path: "/api/polls/{id}", method: "DELETE", hasId: true },
  createPollOption: {
    path: "/api/polls/{id}/options",
    method: "POST",
    hasId: true,
    hasBody: true,
  },
  deletePollOption: {
    path: "/api/poll-options/{id}",
    method: "DELETE",
    hasId: true,
  },
  createVote: {
    path: "/api/polls/{id}/vote",
    method: "POST",
    hasId: true,
    hasBody: true,
  },
  deleteVote: { path: "/api/polls/{id}/vote", method: "DELETE", hasId: true },

  // Announcements
  getAnnouncements: { path: "/api/announcements", method: "GET", isList: true },
  createAnnouncement: {
    path: "/api/announcements",
    method: "POST",
    hasBody: true,
  },
  updateAnnouncement: {
    path: "/api/announcements/{id}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },
  deleteAnnouncement: {
    path: "/api/announcements/{id}",
    method: "DELETE",
    hasId: true,
  },

  // Directory
  getDirectory: { path: "/api/directory", method: "GET", isList: true },

  // Stats
  getStats: { path: "/api/stats", method: "GET" },

  // Check-in / Plans by date
  getPlansByDate: { path: "/api/plans", method: "GET", isList: true },

  // Checklist
  getPlanChecklist: {
    path: "/api/plans/{id}/checklist",
    method: "GET",
    hasId: true,
    isList: true,
  },
  addPlanChecklistItem: {
    path: "/api/plans/{id}/checklist",
    method: "POST",
    hasId: true,
    hasBody: true,
  },
  updatePlanChecklist: {
    path: "/api/plan-checklists/{id}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },
  deletePlanChecklist: {
    path: "/api/plan-checklists/{id}",
    method: "DELETE",
    hasId: true,
  },
  getChecklistTemplates: {
    path: "/api/checklist-templates",
    method: "GET",
    isList: true,
  },
  createChecklistTemplate: {
    path: "/api/checklist-templates",
    method: "POST",
    hasBody: true,
  },
  deleteChecklistTemplate: {
    path: "/api/checklist-templates/{id}",
    method: "DELETE",
    hasId: true,
  },

  // Notifications
  getNotifications: {
    path: "/api/fcm/notifications",
    method: "GET",
    isList: true,
  },

  // Search
  search: { path: "/api/search", method: "GET", isList: true },

  // Replacements
  getReplacements: {
    path: "/api/schedule/replacements",
    method: "GET",
    isList: true,
  },

  // Audio
  getPlanAudio: {
    path: "/api/plans/{id}/audio",
    method: "GET",
    hasId: true,
    isList: true,
  },
  getAudioSegments: {
    path: "/api/plans/{id}/audio",
    method: "GET",
    hasId: true,
    isList: true,
  },
  uploadPlanAudio: { path: "/api/upload", method: "POST", hasBody: true },
  registerFCMToken: { path: "/api/fcm/register", method: "POST", hasBody: true },

  // Attachments
  deleteAttachment: {
    path: "/api/attachments/{id}",
    method: "DELETE",
    hasId: true,
  },

  // Resource permissions
  getResourcePermissions: {
    path: "/api/resource-permissions",
    method: "GET",
    isList: true,
  },
  createResourcePermission: {
    path: "/api/resource-permissions",
    method: "POST",
    hasBody: true,
  },
  deleteResourcePermission: {
    path: "/api/resource-permissions/{id}",
    method: "DELETE",
    hasId: true,
  },

  // One-click
  sendOneClick: { path: "/api/oneclick", method: "POST", hasBody: true },

  // Invitations
  getInvitation: {
    path: "/api/invitations/{token}",
    method: "GET",
    hasId: true,
  },
  redeemInvitation: {
    path: "/api/invitations/{token}/redeem",
    method: "POST",
    hasId: true,
    hasBody: true,
  },

  // Backup
  getBackupStatus: { path: "/api/backup", method: "GET" },

  // Communication preferences
  getCommunicationPreferences: {
    path: "/api/communication-preferences/{memberId}",
    method: "GET",
    hasId: true,
  },
  updateCommunicationPreferences: {
    path: "/api/communication-preferences",
    method: "POST",
    hasBody: true,
  },

  // RGPD / GDPR
  gdprExport: {
    path: "/api/members/{id}/gdpr-export",
    method: "GET",
    hasId: true,
  },
  gdprErase: {
    path: "/api/members/{id}/gdpr-erase",
    method: "POST",
    hasId: true,
    hasBody: false,
  },
  updateMemberConsent: {
    path: "/api/members/{id}/consent",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },

  // PCO
  syncPCO: {
    path: "/api/pco-sync",
    method: "POST",
    hasBody: true,
  },
  syncPCOPeople: {
    path: "/api/pco-sync-people",
    method: "POST",
    hasBody: false,
  },
};

function toKebab(s: string): string {
  return s
    .replace(/^[A-Z]/, (c) => c.toLowerCase())
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase();
}

function guessRoute(
  prop: string,
): { path: string; method: string; hasBody?: boolean; hasId?: boolean } | null {
  const patterns: [RegExp, string, boolean][] = [
    [/^get(.+)$/, "GET", false],
    [/^create(.+)$/, "POST", true],
    [/^update(.+)$/, "PUT", true],
    [/^delete(.+)$/, "DELETE", false],
    [/^add(.+)$/, "POST", true],
    [/^remove(.+)$/, "DELETE", false],
  ];
  for (const [re, method, hasBody] of patterns) {
    const m = prop.match(re);
    if (m && m[1]) {
      const rest: string = m[1];
      const kebab = toKebab(rest);
      return {
        path: `/api/${kebab}`,
        method,
        hasBody: hasBody || method === "POST" || method === "PUT",
        hasId:
          method === "PUT" ||
          method === "DELETE" ||
          (prop.startsWith("get") && rest !== "s" && !rest.endsWith("s")),
      };
    }
  }
  return null;
}

function buildUrl(
  route: {
    path: string;
    method: string;
    hasId?: boolean;
    hasBody?: boolean;
    isList?: boolean;
  },
  args: any[],
  base: string,
): string {
  let path = route.path;
  if (route.hasId && args.length > 0) {
    const id = args[0];
    const originalPath = path;
    path = path
      .replace("{id}", String(id))
      .replace("{planId}", String(id))
      .replace("{memberId}", String(args[1] ?? ""))
      .replace("{teamId}", String(args[0]))
      .replace("{groupId}", String(args[0]))
      .replace("{songId}", String(args[0]))
      .replace("{planTemplateId}", String(args[0]))
      .replace("{pid}", String(id))
      .replace("{tid}", String(args[0]))
      .replace("{gid}", String(args[0]))
      .replace("{mid}", String(args[1] ?? ""))
      .replace("{token}", String(id));
    if (path === originalPath) {
      path += "/" + String(id);
    }
  }
  if (
    route.method === "GET" &&
    args.length > 0 &&
    typeof args[0] === "object"
  ) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(args[0])) {
      if (v !== undefined && v !== null) params.set(k, String(v));
    }
    const qs = params.toString();
    if (qs) path += "?" + qs;
  }
  return base + path;
}

async function tryCall(prop: string, args: any[]): Promise<any> {
  const base = getApiBase();
  let madeAttempt = false;
  let lastError: any = null;

  const routes: any[] = [API_ROUTES[prop]];
  const guessed = guessRoute(prop);
  if (!routes[0] && guessed) routes.push(guessed);

  for (const route of routes) {
    if (!route) continue;
    const url = buildUrl(route, args, base);
    const body = route.hasBody ? extractBody(args) : undefined;
    const options: RequestInit = { method: route.method };
    if (body) options.body = JSON.stringify(body);
    madeAttempt = true;
    try {
      const res = await authenticatedFetch(url, options);
      if (!res.ok) {
        if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
        if (res.status === 401) {
          throw new Error(`HTTP ${res.status}`);
        }
        if (res.status === 404) {
          madeAttempt = false;
          continue;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (
        route.isList &&
        json &&
        typeof json === "object" &&
        !Array.isArray(json) &&
        Array.isArray(json.data)
      ) {
        return json.data;
      }
      return json;
    } catch (e) {
      lastError = e;
    }
  }

  if (madeAttempt && lastError) {
    console.warn(
      `[api] ${prop} → fallback mock (${lastError instanceof Error ? lastError.message : lastError})`,
    );
  }
  // In demo or impersonation mode, return mock data as fallback
  if (isDemoMode || isImpersonating.value) {
    const mockFn = mockFallback[prop];
    if (mockFn) return mockFn(...args);
  }
  return null;
}

function extractBody(args: any[]): any {
  for (const a of args) {
    if (
      typeof a === "object" &&
      a !== null &&
      !Array.isArray(a) &&
      !(a instanceof URLSearchParams)
    )
      return a;
  }
  return undefined;
}

const mockFallback: Record<string, (...args: any[]) => any> = {
  getPlans: () => [
    {
      id: 1,
      title: "Culte du dimanche",
      date: _d(1),
      time: "10:00",
      theme: "Louange",
      attendance_count: 5,
      service_type_id: 1,
      service_type_name: "Culte",
    },
    {
      id: 2,
      title: "Groupe de jeunes",
      date: _d(8),
      time: "14:00",
      theme: "Enseignement",
      attendance_count: 3,
      service_type_id: 2,
      service_type_name: "Jeunes",
    },
    {
      id: 3,
      title: "Étude biblique",
      date: _d(15),
      time: "18:30",
      theme: "Prière",
      attendance_count: 4,
      service_type_id: 3,
      service_type_name: "Étude",
    },
  ],
  getEvents: () => [
    {
      id: 1,
      name: "Soirée louange",
      date: _d(15),
      status: "confirmed",
      repeat_period: "none",
      start_date: _d(15),
      time: "19:00",
    },
  ],
  getSongs: () => [
    {
      id: 1,
      title: "Mock song",
      author: "Demo Author",
      arrangements: [{ id: 1, key: "C", tempo: 120, chord_chart: "Am C G" }],
      arrangement_count: 1,
    },
  ],
  getSong: () => ({
    id: 1,
    title: "Mock song",
    arrangements: [
      { id: 1, name: "Original", key: "C", tempo: 120, chord_chart: "Am C G" },
    ],
  }),
  getPlan: () => ({
    id: 1,
    title: "Culte du dimanche",
    date: _d(1),
    items: [
      {
        id: 1,
        name: "Chant d'ouverture",
        type: "song",
        key: "C",
        chord_chart: "Am C G",
        media: [],
        arrangement_id: 1,
      },
    ],
  }),
  getPlanItems: () => [
    {
      id: 1,
      title: "Chant d'ouverture",
      name: "Chant d'ouverture",
      type: "song",
      key: "C",
      chord_chart: "Am C G",
      media: [],
      arrangement_id: 1,
    },
  ],
  getMembers: () => [
    {
      id: 1,
      first_name: "Jean",
      last_name: "Dupont",
      email: "jean@eglise.tld",
    },
  ],
  getMember: () => ({
    id: 1,
    first_name: "Jean",
    last_name: "Dupont",
    email: "jean@eglise.tld",
  }),
  getTeams: () => [
    {
      id: 1,
      name: "Band",
      description: "Louange principale",
      service_type: "worship",
      member_count: 4,
    },
    {
      id: 2,
      name: "Audio",
      description: "Son façade et retours",
      service_type: "sound",
      member_count: 2,
    },
    {
      id: 3,
      name: "Lumières & Vidéo",
      description: "Projection et réalisation",
      service_type: "video",
      member_count: 2,
    },
    {
      id: 4,
      name: "Accueil",
      description: "Hospitalité",
      service_type: "welcome",
      member_count: 2,
    },
  ],
  getTeam: (id: number) => ({
    1: {
      id: 1,
      name: "Band",
      description: "Louange principale",
      service_type: "worship",
      members: [
        {
          id: 1,
          first_name: "Channelle",
          last_name: "Castillo-Brocke",
          email: "channelle@eglise.tld",
          position: "Lead Vocal",
        },
        {
          id: 2,
          first_name: "Justin",
          last_name: "Kent",
          email: "justin@eglise.tld",
          position: "Bass",
        },
        {
          id: 3,
          first_name: "Joslyn",
          last_name: "Frye",
          email: "joslyn@eglise.tld",
          position: "Keys",
        },
        {
          id: 4,
          first_name: "Seth",
          last_name: "Holmes",
          email: "seth@eglise.tld",
          position: "Acoustic Guitar",
        },
      ],
    },
    2: {
      id: 2,
      name: "Audio",
      description: "Son façade et retours",
      service_type: "sound",
      members: [
        {
          id: 5,
          first_name: "Will",
          last_name: "Frye",
          email: "will@eglise.tld",
          position: "FOH",
        },
        {
          id: 6,
          first_name: "Roger",
          last_name: "Wes",
          email: "roger@eglise.tld",
          position: "Monitors",
        },
      ],
    },
    3: {
      id: 3,
      name: "Lumières & Vidéo",
      description: "Projection et réalisation",
      service_type: "video",
      members: [
        {
          id: 7,
          first_name: "May",
          last_name: "Winters",
          email: "may@eglise.tld",
          position: "Lights",
        },
        {
          id: 8,
          first_name: "Eli",
          last_name: "Martin",
          email: "eli@eglise.tld",
          position: "ProPresenter",
        },
      ],
    },
    4: {
      id: 4,
      name: "Accueil",
      description: "Hospitalité",
      service_type: "welcome",
      members: [
        {
          id: 9,
          first_name: "Marie",
          last_name: "Laurent",
          email: "marie@eglise.tld",
          position: "Accueil",
        },
        {
          id: 10,
          first_name: "Pierre",
          last_name: "Dubois",
          email: "pierre@eglise.tld",
          position: "Café",
        },
      ],
    },
  }[id] || null),
  getHouseGroups: () => [
    {
      id: 1,
      name: "Groupe maison Centre",
      members: [{ id: 1, first_name: "Jean", last_name: "Dupont" }],
    },
  ],
  getHouseGroup: () => ({
    id: 1,
    name: "Groupe maison Centre",
    members: [{ id: 1, first_name: "Jean", last_name: "Dupont" }],
  }),
  getChurchEvents: () => [
    {
      id: 1,
      name: "Culte régional",
      date: _d(22),
      status: "scheduled",
      repeat_period: "monthly",
      start_date: _d(22),
    },
  ],
  getPlanTemplates: () => [
    {
      id: 1,
      name: "Culte type",
      description: "Culte dominical standard",
      items: [],
    },
  ],
  getPlanTemplate: () => ({
    id: 1,
    name: "Culte type",
    description: "Standard",
    items: [],
  }),
  getPlanTemplateItems: () => [{ id: 1, name: "Louange" }],
  getServiceTypes: () => [
    { id: 1, name: "Culte" },
    { id: 2, name: "Jeunes" },
    { id: 3, name: "Étude" },
  ],
  getMe: () => ({
    id: 1,
    first_name: "Admin",
    last_name: "Démo",
    email: "admin@demo.church",
  }),
  getMySchedule: () => [
    {
      id: 1,
      date: _d(5),
      service_type_name: "Contemporary Service",
      position: "Tenor Choir",
      status: "pending",
    },
    {
      id: 2,
      date: _d(12),
      service_type_name: "Contemporary Service",
      position: "Electric Band",
      status: "confirmed",
    },
    {
      id: 3,
      date: _d(19),
      service_type_name: "Prayer Night",
      position: "Keys",
      status: "confirmed",
    },
  ],
  getStats: () => ({
    members: 25,
    activeMembers: 18,
    upcomingPlans: 3,
    songsWithArrangements: 20,
    pendingConfirmations: 2,
    teams: 5,
  }),
  getDirectory: () => [
    {
      id: 1,
      first_name: "Jean",
      last_name: "Dupont",
      email: "jean@eglise.tld",
    },
  ],
  getAnnouncements: () => [
    {
      id: 1,
      title: "Annonce importante",
      content: "Réunion ce dimanche après le culte",
      created_at: _d(1),
    },
  ],
  getPolls: () => [
    { id: 1, question: "Quel jour pour la sortie ?", options: [] },
  ],
  getEmailTemplates: () => [
    { id: 1, name: "Bienvenue", subject: "Bienvenue à l'église" },
  ],
  getWebhooks: () => [{ id: 1, url: "https://hook.example.com/" }],
  getPlanAttendances: () => [
    {
      id: 1,
      plan_id: 1,
      member_id: 1,
      checked_in_at: new Date().toISOString(),
      status: "present",
      first_name: "Jean",
      last_name: "Dupont",
    },
  ],
  getPlanPeople: () => [{ id: 1, first_name: "Jean", last_name: "Dupont" }],
  getPlanAudio: () => [{ url: "mock.mp3", type: "audio" }],
  getInbox: () => [{ id: 1, title: "Bienvenue dans l'app", unread: 1 }],
  getMessage: () => ({ id: 1, text: "Message de bienvenue", read: false }),
  getNotifications: () => [{ id: 1, message: "Bienvenue !", read: false }],
  getPlansByDate: () => [
    { id: 1, title: "Culte du dimanche", date: _d(1), time: "10:00" },
    { id: 2, title: "Groupe de jeunes", date: _d(8), time: "14:00" },
  ],
  getArrangementMedia: () => [{ url: "mock.mp3", type: "audio" }],
  getArrangementAnnotations: () => [{ text: "Note", author: "User", id: 1 }],
  getArrangementDrawings: () => [],
  saveArrangementDrawing: () => ({ id: 1, paths: '[]', is_shared: 0 }),
  deleteArrangementDrawing: () => ({ success: true }),
  getPlanChecklist: () => [
    { id: 1, label: "Préparer la sonorisation", checked: false, position: 0 },
  ],
  getChecklistTemplates: () => [
    {
      id: 1,
      name: "Checklist type",
      items: [{ id: 1, label: "Vérifier micros", position: 0 }],
    },
  ],
  getReplacements: () => [{ id: 1, name: "Marie Remplacement" }],
  getAttendanceStats: () => ({
    total: 0,
    perMember: [],
    perMonth: [],
    recent: [],
  }),
  getMemberAvailability: () => ({ available: true }),
  getVolunteerPreferences: () => ({
    available: true,
    max_services_per_month: 4,
    notes: "",
    unavailable_dates: [] as string[],
  }),
  getBackupStatus: () => ({ lastBackup: _d(1), status: "ok" }),
};

// ========================================
// TYPED API CLIENT
// ========================================

interface ApiClient {
  // Plans
  getPlans(params?: Record<string, any>): Promise<any>;
  getPlan(id: number, params?: Record<string, any>): Promise<any>;
  getPlanItems(planId: number, params?: Record<string, any>): Promise<any>;
  createPlan(data: any): Promise<any>;
  updatePlan(id: number, data: any): Promise<any>;
  deletePlan(id: number): Promise<any>;
  createPlanItem(planId: number, data: any): Promise<any>;
  updatePlanItem(id: number, data: any): Promise<any>;
  deletePlanItem(id: number): Promise<any>;
  applyPlanTemplate(data: any): Promise<any>;
  getPlansByDate(params?: Record<string, any>): Promise<any>;

  // Plan items (checklist)
  getPlanChecklist(planId: number, params?: Record<string, any>): Promise<any>;
  addPlanChecklistItem(planId: number, data: any): Promise<any>;
  updatePlanChecklist(id: number, data: any): Promise<any>;
  deletePlanChecklist(id: number): Promise<any>;
  getChecklistTemplates(params?: Record<string, any>): Promise<any>;
  createChecklistTemplate(data: any): Promise<any>;
  deleteChecklistTemplate(id: number): Promise<any>;

  // Songs
  getSongs(params?: Record<string, any>): Promise<any>;
  getSong(id: number, params?: Record<string, any>): Promise<any>;
  createSong(data: any): Promise<any>;
  updateSong(id: number, data: any): Promise<any>;
  deleteSong(id: number): Promise<any>;

  // Arrangements
  updateArrangement(id: number, data: any): Promise<any>;
  getArrangementMedia(id: number, params?: Record<string, any>): Promise<any>;
  getArrangementAnnotations(id: number, params?: Record<string, any>): Promise<any>;
  createAnnotation(id: number, data: any): Promise<any>;
  updateAnnotation(id: number, data: any): Promise<any>;
  deleteAnnotation(id: number): Promise<any>;
  getArrangementDrawings(id: number, params?: Record<string, any>): Promise<any>;
  saveArrangementDrawing(id: number, data: any): Promise<any>;
  deleteArrangementDrawing(id: number): Promise<any>;

  // Members
  getMembers(params?: Record<string, any>): Promise<any>;
  getMember(id: number, params?: Record<string, any>): Promise<any>;
  createMember(data: any): Promise<any>;
  updateMember(id: number, data: any): Promise<any>;
  deleteMember(id: number): Promise<any>;
  searchMembers(params?: Record<string, any>): Promise<any>;
  getMemberExceptions(params?: Record<string, any>): Promise<any>;
  createMemberException(data: any): Promise<any>;
  deleteMemberException(id: number): Promise<any>;
  updateMemberRole(id: number | string, data: any): Promise<any>;
  gdprExport(id: number): Promise<any>;
  gdprErase(id: number): Promise<any>;
  updateMemberConsent(id: number, data: any): Promise<any>;

  // Teams
  getTeams(params?: Record<string, any>): Promise<any>;
  getTeam(id: number, params?: Record<string, any>): Promise<any>;
  createTeam(data: any): Promise<any>;
  updateTeam(id: number, data: any): Promise<any>;
  deleteTeam(id: number): Promise<any>;
  addTeamMember(teamId: number, data: any): Promise<any>;
  removeTeamMember(teamId: number, memberId: number): Promise<any>;
  updateTeamMember(teamId: number, memberId: number, data: any): Promise<any>;

  // Scheduling
  getPlanPeople(planId: number, params?: Record<string, any>): Promise<any>;
  updateSchedule(planId: number, scheduleId: number, data: any): Promise<any>;
  schedulePerson(planId: number, data: any): Promise<any>;
  removeSchedule(planId: number, scheduleId: number, data?: any): Promise<any>;
  applyReplacement(data: any): Promise<any>;
  getReplacements(params?: Record<string, any>): Promise<any>;

  // Attendance
  getPlanAttendances(planId: number, params?: Record<string, any>): Promise<any>;
  createAttendance(data: any): Promise<any>;
  deleteAttendance(id: number): Promise<any>;
  getAttendanceStats(params?: Record<string, any>): Promise<any>;

  // House groups
  getHouseGroups(params?: Record<string, any>): Promise<any>;
  getHouseGroup(id: number, params?: Record<string, any>): Promise<any>;
  createHouseGroup(data: any): Promise<any>;
  updateHouseGroup(id: number, data: any): Promise<any>;
  deleteHouseGroup(id: number): Promise<any>;
  addGroupMember(houseGroupId: number, data: any): Promise<any>;
  removeGroupMember(houseGroupId: number, memberId: number): Promise<any>;
  addGroupMeeting(houseGroupId: number, data: any): Promise<any>;

  // Church events
  getChurchEvents(params?: Record<string, any>): Promise<any>;
  createChurchEvent(data: any): Promise<any>;
  updateChurchEvent(id: number, data: any): Promise<any>;
  deleteChurchEvent(id: number): Promise<any>;
  createChurchEventException(id: number, data: any): Promise<any>;

  // Plan templates
  getPlanTemplates(params?: Record<string, any>): Promise<any>;
  getPlanTemplate(id: number, params?: Record<string, any>): Promise<any>;
  createPlanTemplate(data: any): Promise<any>;
  updatePlanTemplate(id: number, data: any): Promise<any>;
  deletePlanTemplate(id: number): Promise<any>;
  getPlanTemplateItems(templateId: number, params?: Record<string, any>): Promise<any>;
  createPlanTemplateItem(templateId: number, data: any): Promise<any>;
  updatePlanTemplateItem(id: number, data: any): Promise<any>;
  deletePlanTemplateItem(id: number): Promise<any>;

  // Messages
  getInbox(params?: Record<string, any>): Promise<any>;
  getMessage(id: number, params?: Record<string, any>): Promise<any>;
  markMessageRead(id: number, data?: any): Promise<any>;
  sendMessage(data: any): Promise<any>;

  // Email
  sendEmail(data: any): Promise<any>;
  sendBulkEmail(data: any): Promise<any>;
  getEmailTemplates(params?: Record<string, any>): Promise<any>;
  createEmailTemplate(data: any): Promise<any>;
  deleteEmailTemplate(id: number): Promise<any>;

  // Webhooks
  getWebhooks(params?: Record<string, any>): Promise<any>;
  createWebhook(data: any): Promise<any>;
  deleteWebhook(id: number): Promise<any>;

  // Polls
  getPolls(params?: Record<string, any>): Promise<any>;
  createPoll(data: any): Promise<any>;
  deletePoll(id: number): Promise<any>;
  createPollOption(pollId: number, data: any): Promise<any>;
  deletePollOption(id: number): Promise<any>;
  createVote(pollId: number, data: any): Promise<any>;
  deleteVote(pollId: number): Promise<any>;

  // Announcements
  getAnnouncements(params?: Record<string, any>): Promise<any>;
  createAnnouncement(data: any): Promise<any>;
  updateAnnouncement(id: number, data: any): Promise<any>;
  deleteAnnouncement(id: number): Promise<any>;

  // User / profile
  getMe(params?: Record<string, any>): Promise<any>;
  getMySchedule(params?: Record<string, any>): Promise<any>;
  updateMe(data: any): Promise<any>;
  getVolunteerPreferences(memberId: number): Promise<any>;
  updateVolunteerPreferences(memberId: number, data: any): Promise<any>;

  // Various
  getDirectory(params?: Record<string, any>): Promise<any>;
  getStats(params?: Record<string, any>): Promise<any>;
  getServiceTypes(params?: Record<string, any>): Promise<any>;
  getEmailLogs(params?: Record<string, any>): Promise<any>;
  getConflictLogs(params?: Record<string, any>): Promise<any>;
  getAuditLogs(params?: Record<string, any>): Promise<any>;
  getNotifications(params?: Record<string, any>): Promise<any>;
  search(params?: Record<string, any>): Promise<any>;
  getResourcePermissions(params?: Record<string, any>): Promise<any>;
  createResourcePermission(data: any): Promise<any>;
  deleteResourcePermission(id: number): Promise<any>;
  getBackupStatus(params?: Record<string, any>): Promise<any>;
  getCommunicationPreferences(memberId: number): Promise<any>;
  updateCommunicationPreferences(data: any): Promise<any>;

  // One-click / invitations
  sendOneClick(data: any): Promise<any>;
  getInvitation(token: string): Promise<any>;
  redeemInvitation(token: string, data: any): Promise<any>;

  // Audio / attachments
  getPlanAudio(planId: number, params?: Record<string, any>): Promise<any>;
  getAudioSegments(planId: number, params?: Record<string, any>): Promise<any>;
  uploadPlanAudio(...args: any[]): Promise<any>;
  deleteAttachment(id: number): Promise<any>;

  // PCO sync
  syncPCO(data?: any): Promise<any>;
  syncPCOPeople(): Promise<any>;

  // Notifications
  registerFCMToken(data: any): Promise<any>;
}

function createApi(): ApiClient {
  const cache: Record<string, (...args: any[]) => Promise<any>> = {};

  const handler: ProxyHandler<any> = {
    get(_target, prop: string) {
      if (prop === "then") return undefined;
      if (cache[prop]) return cache[prop];

      cache[prop] = async (...args: any[]) => {
        const result = await tryCall(prop, args);
        if (result !== null) return result;

        const mockFn = mockFallback[prop];
        if (mockFn) return mockFn(...args);

        if (prop.startsWith("create") || prop.startsWith("add"))
          return { id: Date.now(), success: true };
        if (prop.startsWith("update")) return { success: true };
        if (prop.startsWith("delete") || prop.startsWith("remove"))
          return { deleted: true };
        return null;
      };
      return cache[prop];
    },
  };

  return new Proxy({}, handler) as ApiClient;
}

export const api: ApiClient = createApi();
export default api;
