
# 🏥 Yaho Pharma - ServiceConnect

Une application web progressive (PWA) pour la livraison de médicaments en Côte d'Ivoire, développée avec React, Express.js et TypeScript.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Technologies utilisées](#technologies-utilisées)
- [Prérequis](#prérequis)
- [Installation locale](#installation-locale)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Structure du projet](#structure-du-projet)
- [API Endpoints](#api-endpoints)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Contribution](#contribution)

## ✨ Fonctionnalités

### 🔐 Authentification
- Inscription et connexion sécurisées
- Gestion des sessions utilisateur
- Protection des routes privées

### 👤 Profil utilisateur
- **Upload de photo de profil** - Importation d'images depuis l'appareil
- Modification des informations personnelles
- Gestion des préférences

### 📍 Géolocalisation
- **Localisation automatique** pour les adresses de livraison
- Possibilité de personnaliser l'adresse manuellement
- Géocodage inverse pour obtenir l'adresse depuis les coordonnées

### 🏪 Pharmacies
- Recherche de pharmacies à proximité
- Informations détaillées des pharmacies
- Système de notation et avis

### 🚚 Livraison
- Suivi en temps réel des commandes
- Informations du livreur
- Estimation des délais de livraison

### 📱 PWA (Progressive Web App)
- Installation sur mobile et desktop
- Fonctionnement hors ligne
- Notifications push

## 🛠️ Technologies utilisées

### Frontend
- **React 18** avec TypeScript
- **Wouter** pour le routage
- **TanStack Query** pour la gestion d'état et cache
- **React Hook Form** avec validation Zod
- **Tailwind CSS** pour le styling
- **Shadcn/ui** pour les composants UI

### Backend
- **Express.js** avec TypeScript
- **Drizzle ORM** pour la base de données
- **PostgreSQL** comme base de données
- **Multer** pour l'upload de fichiers
- **Express Session** pour la gestion des sessions

### Outils de développement
- **Vite** pour le build et dev server
- **ESLint** et **Prettier** pour le code quality
- **tsx** pour l'exécution TypeScript

## 📋 Prérequis

- **Node.js** version 18.0.0 ou supérieure
- **npm** version 8.0.0 ou supérieure
- **PostgreSQL** version 12.0.0 ou supérieure

## 🚀 Installation locale

### 1. Cloner le projet

```bash
# Cloner depuis GitHub
git clone https://github.com/votre-username/yaho-pharma-serviceconnect.git
cd yaho-pharma-serviceconnect

# Ou copier depuis votre dossier local
cp -r "C:\Users\HP\Documents\yaho_pharma\ServiceConnect" ./yaho-pharma
cd yaho-pharma
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration de la base de données

Créez une base de données PostgreSQL et configurez les variables d'environnement :

```bash
# Créer un fichier .env à la racine du projet
touch .env
```

Ajouter les variables suivantes dans `.env` :

```env
# Base de données
DATABASE_URL="postgresql://username:password@localhost:5432/yaho_pharma"

# Session secret (générer une clé aléatoire)
SESSION_SECRET="votre-clé-secrète-très-longue-et-aléatoire"

# Port de développement (optionnel, par défaut 5000)
PORT=5000

# Mode de développement
NODE_ENV=development
```

### 4. Initialiser la base de données

```bash
# Générer et appliquer les migrations
npm run db:generate
npm run db:migrate
```

### 5. Lancer l'application

```bash
# Démarrer en mode développement
npm run dev
```

L'application sera accessible à l'adresse : `http://localhost:5000`

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Requis | Défaut |
|----------|-------------|---------|---------|
| `DATABASE_URL` | URL de connexion PostgreSQL | ✅ | - |
| `SESSION_SECRET` | Clé secrète pour les sessions | ✅ | - |
| `PORT` | Port du serveur | ❌ | 5000 |
| `NODE_ENV` | Environnement d'exécution | ❌ | development |

### Base de données

La structure de la base de données inclut :

- **users** - Informations des utilisateurs
- **pharmacies** - Données des pharmacies
- **prescriptions** - Ordonnances uploadées
- **orders** - Commandes des utilisateurs
- **delivery_persons** - Informations des livreurs
- **notifications** - Système de notifications

## 🎯 Utilisation

### 1. Première utilisation

1. **Sélection de langue** : Choisir entre Français et Anglais
2. **Onboarding** : Découvrir les fonctionnalités principales
3. **Inscription** : Créer un compte avec numéro de téléphone

### 2. Fonctionnalités principales

#### Upload de photo de profil
1. Aller dans "Mon Profil"
2. Cliquer sur la photo de profil
3. Sélectionner une image depuis l'appareil
4. L'image est automatiquement uploadée et sauvegardée

#### Configuration d'adresse avec géolocalisation
1. Aller dans "Adresses de livraison" depuis le profil
2. Cliquer sur "Utiliser ma position actuelle"
3. Autoriser la géolocalisation dans le navigateur
4. L'adresse est automatiquement remplie
5. Modifier les détails si nécessaire et sauvegarder

#### Commande et livraison
1. Rechercher une pharmacie
2. Uploader une ordonnance ou choisir des produits
3. Confirmer l'adresse de livraison
4. Suivre la livraison en temps réel

### 3. Test des fonctionnalités

#### Comptes de test
```
Téléphone: 0707070707
Mot de passe: password123
```

#### Test de géolocalisation
- Ouvrir dans un navigateur supportant la géolocalisation
- Autoriser l'accès à la position
- Tester sur différents appareils (mobile, desktop)

## 📁 Structure du projet

```
yaho-pharma-serviceconnect/
├── client/                     # Frontend React
│   ├── public/                 # Fichiers publics (PWA)
│   ├── src/
│   │   ├── components/         # Composants réutilisables
│   │   │   └── ui/            # Composants UI Shadcn
│   │   ├── hooks/             # Hooks personnalisés
│   │   ├── lib/               # Utilitaires et config
│   │   ├── pages/             # Pages de l'application
│   │   ├── contexts/          # Contextes React
│   │   └── App.tsx            # Composant principal
├── server/                     # Backend Express
│   ├── db.ts                  # Configuration base de données
│   ├── routes.ts              # Routes API
│   ├── storage.ts             # Couche d'accès aux données
│   └── index.ts               # Point d'entrée serveur
├── shared/                     # Code partagé
│   └── schema.ts              # Schémas de données
└── README.md                   # Documentation
```

## 🔌 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/user` - Profil utilisateur
- `PUT /api/auth/user` - Mise à jour profil
- `POST /api/auth/upload-profile-image` - Upload photo

### Pharmacies
- `GET /api/pharmacies` - Liste des pharmacies
- `GET /api/pharmacies/:id` - Détails d'une pharmacie

### Commandes
- `POST /api/orders` - Créer une commande
- `GET /api/orders` - Commandes utilisateur
- `GET /api/orders/current` - Commande en cours

### Géolocalisation
- `GET /api/location/reverse?lat=&lng=` - Géocodage inverse

## 🧪 Tests

### Tests manuels

1. **Test d'upload d'image** :
   ```bash
   # Navigateur : tester avec différents formats (JPG, PNG, WebP)
   # Vérifier la limite de taille (5MB)
   # Tester sur mobile et desktop
   ```

2. **Test de géolocalisation** :
   ```bash
   # Navigateur : autoriser/refuser la géolocalisation
   # Tester la précision en différents lieux
   # Vérifier le géocodage inverse
   ```

3. **Tests de régression** :
   ```bash
   # Inscription et connexion
   # Navigation entre pages
   # Fonctionnement PWA
   ```

### Tests automatisés

```bash
# À implémenter avec Jest/Vitest
npm run test
```

## 🚀 Déploiement

### Déploiement sur Replit

1. **Importer le projet** sur Replit
2. **Configurer les variables d'environnement** dans Secrets
3. **Connecter la base de données** PostgreSQL
4. **Déployer** avec le bouton Deploy

### Variables Replit Secrets

```
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key
```

### Production Build

```bash
# Build de production
npm run build

# Démarrage en production
npm start
```

## 📝 Scripts disponibles

```bash
# Développement
npm run dev              # Démarre le serveur de développement

# Base de données
npm run db:generate      # Génère les migrations Drizzle
npm run db:migrate       # Applique les migrations
npm run db:studio        # Interface graphique de la DB

# Production
npm run build           # Build de production
npm start              # Démarre le serveur de production

# Qualité de code
npm run lint           # ESLint
npm run format         # Prettier
```

## 🤝 Contribution

### Workflow de développement

1. **Fork** le projet
2. Créer une **branche feature** (`git checkout -b feature/amazing-feature`)
3. **Commit** les changements (`git commit -m 'Add amazing feature'`)
4. **Push** vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une **Pull Request**

### Standards de code

- Utiliser **TypeScript** strict
- Suivre les conventions **ESLint** et **Prettier**
- Documenter les fonctions complexes
- Écrire des tests pour les nouvelles fonctionnalités

### Issues

Pour signaler un bug ou proposer une fonctionnalité :
1. Vérifier que l'issue n'existe pas déjà
2. Utiliser les templates d'issues
3. Fournir un maximum de détails

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

- **Email** : support@yahopharma.ci
- **Téléphone** : +225 XX XX XX XX XX
- **Issues GitHub** : [Créer une issue](https://github.com/votre-username/yaho-pharma-serviceconnect/issues)

---

Développé avec ❤️ pour améliorer l'accès aux soins en Côte d'Ivoire.
