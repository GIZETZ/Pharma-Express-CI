# 🔧 Correction de l'Erreur Render : SIGTERM

## 🔍 Problème Identifié

L'erreur `npm error command sh -c NODE_ENV=node de production dist/index.js` indique que :
1. La commande de démarrage dans Render était mal configurée
2. Le fichier `dist/index.js` était introuvable

## ✅ Solution Appliquée

### 1. Configuration `render.yaml` Corrigée
```yaml
services:
  - type: web
    name: pharmachape
    env: node
    plan: starter
    buildCommand: npm ci && npm run build  # ✅ npm ci au lieu de npm install
    startCommand: node dist/index.js       # ✅ Commande directe au lieu de npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false
      - key: SESSION_SECRET
        generateValue: true
    healthCheckPath: /api/health
```

### 2. Validation Ajoutée
- ✅ Validation des variables d'environnement en production
- ✅ Messages d'erreur clairs
- ✅ Exit graceful si DATABASE_URL manque

## 🚀 Étapes de Redéploiement

### Sur Render Dashboard :
1. **Allez à votre service PharmaChape**
2. **Settings** → **Environment Variables**
3. **Ajoutez si manquant :**
   - `DATABASE_URL` = `[votre URL Neon complète]`
   - `SESSION_SECRET` = `[clé forte générée]`
   - `NODE_ENV` = `production`

4. **Deploy** → **Redeploy**

### Configuration Manuelle Alternative
Si `render.yaml` ne fonctionne pas :

**Build Command:**
```bash
npm ci && npm run build
```

**Start Command:**
```bash
node dist/index.js
```

## ✅ Tests Locaux Validés

```bash
# Build réussi
✓ vite build → dist/public/
✓ esbuild → dist/index.js (46.9kb)

# Fichiers générés
✓ dist/index.js
✓ dist/public/index.html
✓ dist/public/assets/
```

## 🎯 Résultat Attendu

Après redéploiement, vous devriez voir :
```
✅ Production environment validated
🌐 serving on 0.0.0.0:10000
```

**Votre application PharmaChape sera accessible sur l'URL Render fournie !**