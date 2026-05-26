# Checklist QA manuelle – Présences / Check-in

## Fonctionnalité principale
- [ ] Check-in via bouton (sélection plan, recherche membre, pointer)
- [ ] Check-in via QR code (scanner QR, pointer depuis mobile – SI APPLICABLE)
- [ ] Check-in invité (ouvrir "Ajouter invité", saisir nom/prénom, valider)
- [ ] Affichage présences ajoutées immédiatement (section présents)


## Cas limites et erreurs
- [ ] Double-pointage refusé avec feedback i18n
- [ ] Hors fenêtre refusé (service trop tôt/tard)
- [ ] Check-out (bouton ✕, suppression immédiate de la liste)
- [ ] Simulation erreur API (perte connexion, serveurs KO)


## Ergonomie et responsive
- [ ] Interface parfaite sur mobile et desktop (écarts, toasts, boutons accessibles)
- [ ] Saisie ultra-rapide (navigation clavier, focus, tab sur search)
- [ ] UX fluide même avec 100+ membres/plans (search instantanée)


## Accessibilité (a11y)
- [ ] loader global avec role="status" et data-testid visible
- [ ] feedback/textes d’erreur visibles en aria-live="polite"
- [ ] label explicite et aria-describedby sur tous les inputs visibles
- [ ] focus automatique sur search en cas d’erreur validation


## Cohérence i18n
- [ ] Tous les labels/boutons/toasts/errors passent par i18n (🇫🇷/🇬🇧)
- [ ] Aucune string "brute" dans CheckInView.vue
- [ ] Synchronisation et unicité des clés FR/EN


## Divers
- [ ] Composant réactif : refresh attendances après check-in/out sans reload
- [ ] Aucune régression ou erreur JS en console

---

Marquer chaque étape comme “OK” lors de la vérification. Garder la checklist à jour en cas de correctifs ou d’ajouts (impression papier possible !)
