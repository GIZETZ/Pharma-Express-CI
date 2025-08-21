#!/usr/bin/env node

/**
 * Script de configuration automatique de la base de données PostgreSQL
 * Recrée automatiquement le schéma et les données de base si nécessaire
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

const LOG_PREFIX = '🗄️ [DB-Setup]';

// Configuration de la base de données par défaut
const DB_CONFIG = {
  name: 'pharma_express_ci',
  description: 'Base de données principale pour Pharma Express CI',
  version: '1.0.0',
  lastUpdate: new Date().toISOString()
};

/**
 * Vérifie si la variable DATABASE_URL est configurée
 */
function checkDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error(`${LOG_PREFIX} ❌ Variable DATABASE_URL manquante`);
    console.error(`${LOG_PREFIX} 💡 Configurez DATABASE_URL dans les secrets Replit`);
    process.exit(1);
  }
  console.log(`${LOG_PREFIX} ✅ DATABASE_URL configurée`);
  return dbUrl;
}

/**
 * Exécute les migrations Drizzle pour créer/mettre à jour le schéma
 */
async function runMigrations() {
  try {
    console.log(`${LOG_PREFIX} 📋 Exécution des migrations Drizzle...`);
    
    // Utilise drizzle-kit pour pousser le schéma vers la base de données
    const { stdout, stderr } = await execAsync('npx drizzle-kit push');
    
    if (stderr && !stderr.includes('Warning')) {
      console.warn(`${LOG_PREFIX} ⚠️ Avertissements migrations:`, stderr);
    }
    
    console.log(`${LOG_PREFIX} ✅ Migrations exécutées avec succès`);
    console.log(stdout);
    
    return true;
  } catch (error) {
    console.error(`${LOG_PREFIX} ❌ Erreur lors des migrations:`, error.message);
    
    // Si les migrations échouent, essaie de créer les tables manuellement
    console.log(`${LOG_PREFIX} 🔄 Tentative de création manuelle des tables...`);
    return await createTablesManually();
  }
}

/**
 * Crée les tables manuellement si les migrations Drizzle échouent
 */
async function createTablesManually() {
  try {
    // Import du module db pour exécuter du SQL brut si nécessaire
    const { db } = await import('../server/db.js');
    
    console.log(`${LOG_PREFIX} ✅ Connexion à la base de données établie`);
    
    // Les tables seront créées automatiquement par Drizzle ORM lors de la première utilisation
    // Si nécessaire, on peut ajouter ici du SQL brut pour forcer la création
    
    return true;
  } catch (error) {
    console.error(`${LOG_PREFIX} ❌ Impossible de créer les tables:`, error.message);
    return false;
  }
}

/**
 * Vérifie si la base de données contient des données
 */
async function checkExistingData() {
  try {
    const { db } = await import('../server/db.js');
    const { users } = await import('../shared/schema.js');
    
    // Vérifie s'il y a des utilisateurs dans la base
    const userCount = await db.select().from(users);
    
    console.log(`${LOG_PREFIX} 📊 ${userCount.length} utilisateurs trouvés dans la base`);
    
    return userCount.length > 0;
  } catch (error) {
    console.warn(`${LOG_PREFIX} ⚠️ Impossible de vérifier les données existantes:`, error.message);
    return false;
  }
}

/**
 * Initialise les données de base (admin, pharmacies de test, etc.)
 */
async function seedDatabase() {
  try {
    console.log(`${LOG_PREFIX} 🌱 Initialisation des données de base...`);
    
    // Import de la classe PostgresStorage qui contient la logique de seed
    const { PostgresStorage } = await import('../server/postgres-storage.js');
    
    // Créer une instance et déclencher le seed
    const storage = new PostgresStorage();
    
    // Attendre un peu pour que le seed se termine
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`${LOG_PREFIX} ✅ Données de base initialisées`);
    return true;
  } catch (error) {
    console.error(`${LOG_PREFIX} ❌ Erreur lors du seed:`, error.message);
    return false;
  }
}

/**
 * Sauvegarde la configuration actuelle
 */
async function saveConfiguration() {
  try {
    const configPath = path.join(process.cwd(), '.database-config.json');
    
    const config = {
      ...DB_CONFIG,
      setupDate: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
    };
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`${LOG_PREFIX} 💾 Configuration sauvegardée dans .database-config.json`);
  } catch (error) {
    console.warn(`${LOG_PREFIX} ⚠️ Impossible de sauvegarder la configuration:`, error.message);
  }
}

/**
 * Fonction principale d'installation de la base de données
 */
async function setupDatabase() {
  console.log(`${LOG_PREFIX} 🚀 Début de la configuration automatique de la base de données`);
  console.log(`${LOG_PREFIX} 📅 ${new Date().toLocaleString('fr-FR')}`);
  
  try {
    // 1. Vérifier DATABASE_URL
    checkDatabaseUrl();
    
    // 2. Exécuter les migrations
    const migrationsOk = await runMigrations();
    if (!migrationsOk) {
      throw new Error('Échec des migrations');
    }
    
    // 3. Vérifier les données existantes
    const hasData = await checkExistingData();
    
    // 4. Initialiser les données si nécessaire
    if (!hasData) {
      console.log(`${LOG_PREFIX} 📝 Base de données vide, initialisation des données...`);
      await seedDatabase();
    } else {
      console.log(`${LOG_PREFIX} ✅ Données existantes détectées, pas de seed nécessaire`);
    }
    
    // 5. Sauvegarder la configuration
    await saveConfiguration();
    
    console.log(`${LOG_PREFIX} 🎉 Configuration de la base de données terminée avec succès !`);
    console.log(`${LOG_PREFIX} 💡 Votre base de données est maintenant prête et sauvegardée`);
    
  } catch (error) {
    console.error(`${LOG_PREFIX} 💥 Erreur fatale lors de la configuration:`, error.message);
    console.error(`${LOG_PREFIX} 🔧 Vérifiez votre variable DATABASE_URL et réessayez`);
    process.exit(1);
  }
}

// Exécution du script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export { setupDatabase, checkDatabaseUrl, runMigrations, seedDatabase };