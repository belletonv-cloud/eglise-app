# TODO — Configuration & Déploiement

## ✅ Fait

- [x] Firebase Auth configuré (API key, Auth domain, etc. dans `.env`)
- [x] VAPID key générée et configurée
- [x] Backend Worker déployé sur `https://eglise-app.belletonv.workers.dev`
- [x] D1 database créée (eglise-db) — 317 songs, 321 arrangements importés
- [x] Secrets Cloudflare : `RESEND_API_KEY`, `EMAIL_FROM`, `FCM_SERVER_KEY`, `INFOMANIAK_TOKEN`
- [x] Resend email fonctionnel (envoi depuis contact@cieuxouverts.bzh)
- [x] kDrive Infomaniak upload/download/delete fonctionnel (token API scope `drive`)
- [x] Frontend déployé sur Cloudflare Pages : `https://eglise-app.pages.dev`
- [x] PWA : `vite-plugin-pwa` avec generateSW, NetworkFirst API
- [x] Confirm dialog global (store + composant)
- [x] Bug fix : `requireId`, `dbFirst`, `dbAll` ajoutés
- [x] `_headers` + `_redirects` (SPA fallback) créés
- [x] `.env` frontend renseigné avec clés réelles
- [x] FCM notifications refactor : extraction du token depuis l'endpoint PushSubscription
- [x] Secret `INFOMANIAK_CLIENT_ID`/`INFOMANIAK_CLIENT_SECRET` supprimés (remplacés par `INFOMANIAK_TOKEN`)
- [x] GitHub Actions workflow créé et connecté (`.github/workflows/deploy.yml`)
- [x] Dashboard comme page d'accueil
- [x] Mode kiosque (affichage public plein écran)
- [x] Annotations partagées/privées sur les grilles d'accords
- [x] Permissions fines (RBAC) avec permissions par plan et par chant

## À faire

### Email (Resend)
- [ ] Vérifier le domaine `cieuxouverts.bzh` sur Resend (ajouter les enregistrements DNS)

### Infomaniak kDrive
- [ ] Upload test depuis l'app frontend

### Fonctionnalités futures
- [ ] Export PDF des grilles d'accords
- [ ] Planning des services avec disponibilités
- [ ] Demandes de remplacement automatiques
- [ ] Internationalisation (i18n) complète
