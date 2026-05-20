# Église App — Système de Gestion d'Église (Cieux Ouverts)

Application complète de gestion d'église (inspirée de Planning Center Online).
Déployée sur Cloudflare Workers + Pages.

## Stack

- **Frontend** : Vue 3 + TypeScript + Vite + TailwindCSS v4
- **Router** : Vue Router
- **i18n** : Vue i18n (FR/EN)
- **Backend** : Cloudflare Workers (API router, fichier unique `src/index.js`)
- **Database** : Cloudflare D1 (SQL)
- **Auth** : Firebase Auth (token Google vérifié via `oauth2.googleapis.com/tokeninfo`)
- **Déploiement** : Wrangler → Cloudflare Workers + Pages
- **Tests** : Vitest (backend) + Playwright (E2E frontend)
- **PWA** : vite-plugin-pwa

## URLs

- **Production** : https://eglise-app.pages.dev
- **API Worker** : https://eglise-app.belletonv.workers.dev
- **Site public** : https://eglise-cieux-ouverts.pages.dev
- **GitHub** : https://github.com/vicforafrique/eglise-app

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
- Plus de données mockées — tout passe par l'API / D1

## Structure

- `frontend/` — Application Vue 3 SPA
  - `src/` — Composants, vues, stores, router, locales
  - `public/` — Assets statiques (favicons, logos, manifest)
  - `e2e/` — Tests Playwright
- `src/` — API Cloudflare Worker (`index.js`, ~3600 lignes)
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
- Webhooks, invitations, iCal export, backup JSON

## PCO Sync

- **Endpoint** : `POST /api/pco-sync`
- **Frontend** : `/pco-sync` (vue PcoSyncView)
- **Secrets** : `PCO_TOKEN_ID` + `PCO_TOKEN_SECRET` dans Cloudflare Secrets
- Sync : service types → plans → personnes → chants + arrangements (avec chord_chart)

## Conventions

- Frontend dev : `cd frontend && npm run dev` → http://localhost:5173
- Backend dev : `wrangler dev` → http://localhost:8787
- Audio-splitter : voir `/Users/vic/Downloads/audio-splitter/` (serveur Whisper sur :8765)
- Variables d'env dans `.env`, secrets Cloudflare via `wrangler secret put`

## ⚠️ Problèmes connus

- **Rate limiter** : in-memory, pas fiable en serverless
- **Erreurs silencieuses** : plusieurs `catch(() => {})` dans le worker
- **Créations de tables dans les handlers** : certaines migrations manquantes
- **Code mort** : `audioop/`, `pyaudioop/` — shims Python inutilisés
