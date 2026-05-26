# 📈 Roadmap Globale — église-app « Prod ready »

## Vision
Créer l’outil de gestion d’église francophone le plus complet, moderne et fiable (inspiré de Planning Center), prêt pour une exploitation réelle en production.

---

## Sections stratégiques

### 1. Pagination (fait)
- Pages membres, plannings, groupes : pagination API + UI factorisée, fallback legacy supporté.
- Tests de non-régression OK.

### 2. MusicStand (en cours)
- Découpage composants (toolbar, browser, métronome, setlist, PDF…)
- Factorisation TS/props/emit, typage strict
- QA UI/UX, mode kiosque, responsive, bugfix UX

### 3. RBAC UI (à finaliser)
- Gating boutons/actions selon rôle utilisateur
- Vérification stricte droits via store + guards
- Tests unitaires par permission critique

### 4. Tests Firebase (à corriger)
- Corriger test d’intégration frontend/api-utils.test.ts
- Patcher testenv pour la CI + workflows auto

### 5. QA finale (à faire)
- Parcours exhaustif utilisateur, strict
- Test multi-role, audit accessibilité/minima
- Rapport release

### 6. Emails & notifications (à auditer / compléter)
Voir section dédiée ci-dessous.

### 7. Accessibilité (à vérifier)
- Couleur WCAG AA boutons/inputs
- Focus visible partout (navig. clavier)
- Contrastes, aria-labels et titres partout

### 8. Performance (à vérifier)
- Audit Lighthouse/PWA score >90
- Lazy loading components/assets
- Optimisation requêtes backend

### 9. Sécurité (à valider)
- RGPD, stockage cookies local
- Rate limiting vérifié, RBAC effectif
- Secrets API isolés, logs d’accès backend

---

## Emails & Notifications

- [ ] Vérifier que les membres reçoivent bien les emails lorsqu’ils sont assignés à un service
- [ ] Vérifier la configuration du mailer backend (SendGrid / Mailgun / SMTP)
- [ ] Vérifier les templates email (HTML + texte)
- [ ] Ajouter un test d’intégration “assignation → email envoyé”
- [ ] Ajouter un fallback si email invalide
- [ ] Ajouter un log clair en cas d’échec d’envoi
- [ ] Ajouter un bouton “renvoyer l’email” dans l’UI admin
- [ ] Ajouter une page “Historique des notifications” (optionnel)

---

## Fonctionnalités attendues (roadmap)

- [ ] Notifications email pour les services
- [ ] Notifications email pour les répétitions
- [ ] Notifications email pour les changements de planning
- [ ] Export PDF du planning (optionnel)
- [ ] Page “Mes services” pour chaque membre
- [ ] Page “Mes groupes”
- [ ] Page “Mes permissions” (RBAC UI)
- [ ] Mode offline (optionnel)
- [ ] Mode présentation (optionnel)
