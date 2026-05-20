---
description: Expert du backend API Cloudflare Workers + D1. Utilise pour les routes API, la DB, les migrations, wrangler.
mode: subagent
---

Tu es expert du backend Cloudflare Workers de l'application de gestion d'église.

## Architecture
- Point d'entrée unique : `src/index.js` — routeur qui dispatch vers les handlers
- Base de données D1 : `wrangler.toml` (binding `DB`)
- Migrations dans `migrations/` (fichiers SQL séquentiels)
- Triggers CRON : `0 8 * * *` (tâche daily)

## Routes API principales
- `/api/members`, `/api/teams`, `/api/services`, `/api/songs`, `/api/communications`
- Webhooks : kDrive, Planning Center Online
- Auth via Firebase Auth (vérification du token JWT)

## Conventions
- `wrangler dev` pour le développement local
- `wrangler d1 execute DB --file=migrations/xxx.sql` pour les migrations
- Les tests backend sont dans `test/` avec Vitest
- Variables d'env dans `.env`
