// Barrel file: re-exports all route arrays in correct order
export { healthRoutes } from "./health.js";
export { songsRoutes } from "./songs.js";
export { membersRoutes } from "./members.js";
export { teamsRoutes } from "./teams.js";
export { plansRoutes } from "./plans.js";
export { scheduledPeopleRoutes } from "./scheduledPeople.js";
export { portalRoutes } from "./portal.js";
export { planTemplatesRoutes } from "./planTemplates.js";
export { emailRoutes } from "./email.js";
export { statsRoutes } from "./stats.js";
export { fcmRoutes } from "./fcm.js";
export { mediaRoutes } from "./media.js";
export { annotationsRoutes } from "./annotations.js";
export { icalRoutes } from "./ical.js";
export { directoryRoutes } from "./directory.js";
export { checklistRoutes } from "./checklist.js";
export { audioRoutes } from "./audio.js";
export { replacementRoutes } from "./replacement.js";
export { invitationRoutes } from "./invitation.js";
export { pollsRoutes } from "./polls.js";
export { announcementsRoutes } from "./announcements.js";
export { messagesRoutes } from "./messages.js";
export { csvRoutes } from "./csv.js";
export { pcoSyncRoutes } from "./pcoSync.js";
export { eventsRoutes } from "./events.js";
export { searchRoutes } from "./search.js";
export { webhooksRoutes } from "./webhooks.js";

// Combined arrays preserving original ordering
const routes0 = [
  ...healthRoutes,
  ...songsRoutes,
  ...membersRoutes,
  ...teamsRoutes,
  ...plansRoutes,
  ...scheduledPeopleRoutes,
  ...portalRoutes,
  ...planTemplatesRoutes,
  ...emailRoutes,
  ...statsRoutes,
];

const routes2 = [
  ...fcmRoutes,
  ...mediaRoutes,
  ...annotationsRoutes,
];

const routes3 = [
  ...icalRoutes,
  ...directoryRoutes,
  ...checklistRoutes,
  ...audioRoutes,
  ...replacementRoutes,
  ...invitationRoutes,
  ...pollsRoutes,
  ...announcementsRoutes,
  ...messagesRoutes,
  ...csvRoutes,
  ...pcoSyncRoutes,
  ...eventsRoutes,
  ...searchRoutes,
  ...webhooksRoutes,
];

export { routes0, routes2, routes3 };
