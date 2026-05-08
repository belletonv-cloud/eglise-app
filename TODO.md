# TODO — Configuration & Déploiement

## 1. Configuration Firebase

- [ ] Créer un projet Firebase sur https://console.firebase.google.com
- [ ] Activer **Authentication** (sign-in method: Email + Google)
- [ ] Activer **Cloud Messaging** (pour push notifications)
- [ ] Copier les clés dans `frontend/.env` :
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`

## 2. VAPID Keys (Web Push)

- [ ] Dans Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
- [ ] Générer une paire de clés VAPID
- [ ] Copier la clé publique dans `frontend/.env` : `VITE_VAPID_PUBLIC_KEY`
- [ ] Copier la clé privée (pour le serveur) dans Cloudflare Worker secret : `FCM_SERVER_KEY`

## 3. Cloudflare R2 (upload média)

- [ ] Créer un bucket R2 : `wrangler r2 bucket create eglise-app-media`
- [ ] Ajouter le binding dans `wrangler.toml` :
```toml
[[r2_buckets]]
binding = "MEDIA"
bucket_name = "eglise-app-media"
```

## 4. Cloudflare Workers — Secrets

- [ ] Déployer le backend Workers via `wrangler deploy`
- [ ] Ajouter les secrets :
  - `RESEND_API_KEY` (envoi d'emails)
  - `EMAIL_FROM` (adresse expéditeur)
  - `FCM_SERVER_KEY` (envoi de notifications push)
- [ ] Lier la D1 database (`DB` binding dans `wrangler.toml`)

## 5. Cloudflare Pages — Déploiement frontend

- [ ] Connecter le dépôt GitHub à Cloudflare Pages
- [ ] Configurer les variables d'environnement dans Pages :
  - `VITE_FIREBASE_*` (toutes les clés Firebase)
  - `VITE_VAPID_PUBLIC_KEY`
- [ ] Commande de build : `npm run build`
- [ ] Répertoire de build : `dist`

## 6. Base de données (D1)

- [ ] Créer la DB : `wrangler d1 create eglise-app`
- [ ] Importer le schéma : `wrangler d1 execute eglise-app --file=schema.sql`
- [ ] Importer les données PCO : `wrangler d1 execute eglise-app --file=pco_export_chants/arrangements_clean.sql`

## 7. Tests & Validation

- [ ] Tester envoi d'email via le formulaire `/email`
- [ ] Tester l'éditeur ChordPro (ouvrir un chant > Éditer > sauvegarder)
- [ ] Tester le mode offline (ouvrir un chant > "Offline" > couper le réseau > vérifier)
- [ ] Tester l'upload média (nécessite R2 configuré)
- [ ] Tester les notifications push (nécessite VAPID + FCM configuré)
- [ ] Vérifier le service worker (install, cache, affichage offline)

## 8. Fonctionnalités futures (post-MVP)

- [ ] Importer les données depuis Planning Center (PCO API)
- [ ] Export PDF des grilles d'accords
- [ ] Annotations partagées / privées
- [ ] RBAC (permissions fines par plan et par chant)
- [ ] Planning des services avec disponibilités
- [ ] Demandes de remplacement automatiques
- [ ] Page d'accueil avec dashboard
- [ ] Internationalisation (i18n)
- [ ] Mode sombre
- [ ] CI/CD (GitHub Actions → déploiement auto)
