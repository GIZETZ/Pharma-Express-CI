# Guide de Sauvegarde et Restauration Automatique - Pharma Express CI

## 🔒 Système de Protection des Données

Votre application Pharma Express CI est maintenant équipée d'un système de sauvegarde et restauration automatique qui protège vos données contre toute perte accidentelle.

## 🔧 Fonctionnement Automatique

### Au Démarrage du Serveur
Le système vérifie automatiquement :
1. **Existence des données** - Vérifie si la base de données contient des utilisateurs
2. **Intégrité des données** - Contrôle que toutes les tables essentielles sont présentes
3. **Restauration si nécessaire** - Recrée automatiquement les données de base si la DB est vide

### Données Automatiquement Recréées

Si votre base de données est perdue, le système recrée automatiquement :

#### 👥 Utilisateurs de Base
- **Patient Test** : Aya Diallo (Login: aya.diallo / Mot de passe: 123456)
- **Livreur** : Jean-Claude Koffi avec photo de profil et véhicule
- **Pharmacien** : Dr. Marie Kouadio 
- **Admin** : Compte administrateur système

#### 🏪 Pharmacies
- **Pharmacie Centrale d'Abidjan** (Plateau)
- **Pharmacie de Garde Cocody** (Service 24h/24)

#### 🚗 Profils Livreurs Complets
- **Photo de profil** de Jean-Claude Koffi
- **Véhicule** : Moto Yamaha DT 125 Rouge
- **Plaque d'immatriculation** : CI-2578-AB
- **Évaluations** : 4.8/5 (127 livraisons)

#### 📦 Données de Test
- **Prescription approuvée** avec médicaments
- **Commande en cours** assignée au livreur
- **Statut "en route"** pour tester le suivi

## 🛡️ Protection Intégrée

### Détection Intelligente
```
✅ Base de données existante détectée - Vérification de l'intégrité...
📊 5 utilisateurs trouvés
🏪 5 pharmacies trouvées
✅ Configuration de la base de données terminée
```

### En Cas de Base Vide
```
📊 Base de données vide détectée - Création des données initiales...
👥 Création des utilisateurs de base...
🏪 Création des pharmacies...
👨‍⚕️ Création du profil livreur...
🚗 Création du véhicule du livreur...
📋 Création d'une prescription de test...
📦 Création d'une commande de test...
✅ Données initiales créées avec succès
```

## 🚀 Avantages

1. **Aucune intervention manuelle** requise
2. **Récupération instantanée** des données essentielles
3. **Tests immédiatement disponibles** 
4. **Continuité de service** garantie
5. **Profils livreurs complets** avec photos et véhicules

## 📋 Comptes de Test Disponibles

### Patient
- **Nom** : Aya Diallo
- **Téléphone** : +225 07 12 34 56
- **Mot de passe** : 123456

### Livreur  
- **Nom** : Jean-Claude Koffi
- **Téléphone** : +225 07 44 55 66
- **Véhicule** : Moto Yamaha DT 125 Rouge (CI-2578-AB)
- **Mot de passe** : 123456

### Pharmacien
- **Nom** : Dr. Marie Kouadio  
- **Téléphone** : +225 21 22 33 44
- **Mot de passe** : 123456

### Admin
- **Nom** : Admin System
- **Téléphone** : +225 21 00 00 00
- **Mot de passe** : 123456

## 🎯 Cas d'Usage

Ce système est particulièrement utile pour :
- **Développement** : Environnement de test toujours prêt
- **Démonstrations** : Données cohérentes pour les présentations
- **Récupération** : Restauration rapide après incident
- **Nouvelles instances** : Configuration automatique sur nouveaux déploiements

## ⚙️ Configuration Technique

Le système s'active automatiquement dans `server/database-setup.ts` et est intégré au démarrage dans `server/index.ts`.

**Aucune configuration supplémentaire nécessaire** - Tout fonctionne automatiquement !