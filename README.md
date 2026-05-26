# 🏛️ Eglise App - Système de Gestion d'Église

✏️ **Documentation complète du module “Ministères / Teams” : voir `/docs/ministeres-teams.md`**


Système complet de gestion d'église développé avec Vue 3, TypeScript et Cloudflare Workers, inspiré de Planning Center Online.

## 🎯 Fonctionnalités Principales

- **Gestion des membres** : Profils, équipes, rôles
- **Planification des services** : Créneaux, bénévoles, gestion des conflits  
- **Ministère musical** : Music Stand, partitions, transposition automatique
- **Communication** : Templates d'email, notifications push
- **Spécialisations** : Check-in, groupes de maison, suivi de participation

## 🚀 Démos Disponibles

> **⚡ Démarrage Express** : Voir [QUICKSTART.md](QUICKSTART.md) pour les commandes rapides  
> **📖 Guide Détaillé** : Voir [DEMO.md](DEMO.md) pour toute la documentation des démos

### 1. Démo Rapide - Aspirations (HTML Standalone)

**Accès immédiat** : Ouvrez `index.html` directement dans votre navigateur
```bash
# Option 1: Double-clic sur le fichier
open index.html

# Option 2: Via serveur local
python -m http.server 8000
# Puis visitez http://localhost:8000
```

Cette démo présente les aspirations de l'église avec une animation de stepper élégante.

### 2. Démo Complète Interactive 

**Installation et lancement** :
```bash
# 1. Aller dans le dossier frontend
cd frontend

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev

# 4. Visiter les URLs de démo :
# http://localhost:5173/interactive
# http://localhost:5173/demo-tour
```

**Mode démo sans authentification** : Utilisez le bouton "🎸 Essai sans compte" pour accéder à toutes les fonctionnalités avec des données de test.

### 3. Démo Backend (Optionnel)

Pour tester l'API complète :
```bash
# 1. Configurer les variables d'environnement
cp .env.example .env
# Remplir les clés Firebase et autres configs

# 2. Installer Wrangler
npm install -g wrangler

# 3. Lancer le worker localement  
wrangler dev src/index.js
```

## 🛠️ Architecture

- **Frontend** : Vue 3 + TypeScript + Vite + TailwindCSS v4
- **Backend** : Cloudflare Workers + D1 Database
- **Authentification** : Firebase Auth (bypassable en mode démo)
- **PWA** : Service Worker avec cache offline
- **Déploiement** : Cloudflare Pages + Workers (CI/CD automatique)

## 📱 Fonctionnalités Avancées

### Applications Modulaires
- **Music Stand** : Gestion des partitions et transposition
- **Check-in** : Système d'enregistrement pour les événements  
- **Planning** : Calendrier intelligent avec gestion des conflits
- **Communications** : Templates d'emails et notifications

### Intégrations
- **Planning Center Online** : Synchronisation bidirectionnelle
- **kDrive** : Stockage de fichiers
- **Webhooks** : Automatisations externes

## 🌐 Déploiement

Le projet est configuré pour un déploiement automatique sur Cloudflare :

- **Frontend** : Cloudflare Pages (déclenchement sur push `frontend/`)
- **Backend** : Cloudflare Workers (déclenchement sur push `src/`)
- **Base de données** : Cloudflare D1 avec migrations automatiques

## 🔧 Scripts Disponibles

```bash
# Tests
npm run test                 # Tests unitaires
npm run test:api            # Tests API

# Sécurité  
npm run scan-secrets        # Détection de secrets

# Hooks Git
npm run install-hooks       # Installation des hooks de pré-commit
```

## 🎨 Personnalisation

Le projet utilise TailwindCSS v4 avec un design system personnalisé :
- Palette de couleurs adaptée aux églises
- Composants réutilisables
- Mode sombre (en cours de développement)
- Responsive design

## 📚 Documentation API

La documentation OpenAPI est disponible dans `docs/openapi.json` pour l'intégration avec l'API backend.

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements  
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

**🎯 Pour commencer rapidement** : Ouvrez `index.html` dans votre navigateur pour la démo rapide, ou suivez les instructions de la section "Démo Complète Interactive" pour explorer toutes les fonctionnalités !