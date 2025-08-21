#!/usr/bin/env node

/**
 * PHARMA EXPRESS CI - GARDE DE SÉCURITÉ BASE DE DONNÉES
 * 
 * Ce script s'assure que l'application utilise TOUJOURS PostgreSQL
 * au lieu du stockage en mémoire, même après des redémarrages.
 * 
 * Il s'exécute automatiquement au démarrage de l'application.
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const LOG_PREFIX = '🛡️ [DB-Guard]';

/**
 * Vérifie la configuration de la base de données
 */
async function checkDatabaseConfig() {
  console.log(`${LOG_PREFIX} Vérification de la configuration de base de données`);
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl || dbUrl.trim() === '') {
    console.error(`${LOG_PREFIX} ❌ ERREUR CRITIQUE: DATABASE_URL manquante !`);
    console.error(`${LOG_PREFIX} 🚨 L'application va utiliser le stockage en mémoire`);
    console.error(`${LOG_PREFIX} 💡 Configurez DATABASE_URL dans les secrets Replit`);
    
    // Créer un fichier d'alerte
    await createDatabaseAlert();
    return false;
  }
  
  console.log(`${LOG_PREFIX} ✅ DATABASE_URL configurée correctement`);
  return true;
}

/**
 * Teste la connexion à la base de données
 */
async function testDatabaseConnection() {
  try {
    console.log(`${LOG_PREFIX} 🔌 Test de connexion à PostgreSQL...`);
    
    const { db } = await import('../server/db.js');
    await db.execute('SELECT 1 as test');
    
    console.log(`${LOG_PREFIX} ✅ Connexion PostgreSQL réussie`);
    return true;
  } catch (error) {
    console.error(`${LOG_PREFIX} ❌ Échec de connexion PostgreSQL:`, error.message);
    return false;
  }
}

/**
 * Vérifie que le stockage PostgreSQL est actif
 */
async function verifyPostgresStorage() {
  try {
    console.log(`${LOG_PREFIX} 🗃️ Vérification du type de stockage actif...`);
    
    const { createStorage } = await import('../server/storage-factory.js');
    const storage = createStorage();
    
    // Test simple pour vérifier le type de stockage
    if (storage.constructor.name === 'PostgresStorage') {
      console.log(`${LOG_PREFIX} ✅ PostgreSQL Storage activé`);
      return true;
    } else {
      console.warn(`${LOG_PREFIX} ⚠️ Stockage en mémoire détecté: ${storage.constructor.name}`);
      return false;
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} ❌ Erreur vérification stockage:`, error.message);
    return false;
  }
}

/**
 * Crée un fichier d'alerte visible
 */
async function createDatabaseAlert() {
  const alertPath = path.join(process.cwd(), 'DATABASE_ALERT.txt');
  
  const alertContent = `
⚠️ ⚠️ ⚠️ ALERTE CONFIGURATION BASE DE DONNÉES ⚠️ ⚠️ ⚠️

DATE: ${new Date().toLocaleString('fr-FR')}

PROBLÈME DÉTECTÉ:
L'application utilise actuellement le STOCKAGE EN MÉMOIRE au lieu de PostgreSQL.

CAUSE:
La variable DATABASE_URL n'est pas configurée ou est vide.

CONSÉQUENCES:
❌ Toutes les données seront perdues au redémarrage
❌ Les pharmacies et livreurs ne seront pas visibles
❌ Aucune persistance des commandes

SOLUTION:
1. Allez dans les secrets Replit
2. Configurez la variable DATABASE_URL avec votre base Neon
3. Redémarrez l'application

FORMAT DATABASE_URL:
postgresql://username:password@host:port/database

Pour supprimer cette alerte:
rm DATABASE_ALERT.txt

⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️
`;
  
  await fs.writeFile(alertPath, alertContent);
  console.log(`${LOG_PREFIX} 🚨 Fichier d'alerte créé: DATABASE_ALERT.txt`);
}

/**
 * Supprime le fichier d'alerte si tout va bien
 */
async function removeAlertIfExists() {
  const alertPath = path.join(process.cwd(), 'DATABASE_ALERT.txt');
  
  try {
    await fs.access(alertPath);
    await fs.unlink(alertPath);
    console.log(`${LOG_PREFIX} 🧹 Fichier d'alerte supprimé (configuration OK)`);
  } catch (error) {
    // Fichier n'existe pas, c'est normal
  }
}

/**
 * Sauvegarde automatique du statut
 */
async function saveStatus(isHealthy) {
  const statusPath = path.join(process.cwd(), '.database-status.json');
  
  const status = {
    timestamp: new Date().toISOString(),
    isHealthy,
    databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
    lastCheck: new Date().toLocaleString('fr-FR')
  };
  
  await fs.writeFile(statusPath, JSON.stringify(status, null, 2));
}

/**
 * Fonction principale de vérification
 */
async function guardDatabase() {
  console.log(`${LOG_PREFIX} 🚀 Démarrage de la garde de base de données`);
  console.log(`${LOG_PREFIX} 📅 ${new Date().toLocaleString('fr-FR')}`);
  
  let isHealthy = true;
  
  // 1. Vérifier DATABASE_URL
  if (!await checkDatabaseConfig()) {
    isHealthy = false;
  }
  
  // 2. Tester la connexion
  if (isHealthy && !await testDatabaseConnection()) {
    isHealthy = false;
  }
  
  // 3. Vérifier le type de stockage
  if (isHealthy && !await verifyPostgresStorage()) {
    isHealthy = false;
  }
  
  // 4. Actions selon le résultat
  if (isHealthy) {
    console.log(`${LOG_PREFIX} 🎉 Base de données PostgreSQL opérationnelle !`);
    await removeAlertIfExists();
  } else {
    console.error(`${LOG_PREFIX} 💔 Problème de configuration détecté`);
    await createDatabaseAlert();
  }
  
  // 5. Sauvegarder le statut
  await saveStatus(isHealthy);
  
  console.log(`${LOG_PREFIX} ✅ Vérification terminée`);
  return isHealthy;
}

// Exécution automatique si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  guardDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { guardDatabase, checkDatabaseConfig, testDatabaseConnection };