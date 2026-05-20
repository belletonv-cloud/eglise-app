# TODO

## Configuration & Déploiement

- [ ] Finaliser l'authentification réelle (remplacer le guard `return true`)
- [ ] Désactiver le mode démo forcé pour les utilisateurs authentifiés
- [ ] Remplacer le rate limiter in-memory par une solution durable (D1 ou CF KV)
- [ ] Déplacer `CREATE TABLE webhook_logs` dans une migration
- [ ] Ajouter des tests unitaires pour le backend et le frontend

## Fonctionnalités

- [ ] Mode sombre (en cours)
- [ ] Finaliser le drag-and-drop dans le builder de pages
- [ ] Implémenter undo/redo

## Nettoyage

- [ ] Supprimer les dossiers `audioop/` et `pyaudioop/` (shims inutilisés)
- [ ] Supprimer `tmp_test.py`
- [ ] Réparer ou supprimer `STANDALONE_APPS.md`
