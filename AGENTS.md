# Église App — Système de Gestion d'Église (Cieux Ouverts)

Application complète de gestion d'église (inspirée de Planning Center Online).
Déployée sur Cloudflare Workers + Pages.

## Stack

- **Frontend** : Vue 3 + TypeScript + Vite v6 + TailwindCSS v4
- **Router** : Vue Router
- **i18n** : Vue i18n (FR/EN)
- **Backend** : Cloudflare Workers (API router modulaire : `src/index.js` + `lib.js` + `auth.js` + `rate-limit.js` + `oneclick.js` + `kdrive.js` + `webhooks.js` + `logger.js` + `routes.js`)
- **Database** : Cloudflare D1 (SQL)
- **Auth** : Firebase Auth + RBAC (7 rôles, guard global POST/PUT/DELETE)
- **Rate limiter** : D1-based (table `api_rate_limits`)
- **Déploiement** : Wrangler → Cloudflare Workers + Pages
- **Tests** : Vitest backend (84 tests) + Vitest frontend (62 tests ✅) + Playwright E2E (checkin-guest ✅, 13 autres à vérifier)
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
- `src/` — API Cloudflare Worker (`index.js`, ~3628 lignes)
  - `lib.js` — Utilitaires partagés (CORS, json, getBody, csv, etc.)
  - `auth.js` — Firebase Auth + RBAC (ROLE_PERMISSIONS, hasPermission, requirePermission)
  - `rate-limit.js` — Rate limiter D1 (table api_rate_limits)
  - `oneclick.js` — OneClick tokens (Web Crypto HMAC SHA-256)
  - `kdrive.js` — kDrive file operations
  - `webhooks.js` — Webhook triggers + retries
  - `logger.js` — API call logging
  - `routes.js` — `route()` helper
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

## ⚠️ Migrations en attente

- **020_rgpd_consent.sql** : pas encore appliquée en prod. À faire : `wrangler d1 execute eglise-app --file=migrations/020_rgpd_consent.sql`

## ⚠️ Problèmes connus

- **Rate limiter** : D1-based (OK), mais cleanup compare `window_start` (number) avec `cutoff` (ISO string) — fixé le 29/05
- **Erreurs silencieuses** : plusieurs `catch(() => {})` dans le worker — la plupart sont des `console.error` simples sans re-throw
- **Créations de tables dans les handlers** : résolu — toutes les migrations sont dans `migrations/`
- **Code mort** : `audioop/`, `pyaudioop/` — shims Python inutilisés
- **i18n** : clés `help.*_step*` manquantes (20 clés) — ajoutées le 29/05
- **CI/CD** : `deploy.yml` référence des jobs d'un autre workflow — fixé le 29/05
- **CI** : tests backend limités à `helpers.test.js` — fixé le 29/05
