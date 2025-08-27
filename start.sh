#!/bin/bash

# Script de démarrage pour production
set -e

echo "🚀 Starting PharmaChape in production mode..."

# Vérifier les variables d'environnement critiques
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "⚠️  Warning: SESSION_SECRET not set, using default (not recommended for production)"
fi

# Vérifier que les fichiers de build existent
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found. Please run build first."
    exit 1
fi

echo "✅ Environment check passed"
echo "🌐 Starting server..."

# Démarrer l'application
exec node dist/index.js