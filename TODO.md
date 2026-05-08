# TODO — Configuration & Déploiement

## ✅ Fait

- [x] Firebase Auth configuré (API key, Auth domain, etc. dans `.env`)
- [x] VAPID key générée et configurée
- [x] Backend Worker déployé sur `https://eglise-app.belletonv.workers.dev`
- [x] D1 database créée (eglise-db) — 317 songs, 321 arrangements importés
- [x] Secrets Cloudflare : `RESEND_API_KEY`, `EMAIL_FROM`, `FCM_SERVER_KEY`, `INFOMANIAK_TOKEN`
- [x] Resend email fonctionnel (envoi à belletonv@gmail.com)
- [x] kDrive Infomaniak upload/download/delete fonctionnel (token API scope `drive`)
- [x] Frontend déployé sur Cloudflare Pages : `https://eglise-app.pages.dev`
- [x] PWA : `vite-plugin-pwa` avec generateSW, NetworkFirst API
- [x] Confirm dialog global (store + composant)
- [x] Bug fix : `requireId`, `dbFirst`, `dbAll` ajoutés
- [x] `_headers` + `_redirects` (SPA fallback) créés
- [x] `.env` frontend renseigné avec clés réelles
- [x] FCM notifications refactor : extraction du token depuis l'endpoint PushSubscription
- [x] Secret `INFOMANIAK_CLIENT_ID`/`INFOMANIAK_CLIENT_SECRET` supprimés (remplacés par `INFOMANIAK_TOKEN`)
- [x] GitHub Actions workflow créé (`.github/workflows/deploy.yml`)

## À faire

### CI/CD
- [ ] Ajouter les secrets GitHub nécessaires (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, variables Firebase)
- [ ] Optionnel : connecter le dépôt GitHub directement dans Cloudflare Pages (plus simple)

### Email (Resend)
- [ ] Vérifier un domaine sur Resend pour envoyer à d'autres destinataires que `belletonv@gmail.com`

### Infomaniak kDrive
- [ ] Upload test depuis l'app frontend

### Fonctionnalités futures (post-MVP)
- [ ] Export PDF des grilles d'accords
- [ ] Annotations partagées / privées
- [ ] RBAC (permissions fines par plan et par chant)
- [ ] Planning des services avec disponibilités
- [ ] Demandes de remplacement automatiques
- [ ] Page d'accueil avec dashboard
- [ ] Internationalisation (i18n)
- [ ] Mode sombre
