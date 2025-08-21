# 🗄️ GUIDE DE RÉCUPÉRATION BASE DE DONNÉES - PHARMA EXPRESS CI

Ce guide vous explique comment restaurer automatiquement votre base de données PostgreSQL en cas de perte, même si vous perdez toutes vos données.

## 📋 RÉSUMÉ DE LA CONFIGURATION

Votre application est maintenant protégée contre la perte de données avec :

✅ **Vérification automatique** au démarrage
✅ **Scripts de sauvegarde** du schéma complet  
✅ **Scripts de restauration** automatique
✅ **Garde de sécurité** qui empêche l'usage du stockage en mémoire

## 🚀 SCRIPTS DISPONIBLES

### 1. Configuration automatique de base de données
```bash
node scripts/setup-database.js
```
**Usage :** Recrée automatiquement le schéma complet et les données de base

### 2. Sauvegarde du schéma
```bash
node scripts/backup-schema.js  
```
**Usage :** Génère un fichier SQL de sauvegarde complète dans `backup/`

### 3. Garde de sécurité
```bash
node scripts/database-guard.js
```
**Usage :** Vérifie que PostgreSQL est utilisé (s'exécute automatiquement au démarrage)

## 🆘 PROCÉDURE DE RÉCUPÉRATION D'URGENCE

### Si vous perdez votre base de données :

1. **Vérifiez DATABASE_URL**
   ```bash
   echo $DATABASE_URL
   ```
   
2. **Restaurez le schéma automatiquement**
   ```bash
   node scripts/setup-database.js
   ```

3. **Redémarrez l'application**
   ```bash
   npm run dev
   ```

### Si l'application utilise le stockage en mémoire :

1. **Vérifiez le fichier d'alerte**
   ```bash
   cat DATABASE_ALERT.txt
   ```

2. **Configurez DATABASE_URL dans les secrets Replit**
   - Allez dans Settings > Secrets
   - Ajoutez DATABASE_URL avec votre URL Neon

3. **Redémarrez l'application**

## 🔧 DONNÉES AUTOMATIQUEMENT RESTAURÉES

Quand vous utilisez les scripts de récupération, voici ce qui est automatiquement recréé :

### 👥 Utilisateurs de test
- **Admin** : +225 01 23 45 67 / admin123
- **Pharmacien 1** : Dr. Marie Kouassi (+225 07 11 22 33 / pharma123)
- **Pharmacien 2** : Dr. Adjoua Bamba (+225 05 44 33 22 / pharma2024)
- **Livreur 1** : Jean-Claude Koffi (+225 07 44 55 66 / livreur123)
- **Livreur 2** : Aya Traore (+225 05 77 88 99 / livreur123)
- **Patient** : Konan Akissi (+225 01 11 22 33 / patient123)

### 🏥 Pharmacies
- Pharmacie Dr. Marie Kouassi (Riviera Golf, Cocody)
- Pharmacie de la Paix (Boulevard de la Paix, Cocody)
- Pharmacie Centrale Plus (Marcory)

### 🔗 Associations
- Livreurs correctement associés aux pharmacies
- Statuts d'approbation configurés
- Permissions et rôles définis

## 📊 STRUCTURE DE BASE DE DONNÉES

### Tables principales :
- `users` - Utilisateurs (patients, pharmaciens, livreurs, admin)
- `pharmacies` - Pharmacies enregistrées
- `orders` - Commandes de médicaments
- `prescriptions` - Ordonnances uploadées
- `notifications` - Notifications système

### Index de performance :
- Recherche par téléphone
- Filtres par rôle
- Association pharmacie-livreur
- Statuts de commande

## 🛡️ SÉCURITÉ ET MONITORING

### Vérifications automatiques :
1. **Au démarrage** : Vérifie que PostgreSQL est utilisé
2. **Configuration** : Alerte si DATABASE_URL manque
3. **Santé** : Test de connexion à la base de données
4. **Type de stockage** : Confirmation que PostgresStorage est actif

### Fichiers de monitoring :
- `DATABASE_ALERT.txt` - Créé si problème détecté
- `.database-status.json` - Statut de la dernière vérification
- `.database-config.json` - Configuration sauvegardée

## 📝 COMMANDES DRIZZLE COMPATIBLES

```bash
# Pousser le schéma vers la base
npx drizzle-kit push

# Générer des migrations
npx drizzle-kit generate

# Interface web pour explorer la DB
npx drizzle-kit studio
```

## 🔄 MAINTENANCE PRÉVENTIVE

### Sauvegarde hebdomadaire recommandée :
```bash
node scripts/backup-schema.js
```

### Vérification mensuelle :
```bash
node scripts/database-guard.js
```

## 📞 SUPPORT

Si vous rencontrez des problèmes :

1. Vérifiez `DATABASE_ALERT.txt` pour les alertes
2. Consultez `.database-status.json` pour le dernier statut
3. Exécutez `node scripts/database-guard.js` pour diagnostiquer
4. Utilisez `node scripts/setup-database.js` pour tout réinitialiser

---

**💡 Note importante :** Cette configuration garantit que même si vous perdez complètement votre base de données, vous pouvez la restaurer avec le schéma complet et les données de test en quelques minutes seulement.

**📅 Configuration créée le :** ${new Date().toLocaleString('fr-FR')}  
**🔧 Version :** 1.0.0  
**📍 Environnement :** Replit + PostgreSQL (Neon)