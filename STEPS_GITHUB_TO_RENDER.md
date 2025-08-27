# 🚀 Étapes pour Déployer sur Render depuis GitHub

## 📋 Fichiers à Committer sur GitHub

### Fichiers Modifiés (OBLIGATOIRES)
1. `server/db.ts` - URL base de données sécurisée
2. `server/index.ts` - Validation production ajoutée
3. `render.yaml` - Configuration corrigée
4. `.env.example` - Documentation mise à jour
5. `SECURITY_GUIDE.md` - Guide de sécurité
6. `RENDER_FIX_GUIDE.md` - Guide correction erreur
7. `replit.md` - Historique des changements

### Fichiers à NE PAS committer
- `.env` (contient vos secrets locaux)

## 📤 Étapes GitHub

### 1. Committer les Changements
```bash
git add server/db.ts server/index.ts render.yaml .env.example
git add SECURITY_GUIDE.md RENDER_FIX_GUIDE.md replit.md
git commit -m "Fix: Sécurisation DB + correction erreur SIGTERM Render"
git push origin main
```

## 🌐 Étapes Render

### 2. Connecter à Render Dashboard
1. Allez sur [render.com](https://render.com)
2. Connectez-vous à votre compte

### 3. Créer/Mettre à jour le Service
**Si NOUVEAU déploiement :**
- "New" → "Web Service"
- Connect repository: `https://github.com/GIZETZ/PharmaChape-CI.git`
- Render détectera automatiquement `render.yaml`

**Si service EXISTANT :**
- Allez à votre service "pharmachape-ci"
- Settings → "Deploy"
- "Manual Deploy" → "Deploy latest commit"

### 4. Configuration Variables d'Environnement
Settings → Environment → Add Environment Variable :

```
DATABASE_URL = postgresql://neondb_owner:npg_xbkj5ZsNWfI4@ep-floral-mouse-a2pjisa8-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

SESSION_SECRET = [générez avec: openssl rand -base64 32]

NODE_ENV = production
```

### 5. Redéploiement
- Cliquez "Deploy" 
- Attendez que le build termine
- Votre app sera accessible sur l'URL Render

## ✅ Vérification du Succès

Après déploiement, vous devriez voir dans les logs :
```
✅ Production environment validated
🌐 serving on 0.0.0.0:10000
```

**URL finale :** `https://votre-service.onrender.com`

## 🔧 Configuration Alternative (Manuel)

Si `render.yaml` ne fonctionne pas :

**Build Command:**
```
npm ci && npm run build
```

**Start Command:**
```
node dist/index.js
```

**Root Directory:** `.` (racine)

## 🎯 Résultat Final

✅ Application sécurisée
✅ Erreur SIGTERM corrigée  
✅ Base de données protégée
✅ Déploiement production opérationnel