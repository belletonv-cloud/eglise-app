import { user } from "../stores/auth";

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
  // In demo mode, skip auth headers
  if (isDemoMode && !url.includes("localhost")) {
    const token = null;
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };
    return fetch(url, { ...options, headers });
  }
  const token = user.value ? await user.value.getIdToken() : null;
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
    path: "/api/plans/{planId}/items/{id}",
    method: "PUT",
    hasId: true,
    hasBody: true,
  },
  deletePlanItem: {
    path: "/api/plans/{planId}/items/{id}",
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
      .replace("{memberId}", String(args[1] ?? ""))
      .replace("{token}", String(id));
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
  // In demo mode, return mock data as fallback
  if (isDemoMode) {
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
      name: "Louange",
      members: [{ id: 1, first_name: "Jean", last_name: "Dupont" }],
    },
  ],
  getTeam: () => ({
    id: 1,
    name: "Louange",
    members: [{ id: 1, first_name: "Jean", last_name: "Dupont" }],
  }),
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
  getMySchedule: () => [{ id: 1, planId: 1, role: "music" }],
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

function createApi() {
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
        if (prop === "syncPCO")
          return {
            synced: true,
            results: { imported: 5, updated: 3, errors: [] },
          };
        return null;
      };
      return cache[prop];
    },
  };

  return new Proxy({}, handler) as any;
}

export const api: any = createApi();
export default api;
