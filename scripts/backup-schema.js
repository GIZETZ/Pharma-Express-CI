#!/usr/bin/env node

/**
 * Script de sauvegarde automatique du schéma de base de données
 * Génère un fichier SQL avec la structure complète et les données essentielles
 */

import fs from 'fs/promises';
import path from 'path';

const LOG_PREFIX = '💾 [DB-Backup]';

/**
 * Génère le script SQL de sauvegarde du schéma complet
 */
async function generateSchemaBackup() {
  const timestamp = new Date().toISOString().split('T')[0];
  const backupPath = path.join(process.cwd(), 'backup', `schema-backup-${timestamp}.sql`);
  
  // Assurer que le dossier backup existe
  await fs.mkdir(path.dirname(backupPath), { recursive: true });
  
  const sqlContent = `-- =====================================================
-- PHARMA EXPRESS CI - SCHEMA BACKUP
-- Date: ${new Date().toLocaleString('fr-FR')}
-- Version: 1.0.0
-- =====================================================

-- Suppression des tables existantes (si elles existent)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS pharmacies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- TABLE: users
-- =====================================================
CREATE TABLE users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    firstName VARCHAR NOT NULL,
    lastName VARCHAR NOT NULL,
    phone VARCHAR UNIQUE NOT NULL,
    address VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'patient',
    language VARCHAR(2) DEFAULT 'fr',
    profileImageUrl VARCHAR,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW(),
    isActive BOOLEAN DEFAULT true,
    verificationStatus VARCHAR DEFAULT 'pending',
    deliveryApplicationStatus VARCHAR DEFAULT 'none',
    pharmacyId VARCHAR,
    appliedPharmacyId VARCHAR,
    motivationLetter TEXT,
    experience TEXT,
    availability TEXT
);

-- =====================================================
-- TABLE: pharmacies
-- =====================================================
CREATE TABLE pharmacies (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    phone VARCHAR,
    address VARCHAR NOT NULL,
    latitude VARCHAR,
    longitude VARCHAR,
    rating VARCHAR,
    reviewCount VARCHAR,
    deliveryTime VARCHAR,
    isOpen BOOLEAN DEFAULT true,
    isEmergency24h BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABLE: prescriptions
-- =====================================================
CREATE TABLE prescriptions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    createdAt TIMESTAMP DEFAULT NOW(),
    status VARCHAR DEFAULT 'pending',
    userId VARCHAR NOT NULL REFERENCES users(id),
    imageUrl VARCHAR NOT NULL,
    medications JSONB DEFAULT '[]'
);

-- =====================================================
-- TABLE: orders
-- =====================================================
CREATE TABLE orders (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW(),
    pharmacyId VARCHAR NOT NULL REFERENCES pharmacies(id),
    status VARCHAR DEFAULT 'pending',
    userId VARCHAR NOT NULL REFERENCES users(id),
    medications JSONB DEFAULT '[]',
    prescriptionId VARCHAR REFERENCES prescriptions(id),
    totalAmount VARCHAR,
    deliveryAddress VARCHAR,
    deliveryLatitude VARCHAR,
    deliveryLongitude VARCHAR,
    deliveryNotes TEXT,
    bonDocuments JSONB DEFAULT '[]',
    estimatedDelivery TIMESTAMP,
    deliveredAt TIMESTAMP,
    deliveryPersonId VARCHAR REFERENCES users(id)
);

-- =====================================================
-- TABLE: notifications
-- =====================================================
CREATE TABLE notifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    createdAt TIMESTAMP DEFAULT NOW(),
    type VARCHAR NOT NULL,
    userId VARCHAR NOT NULL REFERENCES users(id),
    title VARCHAR NOT NULL,
    body VARCHAR NOT NULL,
    orderId VARCHAR REFERENCES orders(id),
    isRead BOOLEAN DEFAULT false
);

-- =====================================================
-- INDEX POUR PERFORMANCES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_pharmacy_id ON users(pharmacyId);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verificationStatus);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(userId);
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy_id ON orders(pharmacyId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_person ON orders(deliveryPersonId);
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(userId);

-- =====================================================
-- DONNÉES DE BASE ESSENTIELLES
-- =====================================================

-- Admin principal du système
INSERT INTO users (
    firstName, lastName, phone, address, password, role, 
    language, isActive, verificationStatus
) VALUES (
    'Admin', 'YahoPharma', '+225 01 23 45 67', 
    'Siège YahoPharma, Abidjan', 
    '$2b$10$rVl.E8rV7mGdXJZQx8QcX.HQCqJC2HQY2Y2GqcJqXc5J5QcX8QcX.', 
    'admin', 'fr', true, 'approved'
) ON CONFLICT (phone) DO NOTHING;

-- Pharmacien de test 1
INSERT INTO users (
    firstName, lastName, phone, address, password, role, 
    language, isActive, verificationStatus, pharmacyId
) VALUES (
    'Dr. Marie', 'Kouassi', '+225 07 11 22 33', 
    'Pharmacie de la Paix, Abidjan', 
    '$2b$10$rVl.E8rV7mGdXJZQx8QcX.HQCqJC2HQY2Y2GqcJqXc5J5QcX8QcX.', 
    'pharmacien', 'fr', true, 'approved', 
    (SELECT id FROM pharmacies WHERE phone = '+225 07 11 22 33' LIMIT 1)
) ON CONFLICT (phone) DO NOTHING;

-- Pharmacien de test 2
INSERT INTO users (
    firstName, lastName, phone, address, password, role, 
    language, isActive, verificationStatus, pharmacyId
) VALUES (
    'Dr. Adjoua', 'Bamba', '+225 05 44 33 22', 
    'Pharmacie Centrale Plus, Marcory', 
    '$2b$10$rVl.E8rV7mGdXJZQx8QcX.HQCqJC2HQY2Y2GqcJqXc5J5QcX8QcX.', 
    'pharmacien', 'fr', true, 'approved',
    (SELECT id FROM pharmacies WHERE phone = '+225 05 44 33 22' LIMIT 1)
) ON CONFLICT (phone) DO NOTHING;

-- Pharmacies de test
INSERT INTO pharmacies (
    name, address, latitude, longitude, phone, rating, 
    deliveryTime, isOpen
) VALUES 
(
    'Pharmacie Dr. Marie Kouassi', 'Quartier Riviera Golf, Cocody', 
    '5.3364', '-4.0267', '+225 07 11 22 33', '4.8', '25', true
),
(
    'Pharmacie de la Paix', 'Boulevard de la Paix, Cocody', 
    '5.3364', '-4.0267', '+225 05 44 33 22', '4.7', '30', true
),
(
    'Pharmacie Centrale Plus', 'Zone commerciale Marcory', 
    '5.2886', '-3.9986', '+225 07 88 99 00', '4.6', '20', true
)
ON CONFLICT (phone) DO NOTHING;

-- Livreurs de test
INSERT INTO users (
    firstName, lastName, phone, address, password, role, 
    language, isActive, verificationStatus, deliveryApplicationStatus, pharmacyId
) VALUES 
(
    'Jean-Claude', 'Koffi', '+225 07 44 55 66', 
    'Zone livraison Abidjan', 
    '$2b$10$rVl.E8rV7mGdXJZQx8QcX.HQCqJC2HQY2Y2GqcJqXc5J5QcX8QcX.', 
    'livreur', 'fr', true, 'approved', 'approved',
    (SELECT id FROM pharmacies WHERE phone = '+225 07 11 22 33' LIMIT 1)
),
(
    'Aya', 'Traore', '+225 05 77 88 99', 
    'Marcory, Abidjan', 
    '$2b$10$rVl.E8rV7mGdXJZQx8QcX.HQCqJC2HQY2Y2GqcJqXc5J5QcX8QcX.', 
    'livreur', 'fr', true, 'approved', 'approved',
    (SELECT id FROM pharmacies WHERE phone = '+225 05 44 33 22' LIMIT 1)
)
ON CONFLICT (phone) DO NOTHING;

-- Patient de test
INSERT INTO users (
    firstName, lastName, phone, address, password, role, 
    language, isActive, verificationStatus
) VALUES (
    'Konan', 'Akissi', '+225 01 11 22 33', 
    'Cocody, Abidjan', 
    '$2b$10$rVl.E8rV7mGdXJZQx8QcX.HQCqJC2HQY2Y2GqcJqXc5J5QcX8QcX.', 
    'patient', 'fr', true, 'approved'
) ON CONFLICT (phone) DO NOTHING;

-- =====================================================
-- SCRIPT TERMINÉ AVEC SUCCÈS
-- =====================================================
COMMENT ON DATABASE CURRENT_DATABASE() IS 'Pharma Express CI - Base de données restaurée le ${new Date().toLocaleString('fr-FR')}';

SELECT 
    'Database schema restored successfully!' as status,
    COUNT(*) as total_users 
FROM users;
`;

  await fs.writeFile(backupPath, sqlContent);
  console.log(`${LOG_PREFIX} ✅ Sauvegarde du schéma créée: ${backupPath}`);
  
  return backupPath;
}

/**
 * Crée un script de restauration rapide
 */
async function createRestoreScript() {
  const restoreScriptPath = path.join(process.cwd(), 'scripts', 'restore-database.sh');
  
  const scriptContent = `#!/bin/bash

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
`;

  await fs.writeFile(restoreScriptPath, scriptContent);
  await fs.chmod(restoreScriptPath, '755'); // Rendre exécutable
  
  console.log(`${LOG_PREFIX} ✅ Script de restauration créé: ${restoreScriptPath}`);
  
  return restoreScriptPath;
}

/**
 * Fonction principale de sauvegarde
 */
async function createBackup() {
  console.log(`${LOG_PREFIX} 🚀 Création de la sauvegarde du schéma`);
  
  try {
    await generateSchemaBackup();
    await createRestoreScript();
    
    console.log(`${LOG_PREFIX} 🎉 Sauvegarde créée avec succès !`);
    console.log(`${LOG_PREFIX} 💡 Utilisez 'npm run db:restore' pour restaurer la base de données`);
    
  } catch (error) {
    console.error(`${LOG_PREFIX} ❌ Erreur lors de la sauvegarde:`, error.message);
    process.exit(1);
  }
}

// Exécution du script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  createBackup();
}

export { generateSchemaBackup, createRestoreScript, createBackup };