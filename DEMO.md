# 🎯 Guide des Démonstrations - Eglise App

Ce document détaille tous les moyens d'explorer et tester l'application Eglise App.

## 🚀 Démarrage Rapide

### Option 1 : Démo Immédiate (30 secondes)
```bash
# Ouvrir le fichier index.html directement
open index.html
# ou double-cliquer sur le fichier depuis votre explorateur
```

### Option 2 : Démo Complète (2 minutes)
```bash
# Installation et lancement automatique
npm run demo

# Alternative manuelle :
cd frontend
npm install
npm run dev
# Puis visitez http://localhost:5173/demo-tour
```

### Option 3 : Démo avec Serveur Local
```bash
# Serveur HTTP simple pour index.html
npm run demo:quick
# Visitez http://localhost:8080
```

## 📋 Types de Démonstrations

### 1. 🎨 Démo Aspirations (Standalone)

**Fichier** : `index.html`  
**Temps** : 30 secondes  
**Contenu** : Animation des 4 aspirations de l'église

- ✅ Aucune installation requise
- ✅ Fonctionne offline
- ✅ Responsive design
- ✅ Animation fluide au scroll

**Aspirations présentées** :
1. 🤝 Accueillir et vivre l'unité
2. 🙏 Célébrer et cultiver la présence de Dieu  
3. 💚 Accompagner et restaurer les vies
4. ✨ Témoigner et former des disciples

### 2. 🎪 Démo Tour Interactive

**URL** : `http://localhost:5173/demo-tour`  
**Temps** : 5-10 minutes  
**Contenu** : Visite guidée complète de l'application

**Fonctionnalités démontrées** :
- 👥 Gestion des membres et équipes
- 📅 Planification des services
- 🎵 Music Stand et partitions
- 📱 Interface mobile responsive
- 🔔 Notifications et communications
- 📊 Tableaux de bord et statistiques

**Accès** :
- Mode démo automatique (pas d'authentification)
- Données de test préchargées
- Navigation libre dans toutes les sections

### 3. 🎸 Mode "Essai sans Compte"

**URL** : `http://localhost:5173/`  
**Temps** : Illimité  
**Contenu** : Accès complet avec données de test

**Comment accéder** :
1. Lancer l'application : `npm run demo`
2. Cliquer sur "🎸 Essai sans compte" 
3. Explorer librement toutes les fonctionnalités

**Fonctionnalités complètes** :
- ✅ Gestion complète des membres
- ✅ Planification des services
- ✅ Music Stand avec transposition
- ✅ Communication et notifications
- ✅ Check-in et événements
- ✅ Groupes de maison
- ✅ Statistiques et rapports

## 🛠️ Démonstrations Techniques

### 4. 🔧 Démo API Backend

**Prérequis** : Variables d'environnement configurées  
**Commande** : `wrangler dev src/index.js`  
**URL** : `http://localhost:8787`

**Endpoints testables** :
- `GET /api/members` - Liste des membres
- `GET /api/services` - Services planifiés
- `GET /api/songs` - Bibliothèque musicale
- `POST /api/checkin` - Système d'enregistrement

### 5. 📱 Démo PWA

**Installation** : Via le navigateur (icône d'installation)  
**Fonctionnalités** :
- ✅ Installation sur mobile/desktop
- ✅ Fonctionnement offline
- ✅ Notifications push
- ✅ Cache intelligent

## 📊 Données de Démonstration

### Utilisateurs de Test
- **Admin** : Jean Dupont (accès complet)
- **Musicien** : Marie Martin (Music Stand)
- **Bénévole** : Paul Durand (services)

### Contenu Préchargé
- **12 membres** avec profils complets
- **4 équipes** (Musique, Accueil, Technique, Enfants)
- **8 services** planifiés ce mois
- **25+ chansons** avec partitions
- **Événements** et groupes de maison

## 🎯 Scenarios d'Usage

### Scenario 1 : Pasteur/Responsable
```
1. Aller sur /demo-tour
2. Explorer la gestion des membres
3. Voir la planification des services
4. Tester les communications
5. Consulter les statistiques
```

### Scenario 2 : Musicien
```
1. Mode "Essai sans compte"
2. Aller dans Music Stand
3. Ouvrir une chanson
4. Tester la transposition
5. Voir les setlists
```

### Scenario 3 : Bénévole
```
1. Démo tour - Section Planning
2. Voir les créneaux disponibles
3. Consulter les conflits
4. Tester le check-in mobile
```

## 🔧 Commandes Utiles

```bash
# Installation première fois
npm run setup

# Démo rapide (HTML seul)
npm run demo:quick

# Démo complète avec dev server
npm run demo

# Build pour production
npm run demo:build

# Tests de l'API
npm run test:api
```

## 🐛 Résolution de Problèmes

### La démo ne se lance pas
```bash
# Vérifier Node.js (v18+)
node --version

# Réinstaller les dépendances
cd frontend && rm -rf node_modules && npm install
```

### Erreurs de build
```bash
# Nettoyer le cache
cd frontend && npm run clean && npm run build
```

### API backend ne répond pas
```bash
# Vérifier les variables d'environnement
cp .env.example .env
# Remplir les valeurs nécessaires
```

## 📞 Support

- 📖 Documentation complète : `README.md`
- 🔧 API Reference : `docs/openapi.json`
- 🐛 Issues : Créer une issue GitHub
- 💬 Questions : Voir la documentation du code

---

**🎯 Conseil** : Commencez par `index.html` pour un aperçu rapide, puis utilisez `npm run demo` pour explorer toutes les fonctionnalités !