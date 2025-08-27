# Guide de Déploiement - PharmaChape

## 🚀 Déploiement sur Render

### Étape 1 : Préparation du Repository GitHub
1. Assurez-vous que votre code est poussé sur GitHub : `https://github.com/GIZETZ/PharmaChape.git`
2. Vérifiez que tous les fichiers de configuration sont présents :
   - `render.yaml`
   - `Dockerfile`
   - `.env.example`
   - `build.sh`

### Étape 2 : Configuration sur Render
1. Allez sur [render.com](https://render.com) et connectez-vous
2. Cliquez sur "New" → "Web Service"
3. Connectez votre compte GitHub
4. Sélectionnez le repository `GIZETZ/PharmaChape-CI`

### Étape 3 : Configuration du Service
```
Name: pharmachape
Environment: Node
Build Command: ./build.sh
Start Command: npm run start
```

### Étape 4 : Variables d'Environnement
Ajoutez ces variables dans Render :

**Variables Obligatoires :**
- `NODE_ENV` = `production`
- `PORT` = `10000`
- `SESSION_SECRET` = [Générez une clé secrète forte]
- `DATABASE_URL` = [URL de votre base PostgreSQL]

**Variables Optionnelles :**
- `CORS_ORIGIN` = [URL de votre domaine personnalisé]
- `MAX_FILE_SIZE` = `10485760`
- `ALLOWED_FILE_TYPES` = `image/jpeg,image/png,image/webp`

### Étape 5 : Configuration de la Base de Données
1. Dans Render, créez une nouvelle base PostgreSQL
2. Copiez l'URL de connexion
3. Ajoutez-la comme variable `DATABASE_URL`

## 🔧 Déploiement sur Replit

### Configuration Automatique
- Utilisez le bouton "Deploy" dans l'interface Replit
- Sélectionnez "Autoscale" pour la production
- Les variables d'environnement sont configurées automatiquement

### Variables d'Environnement Replit
Ajoutez dans les Secrets :
- `SESSION_SECRET` = [Clé secrète]
- `DATABASE_URL` = [URL PostgreSQL]

## 🔍 Vérification du Déploiement

### Health Check
Testez l'endpoint de santé :
```
GET https://votre-app.onrender.com/api/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "timestamp": "2025-01-09T14:30:00.000Z"
}
```

### Tests de Fonctionnalité
1. Accès à l'interface : `https://votre-app.onrender.com`
2. Test d'inscription/connexion
3. Upload d'ordonnance
4. Navigation entre les rôles

## 🛠️ Dépannage

### Erreurs Communes
1. **Port Binding Error** : Vérifiez que `PORT=10000` et `HOST=0.0.0.0`
2. **Database Connection** : Vérifiez `DATABASE_URL` et les credentials
3. **Build Failures** : Vérifiez que toutes les dépendances sont dans `package.json`

### Logs
- Render : Consultez les logs dans le dashboard
- Replit : Utilisez la console de workflow

## 📈 Optimisations Production

### Performance
- Compression Gzip activée
- Minification des assets
- Cache des resources statiques

### Sécurité
- HTTPS forcé en production
- Sessions sécurisées
- Validation des uploads

### Monitoring
- Health checks automatiques
- Logs d'application structurés
- Métriques de performance