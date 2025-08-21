#!/bin/bash

# Script de build pour Render
set -e

echo "🔧 Installing dependencies..."
npm install

echo "🏗️ Building application..."
npm run build

echo "✅ Build completed successfully!"

# Vérifier que les fichiers de build existent
if [ ! -d "dist" ]; then
  echo "❌ Error: dist directory not found!"
  exit 1
fi

if [ ! -d "dist-client" ]; then
  echo "❌ Error: dist-client directory not found!"
  exit 1
fi

echo "📦 Build artifacts ready for deployment"