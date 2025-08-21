#!/bin/bash

# =====================================================
# PHARMA EXPRESS CI - SCRIPT DE RESTAURATION RAPIDE
# =====================================================

set -e

LOG_PREFIX="🔧 [DB-Restore]"

echo "$LOG_PREFIX 🚀 Début de la restauration de la base de données"

# Vérifier que DATABASE_URL est configurée
if [ -z "$DATABASE_URL" ]; then
    echo "$LOG_PREFIX ❌ Variable DATABASE_URL manquante"
    echo "$LOG_PREFIX 💡 Configurez DATABASE_URL dans les secrets Replit"
    exit 1
fi

echo "$LOG_PREFIX ✅ DATABASE_URL configurée"

# Trouver le fichier de sauvegarde le plus récent
BACKUP_FILE=$(ls -t backup/schema-backup-*.sql 2>/dev/null | head -1)

if [ -z "$BACKUP_FILE" ]; then
    echo "$LOG_PREFIX ⚠️ Aucun fichier de sauvegarde trouvé"
    echo "$LOG_PREFIX 🔄 Génération d'une nouvelle sauvegarde..."
    node scripts/backup-schema.js
    BACKUP_FILE=$(ls -t backup/schema-backup-*.sql 2>/dev/null | head -1)
fi

if [ -n "$BACKUP_FILE" ]; then
    echo "$LOG_PREFIX 📂 Utilisation de la sauvegarde: $BACKUP_FILE"
    echo "$LOG_PREFIX 🗃️ Restauration en cours..."
    
    # Exécuter le script SQL de restauration
    psql "$DATABASE_URL" -f "$BACKUP_FILE"
    
    echo "$LOG_PREFIX ✅ Base de données restaurée avec succès !"
else
    echo "$LOG_PREFIX ❌ Impossible de trouver un fichier de sauvegarde"
    exit 1
fi

# Exécuter les migrations Drizzle pour synchroniser
echo "$LOG_PREFIX 🔄 Synchronisation avec Drizzle..."
npx drizzle-kit push

echo "$LOG_PREFIX 🎉 Restauration terminée avec succès !"
echo "$LOG_PREFIX 💡 Votre base de données est maintenant opérationnelle"
