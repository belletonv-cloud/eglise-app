# 🏛️ Eglise App - Système de Gestion d'Église

✏️ **Documentation complète du module “Ministères / Teams” : voir `/docs/ministeres-teams.md`**

(Suite : contenu existant...)

---

## 🔒 API Sécurisée (RBAC) & Pagination

**Toutes les routes critiques de l’API backend sont :**
- protégées par RBAC (Role-Based Access Control) — chaque action POST/PUT/DELETE nécessite une permission adaptée selon le rôle utilisateur : voir `src/auth.js`
- paginées sur toutes les listes volumineuses pour robustesse, performance et scalabilité

### 🔐 RBAC (Role-Based Access Control)
- Chaque action CRUD critique vérifie les permissions dès l’entrée d’un handler (ex: `requirePermission(request, env, 'manage_members')` pour backup, `edit_members` pour /members, etc.)
- Permissions affectées par rôle (admin, scheduler, editor, music_director, volunteer, viewer)
- Tout accès non autorisé retourne une erreur 403.
- Voir spécifications : `src/auth.js`, tests backend/backend-rbac.test.ts

### 📃 Pagination Standardisée
- Toutes les routes listant des membres, plans, événements, annonces, équipes, groupes, présences, messages, etc., utilisent la pagination page/size/totalCount côté backend.
- Paramètres GET attendus :
    - `page` (défaut 1), `size` (défaut 25, max 100)
    - Réponse JSON type :
      ```json
      {
        "data": [ { ... }, ... ],
        "page": 1,
        "size": 25,
        "totalCount": 132
      }
      ```
- Si la page out-of-range, retourne data: [].
- Documenté pour :/api/members, /api/plans, /api/announcements, /api/teams, /api/house-groups, /api/attendances, /api/polls, /api/messages/inbox, /api/church-events, etc.
- **Exemple** :
  ```bash
  curl 'https://eglise-app.belletonv.workers.dev/api/church-events?page=2&size=10' -H "Authorization: Bearer <token>"
  ```
- **totalCount** disponible pour toutes paginations pour un affichage précis côté Front.

### 🧪 Tests & Contrats Quality
- Tous les helpers/patterns RBAC & pagination sont testés et couverts par :`tests/backend/*.test.ts`
- Ajouter un nouveau test : dupliquez un fichier dans `tests/backend/`, adapte le mock, `npm run test`.
- Aucun patch RBAC/pagination n’est déployé sans test associé.

### 🎨 Intégration Frontend
- Pour proposer des listes efficaces, consommez les endpoints paginés avec page/size, bouclez tant que data.length == size (lazy-load, infinite scroll, pagination UI…)
- Toujours exploiter totalCount pour paginators ou indiquer « fin des résultats ».
- Toute requête liste (membres, équipes, plans, etc.) doit envoyer page/size adéquats pour performance.

---

**Conventions maintenues et vérifiées dans la CI : sécurité stricte, pagination exhaustive, robustesse tests.**

(Suite : contenu existant...)
