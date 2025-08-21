import { db } from './db';
import { users, pharmacies, prescriptions, orders, deliveryProfiles, deliveryVehicles, notifications } from '@shared/schema';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * Configuration automatique de la base de données au démarrage
 * Crée toutes les données nécessaires si elles n'existent pas
 */
export async function setupDatabase() {
  try {
    console.log('🔧 Vérification et configuration de la base de données...');

    // Vérifier si des utilisateurs existent déjà
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length === 0) {
      console.log('📊 Base de données vide détectée - Création des données initiales...');
      await createInitialData();
    } else {
      console.log('✅ Base de données existante détectée - Vérification de l\'intégrité...');
      await verifyDataIntegrity();
    }

    console.log('✅ Configuration de la base de données terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la configuration de la base de données:', error);
    throw error;
  }
}

async function createInitialData() {
  console.log('👥 Création des utilisateurs de base...');
  
  // Créer un hash pour les mots de passe
  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  // Créer les utilisateurs de base
  const createdUsers = await db.insert(users).values([
    {
      id: '07d1a4fc-9a15-4dac-b2dc-94537a7b0faf',
      firstName: 'Aya',
      lastName: 'Diallo',
      phone: '+225 07 12 34 56',
      address: 'Cocody, Abidjan',
      password: defaultPasswordHash,
      role: 'patient',
      isActive: true
    },
    {
      id: 'c604f50c-7030-4a81-a245-5d782187a966',
      firstName: 'Jean-Claude',
      lastName: 'Koffi',
      phone: '+225 07 44 55 66',
      address: 'Abobo, Abidjan',
      password: defaultPasswordHash,
      role: 'livreur',
      isActive: true
    },
    {
      id: 'f8a1b2c3-d4e5-f6g7-h8i9-j0k1l2m3n4o5',
      firstName: 'Dr. Marie',
      lastName: 'Kouadio',
      phone: '+225 21 22 33 44',
      address: 'Plateau, Abidjan',
      password: defaultPasswordHash,
      role: 'pharmacien',
      isActive: true
    },
    {
      id: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
      firstName: 'Admin',
      lastName: 'System',
      phone: '+225 21 00 00 00',
      address: 'Centre-ville, Abidjan',
      password: defaultPasswordHash,
      role: 'admin',
      isActive: true
    }
  ]).returning();

  console.log('🏪 Création des pharmacies...');
  
  // Créer les pharmacies
  const createdPharmacies = await db.insert(pharmacies).values([
    {
      id: '2d01e53b-62bb-4248-bea1-0c463f674749',
      name: 'Pharmacie Centrale d\'Abidjan',
      address: 'Boulevard de la République, Plateau, Abidjan',
      phone: '+225 21 22 33 44',
      latitude: '5.316667',
      longitude: '-4.0',
      isOpen: true,
      isEmergency24h: false
    },
    {
      id: '185d81f3-3db5-4eb0-9549-92197bcf039d',
      name: 'Pharmacie de Garde Cocody',
      address: 'Riviera Golf, Cocody, Abidjan',
      phone: '+225 22 44 55 66',
      latitude: '5.35',
      longitude: '-3.98',
      isOpen: true,
      isEmergency24h: true
    }
  ]).returning();

  console.log('👨‍⚕️ Création du profil livreur...');
  
  // Créer le profil du livreur
  await db.insert(deliveryProfiles).values({
    userId: 'c604f50c-7030-4a81-a245-5d782187a966',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    emergencyContactName: 'Marie Kouassi',
    emergencyContactPhone: '+225 05 44 22 11',
    rating: '4.8',
    totalDeliveries: '127',
    isAvailable: true
  });

  console.log('🚗 Création du véhicule du livreur...');
  
  // Créer le véhicule du livreur
  await db.insert(deliveryVehicles).values({
    deliveryPersonId: 'c604f50c-7030-4a81-a245-5d782187a966',
    vehicleType: 'moto',
    brand: 'Yamaha',
    model: 'DT 125',
    color: 'Rouge',
    licensePlate: 'CI-2578-AB',
    verificationStatus: 'approved'
  });

  console.log('📋 Création d\'une prescription de test...');
  
  // Créer une prescription de test
  const prescriptionId = '5204474e-2e78-47b5-8a71-ef2f1f1e466a';
  await db.insert(prescriptions).values({
    id: prescriptionId,
    userId: '07d1a4fc-9a15-4dac-b2dc-94537a7b0faf',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400',
    status: 'approved',
    medications: {
      items: [
        { name: 'Paracétamol 500mg', quantity: 2 },
        { name: 'Amoxicilline 250mg', quantity: 1 }
      ]
    },
    createdAt: new Date(Date.now() - 45 * 60 * 1000) // Il y a 45 minutes
  });

  console.log('📦 Création d\'une commande de test...');
  
  // Créer une commande de test
  await db.insert(orders).values({
    userId: '07d1a4fc-9a15-4dac-b2dc-94537a7b0faf',
    pharmacyId: '2d01e53b-62bb-4248-bea1-0c463f674749',
    prescriptionId: prescriptionId,
    deliveryPersonId: 'c604f50c-7030-4a81-a245-5d782187a966',
    status: 'in_transit',
    deliveryAddress: 'Cocody, Abidjan, Côte d\'Ivoire',
    totalAmount: '25.50',
    estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000), // Dans 30 minutes
    medications: {
      items: [
        { name: 'Paracétamol 500mg', quantity: 2 },
        { name: 'Amoxicilline 250mg', quantity: 1 }
      ]
    }
  });

  console.log('✅ Données initiales créées avec succès');
}

async function verifyDataIntegrity() {
  // Vérifier que les tables essentielles ont des données
  const userCount = await db.select({ count: sql`count(*)` }).from(users);
  const pharmacyCount = await db.select({ count: sql`count(*)` }).from(pharmacies);
  
  console.log(`📊 ${userCount[0].count} utilisateurs trouvés`);
  console.log(`🏪 ${pharmacyCount[0].count} pharmacies trouvées`);

  // Vérifier que le profil du livreur existe
  const deliveryProfileCount = await db.select({ count: sql`count(*)` }).from(deliveryProfiles);
  if (Number(deliveryProfileCount[0].count) === 0) {
    console.log('⚠️ Aucun profil de livreur détecté - Création du profil de base...');
    await createDeliveryProfileIfMissing();
  }
}

async function createDeliveryProfileIfMissing() {
  // Trouver un livreur existant
  const deliveryPerson = await db.select().from(users).where(sql`role = 'livreur'`).limit(1);
  
  if (deliveryPerson.length > 0) {
    await db.insert(deliveryProfiles).values({
      userId: deliveryPerson[0].id,
      profilePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      emergencyContactName: 'Contact d\'urgence',
      emergencyContactPhone: '+225 00 00 00 00',
      rating: '4.5',
      totalDeliveries: '50',
      isAvailable: true
    });

    await db.insert(deliveryVehicles).values({
      deliveryPersonId: deliveryPerson[0].id,
      vehicleType: 'moto',
      brand: 'Yamaha',
      model: 'DT 125',
      color: 'Rouge',
      licensePlate: 'CI-2578-AB',
      verificationStatus: 'approved'
    });

    console.log('✅ Profil de livreur créé pour:', deliveryPerson[0].firstName, deliveryPerson[0].lastName);
  }
}