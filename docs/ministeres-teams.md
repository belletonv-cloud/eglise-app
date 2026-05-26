# Documentation Technique — Module “Ministères / Teams”

---

## 1. Introduction & Objectifs du module

Le module “Ministères / Teams” gère l’ensemble des fonctionnalités liées aux équipes/ministères de l’église : création, modification, suppression, affichage, et affectation de membres.  
L’objectif : centraliser les flux métiers, garantir la cohérence UX/UI, la robustesse technique (TypeScript strict, validations locales), et la clarté évolutive du code.

**UI publique :** affichage et actions sous le terme “ministère(s)”  
**Partie technique/interne :** “équipe(s)”, pour la logique et les APIs

---

## 2. Architecture générale

- **Composable central :** `useTeams.ts`  
  → Expose toute la logique métier ministères (états, loaders, CRUD, assignation, typage).
- **Vues clientes**  
  - `TeamsList.vue` : gestion/CRUD ministères
  - `MembersList.vue` : filtrage par ministère
  - `MemberDetail.vue` : affichage/gestion des affiliations ministères pour un membre
- **Aucune logique reliée aux ministères ne subsiste hors de ce composable**.

---

## 3. Conventions i18n (FR/EN)

- **UI / FR** : “Ministère(s)”  
- **UI / EN** : “Ministry / Ministries”
- **Technique / FR** : “Équipe(s)”  
- **Technique / EN** : “Team(s)”
- Toutes les clés i18n respectent cette dissociation, y compris :
  - Boutons (“Ajouter un ministère”)
  - Feedbacks (“Vous faites déjà partie de ce ministère”)
  - Labels, placeholders, loaders
  - Messages de validation et d’erreur liés à l’affectation/ministère
- **Harmonisation stricte** sur `frontend/src/locales/fr.ts` et `en.ts`

---

## 4. Composable `useTeams`

### a. API exposée

```ts
// frontend/src/composables/useTeams.ts (extraits typescript)
const { teams, isLoadingTeams, error, loadTeams, createTeam, updateTeam, deleteTeam, assignMember, removeMember } = useTeams()
```
- **`teams`** : Ref<Team[]> — Liste réactive des ministères chargés
- **`isLoadingTeams`** : Ref<boolean> — Loader d’état du chargement
- **`error`** : Ref<string|null> — Message d’erreur éventuel
- **`loadTeams()`** : Charge la liste (appelle API, hydrate l’état)
- **CRUD** : `createTeam`, `updateTeam`, `deleteTeam`  
- **Affectation** : `assignMember(teamId, memberId, ?position)`, `removeMember(teamId, memberId)`

### b. États réactifs

- Toutes les vues consomment `teams` en lecture
- Loader local via `isLoadingTeams` (jamais fusionné au global)
- Erreur contextualisée

### c. Typage strict

- **TypeScript strict systématique** (pas d’`any`)
- Typages précis pour : Team, MemberTeam, créées via `utils/types.ts`
- APIs/invocations internes utilisent les types partagés (pas de cast sauvage)

### d. Flux métier

- Toute mutation d’état (CRUD team, assignation) se répercute sur l’état global
- Reload automatique possible après chaque opération asynchrone

---

## 5. Vues du module

### TeamsList.vue

- **Responsabilité :** Gestion des ministères (affichage, création, suppression)
- **Loader :** Loader réactif local pour chargement principal (`isLoadingTeams`)
- **Validations front-end :**  
  - Création : nom requis, longueur min, unicité insensible casse
- **Feedbacks :** Toast i18n (succès, échec, doublon, etc.)

### MembersList.vue

- **Responsabilité :** Affichage, tri et filtrage des membres selon leur(s) ministère(s)
- **Loader :** Loader local pour chargement des ministères (`isLoadingTeams`)
- **Validations front-end :** Aucune affectation possible ici (filtrage uniquement)
- **Feedbacks :** Avertissements i18n, erreur de chargement

### MemberDetail.vue

- **Responsabilité :** Afficher et gérer l’affectation d’un membre à divers ministères
- **Loader :** Loader global déjà en place (`loading` pour membre, `isLoadingTeams` pour ministères)
- **Validations front-end :**  
  - Impossible d’affecter sans avoir choisi un ministère (message d’erreur)
  - Impossible d’affecter deux fois un membre au même ministère (message d’erreur)
- **Feedbacks :** Utilisation systématique de toast i18n harmonisé

---

## 6. Validations front-end

- **Création ministère (TeamsList.vue)**
  - Nom requis (ferme la modale si erreur)
  - Unicité hors espaces et insensible casse
  - Message d’erreur i18n
- **Affectation membre ↔ ministère (MemberDetail.vue)**
  - Refus si rien sélectionné
  - Refus si membre déjà présent dans le ministère
  - Message d’erreur i18n immédiat via toast

---

## 7. Feedback utilisateur

- **Système de toast :** showToast(text, level)
- **Feedback harmonisé (i18n) :**
  - Succès création/édition/suppression/assignation
  - Erreur métier (ex : “Ce membre fait déjà partie du ministère”)
  - Avertissement ou rollback si API échoue

---

## 8. Loaders & UX

- **Loader explicite** (isLoadingTeams, loading) dans chaque vue concernée
- **Aucune fusion loader** → l’utilisateur reçoit toujours un spinner localement (filtrage, CRUD, etc.)
- **Bonne pratique : Le spinner ne bloque jamais les autres interactions** (UX harmonieuse et fluide)
- **Pas d’attente globale masquée**

---

## 9. Décisions techniques majeures

- **Composable unique (`useTeams`) ** : centralise tout, zéro code Team dispersé ailleurs
- **TypeScript “strict” obligatoire** sur tout le module
- **Séparation claire :** feedback user (i18n) vs feedback technique
- **Pas de loader global fusionné (explicite uniquement)**
- **i18n harmonisé sur toute la chaîne**
- **Aucune dépendance “magique” ou effet de bord side-effect**
- **La logique d’affectation ne peut exister hors du scope d’un composable ou d’une vue cible**
- **Patch minimal et itératif garanti, jamais de refactoring “big bang”**

---

## 10. Points d’extension / Bonnes pratiques

- **Ajouter toute nouvelle logique métier liée aux ministères UNIQUEMENT dans useTeams**
- **Respecter le typage strict sur chaque API et chaque mutation**
- **Laisser chaque vue s’abstraire du backend en ne consommant QUE le composable**
- **Utiliser impérativement les clés i18n existantes, au besoin enrichir via PR sur locales**
- **N’introduire aucune logique “à la volée” côté vue, tout doit passer par état et méthodes du composable**
- **Conserver toujours les loaders explicites, jamais d’invisibilité utilisateur**
- **Valider localement AVANT tout appel réseau (offline-first UX)**
- **Pour toute extension future : ajouter les contrôles, feedbacks, loaders dans la structure du composable**

---

## 11. Annexes (extraits types/diff, schéma)

### Extrait d’utilisation type du composable

```ts
// Import dans la vue
import { useTeams } from '../composables/useTeams'
// Initialisation
const { teams, isLoadingTeams, loadTeams, createTeam, assignMember } = useTeams()
```

### Extrait de validation locale d’affectation (MemberDetail.vue)

```ts
function validateAssignment() {
  if (!joinTeamId.value) return t('memberAssignment.no_ministry_selected')
  if (member.value?.teams?.find((x: MemberTeam) => x.id === joinTeamId.value))
    return t('memberAssignment.already_assigned')
  return null
}

const joinTeam = async () => {
  const error = validateAssignment()
  if (error) { show(error, 'error'); return }
  // ... appel API
}
```

### Schéma de flux

```
[Vue utilisateur]
      |
      v
   [useTeams composable] <---- API CRUD ----> [Backend]
      |
  (typages, états, loaders, validations locales, feedback i18n)
```

---

**Pour toute évolution ou correction sur le domaine “Ministères / Teams”, se référer strictement à ce modèle d’architecture, typage, feedback et loader, et éviter toute duplication de logique ou mutation hors scope du composable.**

---

*Document prêt à intégrer dans `/docs` ou à publier en interne équipe.*
