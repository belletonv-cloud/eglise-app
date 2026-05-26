# Module Présences / Check-in

## Architecture générale

- **Vue principale** : `CheckInView.vue` (plate, expo composable, i18n, a11y)
- **Composable métier** : `useCheckins.ts` (src/composables/) — charge plans, membres, présences, effectue check-in/out
- **Flux principal :**
  1. Sélectionner un service\plan
  2. Chercher membre par nom (auto-complétion full-text)
  3. Pointer via bouton, QR, ou ajout invité
  4. Présence ajoutée (feed-back toast)

## API du composable useCheckins

```ts
type Plan = { id: number; date: string; service_type_name: string; ... }
type Member = { id: number; first_name: string; last_name: string; ... }
type Presence = { id: number; plan_id: number; member_id: number; ... }

export function useCheckins(): {
  plans: Ref<Plan[]>;
  members: Ref<Member[]>;
  attendances: Ref<Presence[]>;
  currentPlan: Ref<Plan|null>;
  searchResults: Ref<Member[]>;
  isLoading: Ref<boolean>;
  isSubmitting: Ref<boolean>;
  error: Ref<string|null>;
  loadPlans(): Promise<void>;
  loadMembers(): Promise<void>;
  loadAttendances(planId: number): Promise<void>;
  checkIn(payload: {plan_id:number, member_id:number}): Promise<void>;
  checkOut(attendanceId:number): Promise<void>;
  createMember(payload: {first_name:string, last_name:string}): Promise<Member>;
  validateCheckIn(plan:Plan, member:Member): string|null;
  searchMembers(query: string): void;
}
```

## Types stricts
- TS strict partout (no any, no unknown, no string brute dans le process métier)

## Principaux flux métier
- Sélection du plan → recherche member → checkin (bouton, QR, invité)
- Revalidation locale avant check-in :
  - refus si déjà pointé (clé i18n doublon)
  - refus si hors fenêtre (clé i18n)
  - feedback API systématiquement affiché en toast
- Check-out : suppression immédiate via bouton

## Validations
- validateCheckIn(plan, member) renvoie null ou la clé d’erreur i18n à afficher
- Ajout membre invité : nom mini obligatoire
- Toute mutation utilise des loaders locaux (isSubmitting)

## Feedbacks i18n
- Toutes les erreurs/succès visibles à l’utilisateur passent par les clés i18n (`fr.ts`, `en.ts`)
- Aucun texte brut hardcodé en vue ou composable

## Accessibilité
- `aria-live="polite"` sur conteneur toasts/erreurs
- `role="status"` sur loader principal
- Tous les inputs associés à un label + aria-describedby en cas d’erreur
- Focus automatique en cas d’erreur validation

## QA
### ✅ Tests manuels
Cf. checklist jointe (voir ci-dessous)

### ✅ E2E Playwright
- tests/e2e/checkin.spec.ts : tous les flux (checkin, doublon, hors fenêtre, erreurs, recherche, affichage)
- tests/e2e/checkin-guest.spec.ts : check-in invité

### ✅ Unitaires (Vitest)
- tests/unit/useCheckins.spec.ts : tout le métier du composable, tous les cas bord

## Pistes d’extension
- check-in groupé ou familial (bulk check-in)
- mode offline (queue sur device)
- analytics/exports présences
- gestion permissions fines per plan/équipe
- QR codes à validité limitée
