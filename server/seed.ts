import { db } from "./db";
import { users, pharmacies } from "@shared/schema";
import bcrypt from "bcryptjs";

export async function seedTestData() {
  console.log("🌱 Seeding test data...");

  // Comptes de test avec mots de passe hashés
  const testUsers = [
    {
      firstName: "Admin",
      lastName: "YahoPharma", 
      phone: "+225 01 23 45 67",
      address: "Siège YahoPharma, Abidjan",
      password: await bcrypt.hash("admin123", 10),
      role: "admin",
      language: "fr",
      verificationStatus: "approved"
    },
    {
      firstName: "Dr. Marie",
      lastName: "Kouassi",
      phone: "+225 07 11 22 33", 
      address: "Pharmacie de la Paix, Abidjan",
      password: await bcrypt.hash("pharma123", 10),
      role: "pharmacien",
      language: "fr",
      verificationStatus: "approved"
    },
    {
      firstName: "Jean-Claude",
      lastName: "Koffi",
      phone: "+225 07 44 55 66",
      address: "Zone livraison Abidjan", 
      password: await bcrypt.hash("livreur123", 10),
      role: "livreur",
      language: "fr",
      verificationStatus: "approved"
    },
    {
      firstName: "Aya",
      lastName: "Diallo",
      phone: "+225 05 77 88 99",
      address: "Cocody, Abidjan",
      password: await bcrypt.hash("patient123", 10),
      role: "patient",
      language: "fr",
      verificationStatus: "approved"
    },
    {
      firstName: "Patient",
      lastName: "Test",
      phone: "+225 01 11 11 11",
      address: "Marcory, Abidjan", 
      password: await bcrypt.hash("test123", 10),
      role: "patient",
      language: "fr",
      verificationStatus: "approved"
    }
  ];

  // Insérer les utilisateurs de test
  for (const user of testUsers) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existing = await db.select().from(users).where(eq(users.phone, user.phone)).limit(1);
      if (existing.length === 0) {
        await db.insert(users).values(user);
        console.log(`✅ Utilisateur créé: ${user.firstName} ${user.lastName} (${user.role})`);
      } else {
        console.log(`⚠️  Utilisateur existe déjà: ${user.phone}`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la création de l'utilisateur ${user.phone}:`, error);
    }
  }

  // Données pharmacies de test
  const testPharmacies = [
    {
      name: "Pharmacie de la Paix",
      address: "Avenue Houphouet-Boigny, Cocody",
      latitude: "5.3364",
      longitude: "-4.0267", 
      phone: "+225 21 22 33 44",
      rating: "4.8",
      deliveryTime: "25",
      isOpen: true,
      isEmergency24h: true,
      openingHours: {
        monday: "08:00-20:00",
        tuesday: "08:00-20:00",
        wednesday: "08:00-20:00", 
        thursday: "08:00-20:00",
        friday: "08:00-20:00",
        saturday: "08:00-18:00",
        sunday: "09:00-17:00"
      }
    },
    {
      name: "Pharmacie du Plateau",
      address: "Boulevard de la Republique, Plateau",
      latitude: "5.3200",
      longitude: "-4.0130",
      phone: "+225 21 32 45 78", 
      rating: "4.6",
      deliveryTime: "30",
      isOpen: true,
      isEmergency24h: false,
      openingHours: {
        monday: "07:30-19:30",
        tuesday: "07:30-19:30", 
        wednesday: "07:30-19:30",
        thursday: "07:30-19:30",
        friday: "07:30-19:30",
        saturday: "08:00-18:00",
        sunday: "09:00-16:00"
      }
    },
    {
      name: "Pharmacie Moderne",
      address: "Rue des Jardins, Cocody",
      latitude: "5.3580", 
      longitude: "-3.9889",
      phone: "+225 22 44 56 89",
      rating: "4.4",
      deliveryTime: "20",
      isOpen: true,
      isEmergency24h: false,
      openingHours: {
        monday: "08:00-19:00",
        tuesday: "08:00-19:00",
        wednesday: "08:00-19:00",
        thursday: "08:00-19:00", 
        friday: "08:00-19:00",
        saturday: "08:00-17:00",
        sunday: "closed"
      }
    }
  ];

  // Insérer les pharmacies de test
  for (const pharmacy of testPharmacies) {
    try {
      // Vérifier si la pharmacie existe déjà
      const existing = await db.select().from(pharmacies).where(eq(pharmacies.name, pharmacy.name)).limit(1);
      if (existing.length === 0) {
        await db.insert(pharmacies).values(pharmacy);
        console.log(`✅ Pharmacie créée: ${pharmacy.name}`);
      } else {
        console.log(`⚠️  Pharmacie existe déjà: ${pharmacy.name}`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la création de la pharmacie ${pharmacy.name}:`, error);
    }
  }

  console.log("🎉 Seed terminé!");
  console.log("\n📋 Comptes de test disponibles:");
  console.log("- Admin: +225 01 23 45 67 / admin123");
  console.log("- Pharmacien: +225 07 11 22 33 / pharma123"); 
  console.log("- Livreur: +225 07 44 55 66 / livreur123");
  console.log("- Patient: +225 05 77 88 99 / patient123");
  console.log("- Patient 2: +225 01 11 11 11 / test123");
}

import { eq } from "drizzle-orm";

// Exécution du seed si ce fichier est lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestData().catch(console.error);
}