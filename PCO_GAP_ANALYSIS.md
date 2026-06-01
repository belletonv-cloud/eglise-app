# PCO Gap Analysis — Cieux Ouverts vs Planning Center

> Dernière mise à jour : juin 2026  
> Référence : https://www.planningcenter.com/services + https://www.planningcenter.com/music-stand

## Légende
| Icône | Signification |
|-------|---------------|
| ✅ | Implémenté |
| 🟡 | Partiel / à améliorer |
| ❌ | Manquant |
| 🚫 | Hors scope (décision volontaire) |

---

## 1. Planning Center Services

### 1.1 Planification des services

| Fonctionnalité PCO | État | Notes |
|---|---|---|
| Types de services (Louange, Jeunesse, etc.) | ✅ | `service_types` table + filtre dans PlansList |
| Créer / éditer un service | ✅ | PlanDetail.vue |
| Plusieurs horaires par service | 🟡 | Un seul `date` + `time` pour l'instant |
| Ordre de service (items glissables) | ✅ | Items avec `position` + drag-and-drop |
| Notes par item / service | ✅ | Champ notes sur items |
| Pièces jointes par item | 🟡 | Médias sur arrangements, pas sur items libres |
 | Couleurs par item | ✅ | Champ color sur plan_items, color picker UI inline, bordure gauche colorée |
 | Réorganisation drag-and-drop | ✅ | |
 | Partage public du plan | ✅ | POST/DELETE /api/plans/:id/share, PublicPlanView.vue (lecture seule sans auth) |
| Modèles de plan (templates) | ❌ | |
| Titre de série + artwork | ❌ | |
| Durées par item + total | ✅ | Ajouté (`length_minutes`) |
| Bibliothèque médias | 🟡 | Médias sur arrangements uniquement |

### 1.2 Planification des bénévoles

| Fonctionnalité PCO | État | Notes |
|---|---|---|
| Équipes avec positions personnalisées | ✅ | `teams` + `positions` |
| Matrice de planification (vue multi-plans) | ✅ | Vue Matrice ⊞ dans PlansList |
| Modèles de planning | ❌ | |
| Auto-scheduling | ❌ | |
| Dates de blocage (indisponibilités) | ❌ | |
| Inscription libre (signup sheets) | ❌ | |
| Emails de rappel automatiques | 🟡 | Infrastructure webhooks existante, rappels non configurés |
| Contact responsable d'équipe | 🟡 | Visible mais pas bouton direct |
| Niveaux de permissions | ✅ | `role` : admin / member |
| Statuts de confirmation (confirmé/décliné) | ✅ | `scheduled_people.status` |

### 1.3 Outils de répétition

| Fonctionnalité PCO | État | Notes |
|---|---|---|
| Bibliothèque de chants | ✅ | SongsList.vue |
| Vue "top chants" | ❌ | |
| Arrangements multiples par chant | ✅ | Arrangements table |
| Tonalités multiples par arrangement | ✅ | Champ `key` |
| Tags par chant | 🟡 | Champ tags non exposé dans l'UI |
| Transposition de grille d'accords | ✅ | Implémentée : setKey(), transpose(±1 demi-ton), key picker UI |
| Import SongSelect / PraiseCharts | 🚫 | Non prévu (licences PCO) |
| Lecteur audio mobile | 🟡 | Basique, pas de looping de section |
| CarPlay / Android Auto | 🚫 | Application web, hors scope |

### 1.4 Communication & Live

| Fonctionnalité PCO | État | Notes |
|---|---|---|
| App mobile | 🟡 | PWA installable (pas app native) |
| Services LIVE (affichage temps réel) | ❌ | |
| Rapport CCLI automatique | 🚫 | Hors scope (spécifique US) |

---

## 2. Music Stand

### 2.1 Partitions

| Fonctionnalité PCO | État | Notes |
|---|---|---|
| Affichage partition PDF | 🟡 | ChordPro uniquement, pas PDF natif |
| Annotations dessin (pen, surlignage) | ✅ | MusicStandCanvas.vue |
| Annotations texte | ✅ | ArrangementAnnotations.vue |
| Réorganisation des pages | 🚫 | ChordPro = texte, pas pages PDF |
| Setlist → carnet de chants | ✅ | Liste chants depuis services |

### 2.2 Répétition

| Fonctionnalité PCO | État | Notes |
|---|---|---|
| Lecteur audio | ✅ | MusicStandView, player basique |
| Looping de section | ❌ | |
| Métronome | ✅ | MusicStandMetronome.vue |
| Tourne-page pédale (Bluetooth) | 🚫 | Hors scope (matériel spécifique) |
| Navigation glisser / swipe | ✅ | nextPage / prevPage |

### 2.3 Collaboration & Sync

| Fonctionnalité PCO | État | Notes |
|---|---|---|
| Synchronisation page entre appareils | ❌ | (nécessiterait WebSocket / Durable Objects) |
| Affichage externe (TV / moniteur) | ❌ | |
| Partage annotations équipe | ✅ | `is_shared` flag + sélecteur 👤 |

### 2.4 Accès & Intégration

| Fonctionnalité PCO | État | Notes |
|---|---|---|
| Import depuis Services | ✅ | Tout sur la même app |
| iOS / Android natif | 🚫 | PWA |
| Accès automatique pour membres d'équipe | ✅ | Tout membre peut accéder au Music Stand |

---

## 3. Fonctionnalités supplémentaires (hors PCO)

Ces fonctions n'existent pas dans PCO mais ont été développées :

| Fonctionnalité | État |
|---|---|
| Éditeur ChordPro WYSIWYG | ✅ |
| Checklist sonorisation | ✅ |
| Sondages / annonces | ✅ |
| Logs / audit trail | ✅ |
| Segmentation audio (Whisper) | ✅ |
| Messagerie interne | ✅ |

---

## 4. Priorités recommandées

### P0 — Critique (bloque l'adoption)
1. **Looping de section audio** — Répétition ciblée, très utilisé en pratique
2. ~~**Transposition automatique ChordPro**~~ — ✅ Implémenté (setKey, ±1 demi-ton, key picker)
3. **Synchronisation page en temps réel** — Le chef de louange contrôle tous les écrans

### P1 — Important (différence notable avec PCO)
4. **Services LIVE** — Suivi du déroulé en temps réel pendant le service
5. ~~**Dates de blocage bénévoles**~~ — ✅ Implémenté (VolunteerPreferences, unavailable_dates consultées au scheduling)
6. ~~**Partage public d'un plan**~~ — ✅ Implémenté (PublicPlanView, token UUID)
7. ~~**Couleurs par item**~~ — ✅ Implémenté (color picker inline, bordure colorée)

### P2 — Nice to have
8. ~~Modèles de plan~~ — ✅ Implémenté
9. Vue "top chants" — stats usage par chant
10. ~~Rappels automatiques par email~~ — ✅ Implémenté (cron J-2/J-1)
11. Création manuelle de chant — ✅ Implémenté (POST /api/songs, modal SongsList)
