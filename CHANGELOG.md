# Changelog

All notable changes to this project will be documented in this file.

## v0.1.0 - 2026-05-24

### Stabilisation PCO → D1 & Nettoyage

- Stabilise la synchronisation PCO → D1 : Pass1 (fetch minimal, pagination, suppression des fetchs parasites) et Pass2 (arrangements-only, batchSize=1, auto-retrigger) implémentés et validés.
- Ajout d'un fallback de nom pour les arrangements quand PCO renvoie `null`.
- Suppression des routes debug temporaires après validation.

### Frontend

- Build Vite : OK (dist généré)
- Tests unitaires (Vitest) : OK (20/20)
- Tests E2E (Playwright) : OK (61/61) — correction du test `demo-tour` (selector `.nth(1)`).

### Migrations

- Ajoutées et versionnées :
  - `migrations/populate_songs_to_update_incremental.sql`
  - `migrations/select_songs_to_update.sql`
- Supprimés : fichiers temporaires de debug (`tmp_select.sql`, `insert_test_song_to_update.sql`).

### Git

- Tous les commits locaux poussés sur `main`. Arbre propre, pas de fichiers temporaires restants.

### Notes

- Release créée automatiquement à partir de l'état actuel de `main`.
