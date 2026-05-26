# Statut E2E – Check-in invité (SPA Vite)

## Objectif
Débloquer le test Playwright checkin-guest.spec.ts en mode App locale, avec mocks API consommés et rendu des plans, pour valider le flux complet invité.

---

## Résultat
- ✅ Test `checkin-guest.spec.ts` **PASS** (1.7s)
- ✅ Tous les mocks API `addInitScript` sont consommés
- ✅ Flux complet validé : plans → sélection → modal check-in manuel → création membre + check-in → liste des présents

---

## Problèmes résolus

### Blocage n°1 : Firebase `auth/invalid-api-key`
- **Cause** : `VITE_FIREBASE_API_KEY` vide → `getAuth()` lève une exception → app crash complet (page blanche)
- **Solution** : `try/catch` dans `src/firebase.ts` avec fallback config dummy

### Blocage n°2 : Page Login affichée pour les invités
- **Cause** : `App.vue` montre `<Login>` pour tout utilisateur non authentifié
- **Solution** : Importer `publicRoutes` depuis `router/index.ts`, ne montrer Login que si la route n'est pas publique
- Modules modifiés : `src/router/index.ts` (exporter `publicRoutes`, ajouter `'checkin'`), `src/App.vue` (condition `v-else-if`)

### Blocage n°3 : `v-model` avec expression interdite
- **Cause** : `v-model="manualForm.search || ''"` illégal en Vue 3 (template expression)
- **Solution** : Remplacer par `v-model="manualForm.search"` et initialiser `search: ''` dans `manualForm`

### Blocage n°4 : Template HTML invalide
- **Cause** : `</div>` et `</template>` mal placés en fin de fichier (CheckInView.vue)
- **Solution** : Restructurer la hiérarchie du template

### Blocage n°5 : `page.route` API POST ne répond pas
- **Cause** : CDP-level `route.fulfill()` pour POST `/api/attendances` reste silencieusement bloqué
- **Solution** : Remplacer par `addInitScript` qui surcharge `window.fetch` directement (JS-level)

### Blocage n°6 : Condition de mock impossible
- **Cause** : `url.endsWith('/api/plans') && url.includes('/attendances')` → les deux conditions sont contradictoires
- **Solution** : Remplacer par `/\/api\/plans\/\d+\/attendances$/.test(url)`

### Blocage n°7 : `strict mode violation` [role="status"]
- **Cause** : 2 éléments avec `role="status"` dans la page (spinner + toast container)
- **Solution** : Changer la stratégie d'assertion : attendre `[data-testid="attendance-item"]` au lieu de `[role="status"]`

---

## Modifications apportées

| Fichier | Changement |
|---|---|
| `src/router/index.ts` | Export `publicRoutes`, ajout `'checkin'` |
| `src/App.vue` | Conditionnel Login via `publicRoutes` |
| `src/firebase.ts` | `try/catch` pour initialisation Firebase |
| `src/views/CheckInView.vue` | `data-testid`, fix `v-model`, fix template |
| `src/components/Toasts.vue` | Ajout `role="status" aria-live="polite"` |
| `src/locales/fr.ts`, `en.ts` | Clés `checkin.*` manquantes |
| `e2e/checkin-guest.spec.ts` | `addInitScript` fetch mock, assertions robustes |

---

## Procédure de test

```bash
# Terminal 1 : Démarrer Vite
cd frontend && npm run dev

# Terminal 2 : Lancer le test
cd frontend && npx playwright test e2e/checkin-guest.spec.ts
```

---

## Notes
- `addInitScript` doit être placé avant `page.goto()` pour que le mock `window.fetch` soit en place avant l'évaluation du bundle
- Ne pas utiliser `page.route()` pour les mocks POST (bloqué CDP)
- Le Vite dev server doit être actif avant Playwright
- CI : prévoir un job qui lance Vite en détaché avant Playwright
