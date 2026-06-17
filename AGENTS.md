# Église App — Système de Gestion d'Église (Cieux Ouverts)

Application complète de gestion d'église (inspirée de Planning Center Online).
Déployée sur Cloudflare Workers + Pages.

## Stack

- **Frontend** : Vue 3 + TypeScript + Vite v6 + TailwindCSS v4
- **Router** : Vue Router
- **i18n** : Vue i18n (FR/EN)
- **Backend** : Cloudflare Workers (API : `src/index.js` (174 lignes) + `lib.js` + modules dans `src/routes/`)
- **Database** : Cloudflare D1 (SQL)
- **Auth** : Firebase Auth + RBAC (7 rôles, guard global POST/PUT/DELETE)
- **Rate limiter** : D1-based (table `api_rate_limits`)
- **Déploiement** : Wrangler → Cloudflare Workers + Pages
- **Tests** : Vitest backend (562 tests ✅ - 41 files, tous les 27 modules routes + 10 nouveaux) + Vitest frontend (251 tests ✅ - 30 files) + Playwright E2E (106 tests ✅ - 20 spec files) — 919 tests total, 0 vulns ✅
- **PWA** : vite-plugin-pwa

## URLs

- **Production** : https://eglise-app.pages.dev
- **API Worker** : https://eglise-app.belletonv.workers.dev
- **Site public** : https://eglise-cieux-ouverts.pages.dev
- **GitHub** : https://github.com/belletonv-cloud/eglise-app

## Déploiement (CI/CD)

- **Branche** : `main`
- **Push sur main** → GitHub Actions déploie automatiquement :
  - `frontend/` → Cloudflare Pages (`wrangler pages deploy dist --project-name=eglise-app`)
  - `src/index.js` → Cloudflare Workers (`wrangler deploy`)
- **Ne pas push sur `master`** — seul `main` déclenche le déploiement.

## Démo interactive

- **Mode démo** : accessible via `/demo-tour` ou bouton "🕊️ Démo connectée"
- **Connecté à l'API réelle** : le mode démo appelle l'API via `x-demo-email: admin@cieuxouverts.bzh`
- **Le backend auto-crée l'utilisateur** (admin) au premier appel
- **Phase 2** : Intercepteur GET dans `api.ts` → mock data de `demoData.ts` (20+ patterns)
- **Phase 3** : Demo Guide interactif (highlight pulse, action buttons, auto-demo play)
  - `useDemoHighlighter.ts` — overlay animé + scrollIntoView
  - `DemoGuide.vue` — stepper visuel, actions "Essayez", auto-play 5s
  - i18n : guide_auto, guide_pause, action_member/plan/song
  - CSS : `@keyframes demo-pulse` dans main.css

## Structure

- `frontend/` — Application Vue 3 SPA
  - `src/` — Composants, vues, stores, router, locales
  - `public/` — Assets statiques (favicons, logos, manifest)
  - `e2e/` — Tests Playwright
- `src/` — API Cloudflare Worker (`index.js` + modules)
  - `index.js` — Bootstrap (174 lignes : router, RBAC guard, cron reminders)
  - `lib.js` — Utilitaires partagés (CORS, json, getBody, csv, etc.)
  - `auth.js` — Firebase Auth + RBAC (ROLE_PERMISSIONS, hasPermission, requirePermission)
  - `rate-limit.js` — Rate limiter D1 (table api_rate_limits)
  - `oneclick.js` — OneClick tokens (Web Crypto HMAC SHA-256)
  - `kdrive.js` — kDrive file operations
  - `webhooks.js` — Webhook triggers + retries
  - `logger.js` — API call logging
  - `routes.js` — `route()` helper
  - `pco.js` — PCO fetch helpers
  - `routes/` — 27 modules par domaine (songs, members, plans, etc.)
- `migrations/` — Migrations D1
- `scripts/` — Scripts d'import, export PCO, génération SQL
- `docs/` — Documentation technique
- `test/` — Tests backend (Vitest)

## Modules fonctionnels

- Membres et équipes (RBAC : admin, scheduler, editor, music_director, volunteer, viewer)
- Planning des services avec templates et gestion de conflits
- Music Stand : ChordPro, transposition ±12, métronome, auto-scroll, mode kiosque
- Check-in / QR code / suivi de présence
- Groupes de maison, annonces, sondages
- Emails en masse (Resend), notifications push (FCM)
- Synchronisation PCO : `POST /api/pco-sync` (nécessite PCO_TOKEN_ID + PCO_TOKEN_SECRET)
- PCO People sync : `POST /api/pco-sync-people` (admin only) — enrichit les membres avec email/téléphone depuis PCO People via `pco_id` ou nom
- RGPD : `GET /api/members/:id/gdpr-export` (export JSON complet), `POST /api/members/:id/gdpr-erase` (anonymisation), `PUT /api/members/:id/consent` (consentement)
- Migration 020 : ajoute `consent_data_sharing`, `consent_photo`, `consent_communication`, `data_origin`, `gdpr_data_exported_at`, `gdpr_erased_at` à la table `members`
- Webhooks, invitations, iCal export, backup JSON

## PCO Sync

- **Endpoint** : `POST /api/pco-sync`
- **PCO People** : `POST /api/pco-sync-people` (admin only) — enrichit email/téléphone
- **Frontend** : `/pco-sync` (vue PcoSyncView avec carte "People sync")
- **Secrets** : `PCO_TOKEN_ID` + `PCO_TOKEN_SECRET` dans Cloudflare Secrets
- Sync : service types → plans → personnes → chants + arrangements (avec chord_chart)

## RGPD / GDPR

- **Consent UI** : onglet "RGPD" dans `AdminMembers.vue` — checkboxes consentement + export JSON + anonymisation
- **Endpoints** :
  - `GET /api/members/:id/gdpr-export` — export complet (membre, équipes, présences, services)
  - `POST /api/members/:id/gdpr-erase` — anonymisation (champs vidés, `gdpr_erased_at` set)
  - `PUT /api/members/:id/consent` — mise à jour `consent_data_sharing`, `consent_photo`, `consent_communication`
- **Migration** : `migrations/020_rgpd_consent.sql` (à appliquer manuellement via `wrangler d1 execute`)

## Conventions

- Frontend dev : `cd frontend && npm run dev` → http://localhost:5173
- Backend dev : `wrangler dev` → http://localhost:8787
- Audio-splitter : voir `/Users/vic/Downloads/audio-splitter/` (serveur Whisper sur :8765)
- Variables d'env dans `.env`, secrets Cloudflare via `wrangler secret put`

## ✅ Migrations

- **020_rgpd_consent.sql** : déjà appliquée (colonnes existantes)
- **021_fcm_tokens.sql** : appliquée le 15/06/2026

## Notes d'architecture (10 juin 2026)

- `src/index.js` splitté de 6705 → **174 lignes** : ne contient plus que le router, le RBAC guard, et le handler cron
- **27 modules** dans `src/routes/` par domaine fonctionnel, ordonnés via `routes/index.js` (barrel)
- Chaque module importe ce dont il a besoin depuis `../lib.js`, `../auth.js`, etc.
- Variable `router` (dead code, createRouter avec routes0+routes2 uniquement) supprimée
- Les helpers `acquireSyncLock`/`releaseSyncLock` déplacés dans `src/routes/pcoSync.js`
- `callAudioSplitter` copié dans `src/routes/audio.js`
- **562 tests backend** ✅ (41 files, tous les 27 modules routes + 10 nouveaux), **251 tests frontend** ✅ (30 files), **type-check 0 erreurs** ✅
- `vitest.config.js` (dead config, référençait `test/` inexistant) supprimé le 14/06/2026

## Refactoring 14/06/2026

### MusicStandView.vue (−597 lignes)
- **Composables extraits** : `useTransposition`, `useChordParser`, `useMetronome`, `useAutoScroll`
- **Sous-composants extraits** : `MusicStandSettings`, `MusicStandNotes`
- **Composants existants intégrés** : `MusicStandToolbar`, `MusicStandSongBrowser` (étaient définis inline)
- **Résultat** : 1523 → 926 lignes

### API Proxy pagination fixé
- `tryCall()` dans `api.ts` retournait seulement `json.data` pour les routes `isList` → perte de `page`/`size`/`totalCount`
- Fix : retourne le payload complet `{ data, page, size, totalCount }`
- 17 vues mises à jour pour utiliser `response.data`
- PlansList.vue utilise désormais `response.totalCount` pour la pagination

## ⚠️ Problèmes connus

- **Rate limiter** : D1-based (OK), mais cleanup compare `window_start` (number) avec `cutoff` (ISO string) — fixé le 29/05
- **Erreurs silencieuses** : ~13 `catch { /* ignore */ }` remplacés par `console.warn` (14/06/2026) — restent 58 `catch(e){console.error}` backend (log, pas re-throw, OK fonctionnellement)
- **Créations de tables dans les handlers** : résolu — toutes les migrations sont dans `migrations/`
- **Code mort** : `audioop/`, `pyaudioop/` — shims Python inutilisés
- **i18n** : clés `help.*_step*` manquantes (20 clés) — ajoutées le 29/05
- **CI/CD** : `deploy.yml` référence des jobs d'un autre workflow — fixé le 29/05
- **CI** : tests backend limités à `helpers.test.js` — fixé le 29/05
- ~~**Secrets commits** : `.env` et `frontend/.env` ne sont PAS trackés par git (vérifié le 15/06/2026) — pas un problème~~ ✅

## ✅ Final cleanup (15/06/2026)
- pcoSync.js deploy blocker fixed (TypeScript annotations removed from JS file)
- npm audit fix applied (4 vulns: 1 critical shell-quote, 2 high @grpc/grpc-js/dompurify, 1 moderate protobufjs) — 0 remaining
- 10 new backend test files (84 tests): csv, messages, scheduledPeople, pcoSync, invitation, directory, fcm, lib, rate-limit, webhooks
- 6 new frontend test files (45 tests): useTransposition, useChordParser, useMetronome, useAutoScroll, api-members, api-plans
- Error boundary added to App.vue (onErrorCaptured + toast)
- Stale cleanup: music-service/ removed, 11 non-migration SQL → migrations/archive/, 15 scripts → scripts/archive/
- Integration test removed (depended on deleted music-service/)
- AGENTS.md cleaned: migrations section updated (both applied), secrets warning resolved
- **Input validation**: shared `validate.js` utility created, validation added to ALL 27 backend route handlers (POST/PUT/GET with path params)
- **7 new E2E test files (39 tests)**: songs (5), music-stand (8), plans-flow (7), calendar (6), events (7), members-flow (3), email-compose (3)
- **Total project tests** : 562 backend + 251 frontend + 250 E2E = **1 063 tests** ✅
