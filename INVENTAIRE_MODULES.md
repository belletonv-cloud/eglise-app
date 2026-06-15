INVENTAIRE MODULES — Église App

But: inventaire concis "module → endpoints → tables → dépendances" extrait de src/index.js + migrations/*.sql.

Notes générales:
- API root: /api/* (Cloudflare Worker single-file router: src/index.js)
- Headers utiles: x-demo-email (demo mode), X-Auth-Secret / x-user-email (dev fallback), x-audio-token (audio-splitter webhook), x-internal-sync (internal PCO trigger)
- Frontend API base: import.meta.env.VITE_API_BASE (frontend/src/utils/api.ts)

Module: Music (Songs & Arrangements)
- Endpoints: GET /api/songs, GET /api/songs/:id, PUT /api/arrangements/:id, GET /api/arrangements/:id/media, GET /api/arrangements/:id/annotations, POST /api/arrangements/:id/annotations
- Tables: songs, arrangements, arrangement_annotations, attachments, plan_songs
- Dépendances externes: kDrive (INFOMANIAK_TOKEN + KDRIVE_* env), audio-splitter for audio processing

Module: Members (annuaire & profil)
- Endpoints: GET /api/members, POST /api/members, GET /api/members/:id, PUT /api/members/:id, DELETE /api/members/:id, PUT /api/members/:id/role, GET /api/me, PUT /api/me, GET /api/me/schedule
- Tables: members, team_members, member_exceptions, member_firebase
- Dépendances externes: Firebase tokeninfo (oauth2.googleapis.com/tokeninfo)

Module: Teams
- Endpoints: GET /api/teams, POST /api/teams, GET /api/teams/:id, PUT /api/teams/:id, DELETE /api/teams/:id, POST /api/teams/:id/members, PUT /api/teams/:tid/members/:mid, DELETE /api/teams/:tid/members/:mid
- Tables: teams, team_members

Module: Service Types
- Endpoints: GET /api/service-types
- Tables: service_types

Module: Plans (calendrier & détail)
- Endpoints: GET /api/plans, GET /api/plans/:id, POST /api/plans, PUT /api/plans/:id, DELETE /api/plans/:id, GET /api/plans/:id/ical
- Tables: plans, service_types, plan_items, plan_songs, plan_audio_segments, plan_audio_songs
- Dépendances externes: PCO Sync (see module PCO)

Module: Plan Items & Setlist
- Endpoints: GET /api/plans/:id/items, POST /api/plans/:id/items, PUT /api/plan-items/:id, DELETE /api/plan-items/:id, GET /plans/:id/setlist
- Tables: plan_items, plan_songs, arrangements, songs

Module: Scheduling (Scheduled People)
- Endpoints: GET /api/plans/:id/scheduled-people, POST /api/plans/:id/scheduled-people, PUT /api/plans/:pid/scheduled-people/:sid, DELETE /api/plans/:pid/scheduled-people/:sid, GET /api/plans/:id/replacements/:scheduledId, POST /api/plans/:id/replacements/:scheduledId
- Tables: scheduled_people, scheduled_conflict_logs
- Notes: authorization via hasPermission(request, env, 'schedule' / 'force_schedule')

Module: Attendances / Check-in / Kiosk
- Endpoints: GET /api/attendances, POST /api/attendances, GET /api/attendances/:id, PUT /api/attendances/:id, DELETE /api/attendances/:id, GET /api/plans/:pid/attendances, GET /api/attendance-stats
- Tables: attendances, members, plans

Module: House Groups
- Endpoints: GET /api/house-groups, POST /api/house-groups, GET /api/house-groups/:id, PUT /api/house-groups/:id, DELETE /api/house-groups/:id, POST /api/house-groups/:gid/members, DELETE /api/house-groups/:gid/members/:mid, GET/POST /api/house-groups/:gid/meetings
- Tables: house_groups, group_members, group_meetings

Module: Email (Templates, Logs, Bulk)
- Endpoints: GET/POST/PUT/DELETE /api/email-templates, GET /api/email-logs, POST /api/email-logs, POST /api/send-email, POST /api/send-bulk-email
- Tables: email_templates, email_logs
- Dépendances externes: Resend API (RESEND_API_KEY), env EMAIL_FROM

Module: Invitations & Member Firebase link
- Endpoints: POST /api/invitations, GET /api/invitations/:token, POST /api/invitations/:token/redeem, GET /api/me/firebase-status
- Tables: invitation_tokens, member_firebase, members

Module: One-click tokens / Email one-clicks
- Endpoints: POST /api/oneclick
- Tables: email_oneclicks
- Notes: HMAC fallback with ONECLICK_SECRET

Module: Volunteer Preferences
- Endpoints: GET /api/volunteer-preferences/:memberId, PUT /api/volunteer-preferences/:memberId
- Tables: volunteer_preferences

Module: Plan Templates
- Endpoints: GET/POST/PUT/DELETE /api/plan-templates, GET/POST /api/plan-templates/:id/items, POST /api/plan-templates/:id/apply, PUT/DELETE /api/plan-template-items/:id
- Tables: plan_templates, plan_template_items

Module: Checklists (templates + per-plan)
- Endpoints: GET /api/checklist-templates, POST /api/checklist-templates, DELETE /api/checklist-templates/:id, POST /api/checklist-templates/:id/items, DELETE /api/checklist-template-items/:id, GET/POST/PUT/DELETE /api/plans/:id/checklist and /api/plan-checklists/:id
- Tables: checklist_templates, checklist_template_items, plan_checklists

Module: Audio (sermon audio + segments)
- Endpoints: POST /api/plans/:id/audio, GET /api/plans/:id/audio, GET /api/plans/:id/audio/stream, DELETE /api/plans/:id/audio, GET/POST /api/plans/:id/audio-segments
- Tables: attachments, plan_audio_segments, plan_audio_songs, plans
- Dépendances externes: audio-splitter (AUDIO_SPLITTER_URL + AUDIO_SPLITTER_TOKEN), kDrive (INFOMANIAK_TOKEN)

Module: Notifications (FCM)
- Endpoints: POST /api/fcm/register, POST /api/fcm/send
- Tables: notification_tokens
- Dépendances externes: FCM_SERVICE_ACCOUNT

Module: Polls & Announcements
- Endpoints: GET/POST/DELETE /api/polls, POST /api/polls/:id/options, DELETE /api/poll-options/:id, POST /api/polls/:id/vote, DELETE /api/polls/:id/vote, GET/POST/PUT/DELETE /api/announcements
- Tables: polls, poll_options, poll_votes, announcements

Module: Internal Messaging
- Endpoints: POST /api/messages, GET /api/messages/inbox, GET /api/messages/:id, POST /api/messages/:id/read
- Tables: messages, message_recipients

Module: Webhooks
- Endpoints: GET/POST/PUT/DELETE /api/webhooks, GET /api/webhook-logs, POST /api/webhook/incoming/:token
- Tables: webhooks, webhook_logs
- Notes: scheduled worker processes retries (processWebhookRetries)

Module: Import / Export / Backup / CSV
- Endpoints: GET /api/export/:entity, POST /api/import/:entity, GET /api/backup
- Tables used for backup: members, teams, team_members, service_types, plans, plan_items, songs, arrangements, plan_songs, scheduled_people, attendances, house_groups, group_members, group_meetings, email_templates, email_logs, communication_preferences, notification_tokens, plan_templates, plan_template_items, volunteer_preferences, polls, poll_options, poll_votes, announcements, church_events

Module: Logs / Stats / Admin
- Endpoints: GET /api/stats, GET/POST /api/logs, GET /api/api-logs view via /api/logs (admin), GET /api/email-logs
- Tables: api_logs, email_logs

Module: Search
- Endpoints: GET /api/search?q=...
- Tables consulted: members, songs, plans, teams, announcements, church_events

Module: PCO Sync
- Endpoints: POST /api/pco-sync
- Tables: sync_locks, sync_state, plus pco_id / pco_updated_at columns added to members, teams, service_types, plans, plan_items, songs, arrangements, scheduled_people
- Notes: uses Planning Center API (PCO_TOKEN_ID, PCO_TOKEN_SECRET); chunky two-phase sync (pass1/pass2) persisted in sync_state

Module: Church Events
- Endpoints: GET /api/church-events, GET /api/church-events/:id, GET /api/church-events/:id/exceptions, PUT /api/church-events/:id, POST/DELETE exceptions
- Tables: church_events, church_event_exceptions

Module: Resource Permissions / RBAC
- Endpoints: GET/POST/DELETE /api/resource-permissions
- Tables: resource_permissions, member_exceptions

Module: Attachments / Upload
- Endpoints: POST /api/upload, GET /api/attachments/:id/file, DELETE /api/attachments/:id
- Tables: attachments
- Dépendances externes: kDrive APIs for file storage

Module: Misc / Utilities
- Endpoints: GET /api/directory, GET /api/attendance-stats, GET /api/plans/:id/qr-checkin, POST /api/oneclick, POST /api/send-email
- Tables: communication_preferences, invitation_tokens, member_firebase, email_oneclicks

Sécurité & infra
- Auth: Firebase ID token via Authorization: Bearer <id_token> (validated by oauth2.googleapis.com/tokeninfo) OR demo header x-demo-email OR dev fallback X-Auth-Secret + x-user-email
- Rate limiting: in-memory Map per IP request URL (simple limiter in src/index.js)
- Env / Secrets (extraits): RESEND_API_KEY, EMAIL_FROM, FCM_SERVICE_ACCOUNT (JSON), FIREBASE_PROJECT_ID, DEV_AUTH_SECRET, ONECLICK_SECRET, PCO_TOKEN_ID, PCO_TOKEN_SECRET, INFOMANIAK_TOKEN, KDRIVE_* , AUDIO_SPLITTER_TOKEN, AUDIO_SPLITTER_URL

Fichiers de référence clés:
- Backend router: src/index.js (single-file router, ~3800+ lines)
- Migrations: migrations/*.sql (tables & ALTERs; notable: 014_pco_sync.sql, 012_annotations_rbac.sql, 015_runtime_tables.sql)
- Frontend routes: frontend/src/router/index.ts (vue views mapping)

Observations / next actions possibles:
- Ce document est un inventaire technique — si tu veux, je peux: 1) produire une table CSV exhaustive endpoints→tables; 2) extraire automatiquement tous les chemins /api/... (fichier JSON); 3) proposer 3 modules prioritaires à découper (ex: Music, Scheduling, Polls/Announcements).
