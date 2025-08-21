#!/bin/bash

# Script de test du build local
echo "🧪 Test du build local pour validation avant déploiement Render..."

# Nettoyer les anciens builds
rm -rf dist dist-client

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Build de l'application
echo "🏗️ Build de l'application..."
npm run build

# Vérifier que les artifacts existent
if [ -d "dist" ] && [ -f "dist/index.js" ]; then
    echo "✅ Build réussi ! Les fichiers de build sont présents."
    echo "📁 Contenu du build :"
    ls -la dist/
    echo ""
    echo "🚀 Votre application est prête pour le déploiement Render !"
else
    echo "❌ Erreur : Build incomplet. Vérifiez les logs ci-dessus."
    exit 1
fi