# TODO — Mise à jour après passe complète

## ✅ Réalisé (Mai 2026)

### Configuration & Déploiement
- [x] Réparé le script `test:api` (pointait vers .js au lieu de .ts)
- [x] Unifié la configuration Vitest (conflit .ts/.js résolu)
- [x] Ajouté route 404 catch-all dans le router

### Tests
- [x] Backend : 58 tests (ajout auth, RBAC, CORS, OneClick, rate limiter, iCal, pagination, SQL builder)
- [x] Frontend : 62 tests vitest **→ 62/62 ✅** (App.test.ts réparé, mock createRouter manquant)
- [x] E2E checkin-guest : **PASS** (mock API via addInitScript, flux invité complet)
- [x] Test frontend api.test.ts réparé (résilient à l'environnement de dev)

### Backend
- [x] Church Events : Ajout POST /api/church-events (création)
- [x] Church Events : Ajout DELETE /api/church-events/:id (suppression)
- [x] Church Events : Filtre date (from/to) sur GET
- [x] Church Events PUT : 16 champs supportés (était 7)

### Frontend
- [x] api.ts : Suppression des catch(()=>{}) silencieux
- [x] types.ts : Ajout 30+ interfaces manquantes (Poll, Announcement, Webhook, ChurchEvent, etc.)
- [x] api.ts : Ajout createChurchEvent, deleteChurchEvent
- [x] Router : Route guard clarifiée, 404 catch-all, publicRoutes exporté
- [x] transpose.ts : Bug regex transposant les lettres dans les paroles corrigé
- [x] Firebase : try/catch pour clé API manquante
- [x] App.vue : Login conditionnel via publicRoutes
- [x] CheckInView.vue : data-testid, v-model, template fixés
- [x] Toasts.vue : role=status / aria-live ajoutés
- [x] Locales : clés checkin.success/api_error/duplicate/window_error/removed/validation_missing

### Nettoyage
- [x] Rapport complet (RAPPORT_AMELIORATION.md)
- [x] Migration TODO.md dans ce fichier
- [x] Supprimé `audioop/`, `pyaudioop/`, `tmp_test.py`, `STANDALONE_APPS.md`

## ⏳ Restant (Prioritaire) — pour GPT-4.1 / 5 Mini

### Critique backend
- [ ] Remplacer le rate limiter in-memory par D1 ou KV
- [ ] Ajouter pagination sur GET lists (/api/songs, /api/members, etc.)
- [ ] Vérification RBAC systématique sur toutes les routes CRUD
- [ ] Découper src/index.js en modules séparés (auth, routes/, services/)

### Important
- [ ] Supprimer `require('node:crypto')` (dead code Workers)
- [ ] Backup endpoint : limiter à N résultats ou paginer

### E2E restants (13 spec files à vérifier)
- [ ] `api.spec.ts`, `checkin.spec.ts`, `demo-tour.spec.ts`, `home.spec.ts`, `navigation.spec.ts`, `plans.spec.ts`, `search.spec.ts`, `pco-use-cases.spec.ts`, `debug*.spec.ts`

### Fonctionnalités (frontend)
- [ ] Finaliser l'authentification réelle
- [ ] Pagination MembersList, PlansList, HouseGroupsList
- [ ] Découper MusicStandView.vue (1279 lignes)

## 🔮 Idées (Non Prioritaire)
- [ ] Migration TypeScript du backend
- [ ] Stores Pinia (`defineStore`)
- [ ] Export iCal church-events
- [ ] Cache API côté frontend
