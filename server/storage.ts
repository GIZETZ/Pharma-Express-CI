import {
  type User,
  type InsertUser,
  type Pharmacy,
  type InsertPharmacy,
  type Prescription,
  type InsertPrescription,
  type Order,
  type InsertOrder,
  type DeliveryPerson,
  type Notification,
  type InsertNotification,
} from "@shared/firebase-schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  loginUser(phone: string, password: string): Promise<User | null>;

  // Admin operations
  getPendingUsers(): Promise<User[]>;
  updateUserVerificationStatus(userId: string, status: "approved" | "rejected" | "pending"): Promise<User | null>;
  getApplicationStats(): Promise<{
    patients: number;
    pharmaciens: number;
    livreurs: number;
    orders: number;
    pendingOrders: number;
    activeDeliveries: number;
    completedDeliveries: number;
  }>;

  // Pharmacy operations
  getPharmacies(lat?: number, lng?: number, radius?: number): Promise<Pharmacy[]>;
  getPharmacy(id: string): Promise<Pharmacy | undefined>;
  createPharmacy(pharmacy: InsertPharmacy): Promise<Pharmacy>;
  updatePharmacy(id: string, updates: Partial<InsertPharmacy>): Promise<Pharmacy | undefined>;
  getPharmacyByUserId(userId: string): Promise<Pharmacy | undefined>;
  getPharmacyById(pharmacyId: string): Promise<Pharmacy | undefined>;

  // Prescription operations
  getPrescription(id: string): Promise<Prescription | undefined>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  getUserPrescriptions(userId: string): Promise<Prescription[]>;
  updatePrescriptionStatus(id: string, status: string): Promise<Prescription | undefined>;

  // Order operations
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  getUserOrders(userId: string): Promise<Order[]>;
  getCurrentOrder(userId: string): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  updateOrderMedications(id: string, medications: any[]): Promise<Order | undefined>;

  // Delivery person operations
  getDeliveryPerson(id: string): Promise<DeliveryPerson | undefined>;
  getAvailableDeliveryPersonnel(): Promise<User[]>;
  getDeliveryOrders(): Promise<Order[]>;
  assignDeliveryPerson(orderId: string, deliveryPersonId: string): Promise<Order | undefined>;

  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private pharmacies: Map<string, Pharmacy> = new Map();
  private prescriptions: Map<string, Prescription> = new Map();
  private orders: Map<string, Order> = new Map();
  private deliveryPersons: Map<string, DeliveryPerson> = new Map();
  private notifications: Map<string, Notification> = new Map();

  constructor() {
    this.seedData();
  }

  private async seedData() {
    // Seed test users for each role
    const testUsers = [
      {
        firstName: "Admin",
        lastName: "YahoPharma",
        phone: "+225 01 23 45 67",
        address: "Siège YahoPharma, Abidjan",
        password: "admin123",
        role: "admin" as const,
        language: "fr",
        isActive: true,
        verificationStatus: "approved" as const
      },
      {
        firstName: "Dr. Marie",
        lastName: "Kouassi",
        phone: "+225 07 11 22 33",
        address: "Pharmacie de la Paix, Abidjan",
        password: "pharma123",
        role: "pharmacien" as const,
        language: "fr",
        isActive: true,
        verificationStatus: "approved" as const
      },
      {
        firstName: "Dr. Adjoua",
        lastName: "Bamba",
        phone: "+225 05 44 33 22",
        address: "Pharmacie Centrale Plus, Marcory",
        password: "pharma2024",
        role: "pharmacien" as const,
        language: "fr",
        isActive: true,
        verificationStatus: "approved" as const
      },
      {
        firstName: "Jean-Claude",
        lastName: "Koffi",
        phone: "+225 07 44 55 66",
        address: "Zone livraison Abidjan",
        password: "livreur123",
        role: "livreur" as const,
        language: "fr",
        isActive: true,
        verificationStatus: "approved" as const
      },
      {
        firstName: "Aya",
        lastName: "Diallo",
        phone: "+225 05 77 88 99",
        address: "Cocody, Abidjan",
        password: "patient123",
        role: "patient" as const,
        language: "fr",
        isActive: true,
        verificationStatus: "approved" as const
      }
    ];

    for (const userData of testUsers) {
      await this.createUser(userData);
    }

    // Seed pharmacies
    const testPharmacies = [
      {
        name: "Pharmacie Dr. Marie Kouassi",
        address: "Quartier Riviera Golf, Cocody",
        latitude: 5.3364,
        longitude: -4.0267,
        phone: "+225 07 11 22 33",
        rating: 4.8,
        deliveryTime: "25",
        isOpen: true,
        openingHours: {
          monday: { open: "08:00", close: "20:00" },
          tuesday: { open: "08:00", close: "20:00" },
          wednesday: { open: "08:00", close: "20:00" },
          thursday: { open: "08:00", close: "20:00" },
          friday: { open: "08:00", close: "20:00" },
          saturday: { open: "08:00", close: "18:00" },
          sunday: { open: "09:00", close: "17:00" }
        }
      },
      {
        name: "Pharmacie de la Paix",
        address: "Boulevard de la Paix, Cocody",
        latitude: 5.3364,
        longitude: -4.0267,
        phone: "+225 27 22 44 55 66",
        rating: 4.5,
        deliveryTime: "30",
        isOpen: true
      },
      {
        name: "Pharmacie du Plateau",
        address: "Avenue Chardy, Plateau",
        latitude: 5.3198,
        longitude: -4.0267,
        phone: "+225 27 20 21 22 23",
        rating: 4.2,
        deliveryTime: "25",
        isOpen: true
      },
      {
        name: "Pharmacie Centrale Plus",
        address: "Boulevard VGE, Marcory",
        latitude: 5.2845,
        longitude: -3.9731,
        phone: "+225 05 44 33 22",
        rating: 4.7,
        deliveryTime: "20",
        isOpen: true,
        openingHours: {
          monday: { open: "08:00", close: "20:00" },
          tuesday: { open: "08:00", close: "20:00" },
          wednesday: { open: "08:00", close: "20:00" },
          thursday: { open: "08:00", close: "20:00" },
          friday: { open: "08:00", close: "20:00" },
          saturday: { open: "09:00", close: "18:00" },
          sunday: { open: "10:00", close: "16:00" }
        }
      },
      {
        name: "Ithiel Pharma",
        address: "Avenue des Martyrs, Yopougon",
        latitude: 5.3456,
        longitude: -4.0892,
        phone: "+225 27 23 45 67 89",
        rating: 4.6,
        deliveryTime: "25",
        isOpen: true,
        openingHours: {
          monday: { open: "07:30", close: "19:30" },
          tuesday: { open: "07:30", close: "19:30" },
          wednesday: { open: "07:30", close: "19:30" },
          thursday: { open: "07:30", close: "19:30" },
          friday: { open: "07:30", close: "19:30" },
          saturday: { open: "08:00", close: "18:00" },
          sunday: { open: "09:00", close: "17:00" }
        }
      }
    ];

    for (const pharmacyData of testPharmacies) {
      await this.createPharmacy(pharmacyData);
    }

    // Créer des commandes de test pour le dashboard livreur
    await this.createTestDeliveryOrders();
  }

  private async createTestDeliveryOrders() {
    // Récupérer les utilisateurs de test
    const patient = Array.from(this.users.values()).find(u => u.role === 'patient');
    const livreur = Array.from(this.users.values()).find(u => u.role === 'livreur');
    const pharmacies = Array.from(this.pharmacies.values());

    if (!patient || !livreur || pharmacies.length === 0) return;

    // Créer quelques commandes de test
    const testOrders = [
      {
        userId: patient.id,
        pharmacyId: pharmacies[0].id,
        deliveryAddress: "Riviera Golf, Cocody, Abidjan",
        deliveryLatitude: 5.3364,
        deliveryLongitude: -4.0267,
        medications: [
          { name: "Paracétamol 500mg", quantity: 2, price: "1500", dosage: "1 comprimé 3x/jour" },
          { name: "Amoxicilline 250mg", quantity: 1, price: "3500", dosage: "1 gélule 2x/jour" }
        ],
        status: "ready_for_delivery",
        totalAmount: "5000",
        deliveryPersonId: livreur.id // Assignée au livreur
      },
      {
        userId: patient.id,
        pharmacyId: pharmacies[1].id,
        deliveryAddress: "Plateau, Abidjan",
        deliveryLatitude: 5.3198,
        deliveryLongitude: -4.0267,
        medications: [
          { name: "Doliprane 1000mg", quantity: 1, price: "2500", dosage: "1 comprimé si douleur" }
        ],
        status: "in_delivery",
        totalAmount: "2500",
        deliveryPersonId: livreur.id // En cours de livraison
      },
      {
        userId: patient.id,
        pharmacyId: pharmacies[2].id,
        deliveryAddress: "Marcory Zone 4, Abidjan",
        deliveryLatitude: 5.2845,
        deliveryLongitude: -3.9731,
        medications: [
          { name: "Vitamine C", quantity: 1, price: "1200", dosage: "1 comprimé/jour" }
        ],
        status: "ready_for_delivery",
        totalAmount: "1200"
        // Pas de deliveryPersonId - disponible pour assignation
      }
    ];

    for (const orderData of testOrders) {
      const orderId = randomUUID();
      const order: Order = {
        id: orderId,
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.orders.set(orderId, order);
    }

    console.log(`✅ ${testOrders.length} commandes de test créées pour le dashboard livreur`);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const newUser: User = {
      id,
      ...user,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Default values for new fields related to delivery applications
      appliedPharmacyId: undefined,
      deliveryApplicationStatus: user.role === 'livreur' ? 'pending' : 'none',
      pharmacyId: undefined, // This will be set upon approval
    };

    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async loginUser(phone: string, password: string): Promise<User | null> {
    const user = await this.getUserByPhone(phone);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    // Allow login for livreurs if they are approved, regardless of deliveryApplicationStatus
    // The frontend will handle showing pending validation if needed
    // Only block login if user account itself is not verified yet

    return user;
  }

  // Admin operations
  async getPendingUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.verificationStatus === 'pending' && ['pharmacien', 'livreur'].includes(user.role));
  }

  async updateUserVerificationStatus(userId: string, status: "approved" | "rejected" | "pending"): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    user.verificationStatus = status;
    user.updatedAt = new Date();

    // If a livreur is approved, ensure their application status reflects this
    if (user.role === 'livreur' && status === 'approved') {
      // Assuming verification and application are linked or handled separately
      // If verification implies immediate approval for delivery, set status here
      if (user.deliveryApplicationStatus === 'pending') {
         user.deliveryApplicationStatus = 'approved';
      }
    } else if (user.role === 'livreur' && status === 'rejected') {
      user.deliveryApplicationStatus = 'rejected';
      user.appliedPharmacyId = undefined; // Clear application if rejected
    }

    this.users.set(userId, user);
    return user;
  }

  async getApplicationStats(): Promise<{
    patients: number;
    pharmaciens: number;
    livreurs: number;
    orders: number;
    pendingOrders: number;
    activeDeliveries: number;
    completedDeliveries: number;
  }> {
    const usersArray = Array.from(this.users.values());
    const ordersArray = Array.from(this.orders.values());

    return {
      patients: usersArray.filter(u => u.role === 'patient').length,
      pharmaciens: usersArray.filter(u => u.role === 'pharmacien').length,
      livreurs: usersArray.filter(u => u.role === 'livreur').length,
      orders: ordersArray.length,
      pendingOrders: ordersArray.filter(o => o.status === 'pending').length,
      activeDeliveries: ordersArray.filter(o => ['confirmed', 'preparing', 'in_transit'].includes(o.status)).length,
      completedDeliveries: ordersArray.filter(o => o.status === 'delivered').length,
    };
  }

  // Admin methods for complete management
  async getAllOrdersForAdmin(): Promise<any[]> {
    const allOrders = Array.from(this.orders.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return allOrders.map(order => {
      const pharmacy = this.pharmacies.get(order.pharmacyId);
      const patient = this.users.get(order.userId);
      const deliveryPerson = order.deliveryPersonId ? this.users.get(order.deliveryPersonId) : null;

      return {
        ...order,
        pharmacy: pharmacy ? {
          id: pharmacy.id,
          name: pharmacy.name,
          address: pharmacy.address,
          phone: pharmacy.phone
        } : null,
        patient: patient ? {
          firstName: patient.firstName,
          lastName: patient.lastName,
          phone: patient.phone
        } : null,
        deliveryPerson: deliveryPerson ? {
          firstName: deliveryPerson.firstName,
          lastName: deliveryPerson.lastName,
          phone: deliveryPerson.phone
        } : null,
        totalAmount: order.totalAmount || '0'
      };
    });
  }

  async getWeeklyStats(weekDate: Date): Promise<{ totalRevenue: number; ordersCount: number }> {
    const startOfWeek = new Date(weekDate);
    startOfWeek.setDate(weekDate.getDate() - weekDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekOrders = Array.from(this.orders.values()).filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startOfWeek && orderDate <= endOfWeek && 
             ['confirmed', 'ready_for_delivery', 'in_delivery', 'delivered'].includes(order.status);
    });

    const totalRevenue = weekOrders.reduce((sum, order) => {
      return sum + (parseFloat(order.totalAmount || '0') || 0);
    }, 0);

    return {
      totalRevenue,
      ordersCount: weekOrders.length
    };
  }

  async getAllPharmaciesForAdmin(): Promise<any[]> {
    const allPharmacies = Array.from(this.pharmacies.values());
    
    return allPharmacies.map(pharmacy => {
      // Compter les commandes de cette pharmacie
      const pharmacyOrders = Array.from(this.orders.values()).filter(order => order.pharmacyId === pharmacy.id);
      const totalRevenue = pharmacyOrders.reduce((sum, order) => {
        return sum + (parseFloat(order.totalAmount || '0') || 0);
      }, 0);

      return {
        ...pharmacy,
        totalOrders: pharmacyOrders.length,
        totalRevenue: totalRevenue,
        completedOrders: pharmacyOrders.filter(o => o.status === 'delivered').length
      };
    });
  }

  async getAllDeliveryPersonnelForAdmin(): Promise<any[]> {
    const deliveryPersonnel = Array.from(this.users.values()).filter(user => user.role === 'livreur');
    
    return deliveryPersonnel.map(person => {
      // Compter les livraisons de cette personne
      const personDeliveries = Array.from(this.orders.values()).filter(order => order.deliveryPersonId === person.id);
      const pharmacy = person.pharmacyId ? this.pharmacies.get(person.pharmacyId) : null;

      return {
        ...person,
        totalDeliveries: personDeliveries.filter(o => o.status === 'delivered').length,
        activeDeliveries: personDeliveries.filter(o => ['ready_for_delivery', 'in_delivery'].includes(o.status)).length,
        pharmacyName: pharmacy?.name || null,
        rating: 5.0, // Default rating
        isActive: person.isActive !== false // Default to true if not set
      };
    });
  }

  // Pharmacy operations
  async getPharmacies(lat?: number, lng?: number, radius?: number): Promise<Pharmacy[]> {
    // Nettoyer les doublons à chaque récupération
    await this.cleanupDuplicatePharmacies();

    const pharmacies = Array.from(this.pharmacies.values());

    if (lat !== undefined && lng !== undefined) {
      return pharmacies.sort((a, b) => {
        const distA = this.calculateDistance(lat, lng, a.latitude || 0, a.longitude || 0);
        const distB = this.calculateDistance(lat, lng, b.latitude || 0, b.longitude || 0);
        return distA - distB;
      });
    }

    return pharmacies;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async getPharmacy(id: string): Promise<Pharmacy | undefined> {
    return this.pharmacies.get(id);
  }

  async getPharmacyById(pharmacyId: string): Promise<Pharmacy | undefined> {
    return this.pharmacies.get(pharmacyId);
  }

  async createPharmacy(pharmacy: InsertPharmacy): Promise<Pharmacy> {
    const id = randomUUID();
    const newPharmacy: Pharmacy = {
      id,
      ...pharmacy,
      createdAt: new Date(),
    };

    this.pharmacies.set(id, newPharmacy);
    console.log('✅ Pharmacie créée:', { id, name: newPharmacy.name, phone: newPharmacy.phone });
    return newPharmacy;
  }

  async updatePharmacy(id: string, updates: Partial<InsertPharmacy>): Promise<Pharmacy | undefined> {
    const existing = this.pharmacies.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: Pharmacy = {
      ...existing,
      ...updates,
      id, // Preserve the original ID
      createdAt: existing.createdAt, // Preserve creation date
    };

    this.pharmacies.set(id, updated);
    console.log('🔄 Pharmacie mise à jour:', { id, name: updated.name, phone: updated.phone });
    return updated;
  }

  // Nettoyer les doublons de pharmacies basées sur le téléphone
  async cleanupDuplicatePharmacies(): Promise<void> {
    const pharmaciesByPhone = new Map<string, Pharmacy[]>();

    // Grouper par numéro de téléphone
    for (const pharmacy of this.pharmacies.values()) {
      if (pharmacy.phone) {
        if (!pharmaciesByPhone.has(pharmacy.phone)) {
          pharmaciesByPhone.set(pharmacy.phone, []);
        }
        pharmaciesByPhone.get(pharmacy.phone)!.push(pharmacy);
      }
    }

    // Supprimer les doublons
    for (const [phone, duplicates] of pharmaciesByPhone.entries()) {
      if (duplicates.length > 1) {
        // Garder la plus récente (dernière créée)
        const sorted = duplicates.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const keepPharmacy = sorted[0];
        const toDelete = sorted.slice(1);

        console.log(`🧹 Nettoyage doublons pour ${phone}: garder ${keepPharmacy.id}, supprimer`, 
          toDelete.map(p => p.id));

        // Supprimer les doublons
        for (const pharmacy of toDelete) {
          this.pharmacies.delete(pharmacy.id);
        }
      }
    }
  }

  async getPharmacyByUserId(userId: string): Promise<Pharmacy | undefined> {
    const user = this.users.get(userId);
    console.log('getPharmacyByUserId - User details:', { userId, role: user?.role, pharmacyId: user?.pharmacyId, phone: user?.phone });

    if (!user || user.role !== 'pharmacien') return undefined;

    // First check if user has a pharmacyId assigned
    if (user.pharmacyId) {
      const pharmacy = this.pharmacies.get(user.pharmacyId);
      console.log('getPharmacyByUserId - Pharmacy by pharmacyId:', pharmacy ? pharmacy.id : 'not found');
      if (pharmacy) return pharmacy;
    }

    // Fallback: try to find pharmacy by phone number
    const allPharmacies = Array.from(this.pharmacies.values());
    console.log('getPharmacyByUserId - All pharmacies:', allPharmacies.map(p => ({ id: p.id, phone: p.phone, name: p.name })));

    let pharmacy = allPharmacies.find(p => p.phone === user.phone);
    console.log('getPharmacyByUserId - Pharmacy by phone match:', pharmacy ? pharmacy.id : 'not found');

    // If still not found, try to find by name pattern
    if (!pharmacy) {
      const expectedName = `Pharmacie ${user.firstName} ${user.lastName}`;
      console.log('getPharmacyByUserId - Searching for pharmacy with name:', expectedName);
      pharmacy = allPharmacies.find(p => p.name === expectedName);
      console.log('getPharmacyByUserId - Pharmacy by name match:', pharmacy ? pharmacy.id : 'not found');
    }

    // Additional fallback: try partial name matches
    if (!pharmacy) {
      const userFullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      pharmacy = allPharmacies.find(p => 
        p.name.toLowerCase().includes(user.firstName.toLowerCase()) || 
        p.name.toLowerCase().includes(user.lastName.toLowerCase()) ||
        userFullName.includes(p.name.toLowerCase())
      );
      console.log('getPharmacyByUserId - Pharmacy by partial name match:', pharmacy ? pharmacy.id : 'not found');
    }

    // If still not found, auto-create a pharmacy for this pharmacist user
    if (!pharmacy) {
      const pharmacyName = `Pharmacie ${user.firstName} ${user.lastName}`;
      console.log('getPharmacyByUserId - Auto-creating pharmacy:', pharmacyName);

      const newPharmacyData: InsertPharmacy = {
        name: pharmacyName,
        address: user.address || "Abidjan, Côte d'Ivoire",
        latitude: 5.3364, // Default Abidjan coordinates
        longitude: -4.0267,
        phone: user.phone,
        rating: 4.5,
        deliveryTime: "30",
        isOpen: true,
        openingHours: {
          monday: { open: "08:00", close: "20:00" },
          tuesday: { open: "08:00", close: "20:00" },
          wednesday: { open: "08:00", close: "20:00" },
          thursday: { open: "08:00", close: "20:00" },
          friday: { open: "08:00", close: "20:00" },
          saturday: { open: "08:00", close: "18:00" },
          sunday: { open: "09:00", close: "17:00" }
        }
      };

      pharmacy = await this.createPharmacy(newPharmacyData);
      console.log('getPharmacyByUserId - Auto-created pharmacy with ID:', pharmacy.id);
    }

    // If found but user doesn't have pharmacyId set, update it
    if (pharmacy && !user.pharmacyId) {
      await this.updateUser(userId, { pharmacyId: pharmacy.id });
      console.log('getPharmacyByUserId - Updated user with pharmacyId:', pharmacy.id);
    }

    return pharmacy;
  }

  async updatePharmacy(id: string, updates: Partial<InsertPharmacy>): Promise<Pharmacy | undefined> {
    const pharmacy = this.pharmacies.get(id);
    if (!pharmacy) return undefined;

    const updatedPharmacy: Pharmacy = {
      ...pharmacy,
      ...updates,
    };

    this.pharmacies.set(id, updatedPharmacy);
    return updatedPharmacy;
  }

  // Prescription operations
  async getPrescription(id: string): Promise<Prescription | undefined> {
    return this.prescriptions.get(id);
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const id = randomUUID();
    const newPrescription: Prescription = {
      id,
      ...prescription,
      createdAt: new Date(),
    };

    this.prescriptions.set(id, newPrescription);
    return newPrescription;
  }

  async getUserPrescriptions(userId: string): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updatePrescriptionStatus(id: string, status: string): Promise<Prescription | undefined> {
    const prescription = this.prescriptions.get(id);
    if (!prescription) return undefined;

    prescription.status = status as any;
    this.prescriptions.set(id, prescription);
    return prescription;
  }

  // Order operations
  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const newOrder: Order = {
      id,
      ...order,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.orders.set(id, newOrder);
    return newOrder;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    const userOrders = Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Enrichir avec les informations de la pharmacie
    const enrichedOrders = userOrders.map(order => {
      const pharmacy = this.pharmacies.get(order.pharmacyId);
      return {
        ...order,
        pharmacy: pharmacy ? {
          id: pharmacy.id,
          name: pharmacy.name,
          address: pharmacy.address,
          phone: pharmacy.phone,
          rating: pharmacy.rating
        } : null,
        // S'assurer que le montant est affiché même si c'est 0
        totalAmount: order.totalAmount || '0'
      };
    });

    return enrichedOrders;
  }

  async getCurrentOrder(userId: string): Promise<Order | undefined> {
    return Array.from(this.orders.values())
      .filter(o => o.userId === userId && !['delivered', 'cancelled'].includes(o.status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    order.status = status as any;
    order.updatedAt = new Date();

    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    this.orders.set(id, order);
    return order;
  }

  async updateOrderMedications(id: string, medications: any[]): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    order.medications = medications;
    order.updatedAt = new Date();
    this.orders.set(id, order);
    return order;
  }

  // Delivery person operations
  async getDeliveryPerson(id: string): Promise<DeliveryPerson | undefined> {
    return this.deliveryPersons.get(id);
  }

  // Modified method to filter approved delivery personnel who have been approved by a pharmacy
  async getAvailableDeliveryPersonnel(): Promise<any[]> {
    const deliveryUsers = Array.from(this.users.values()).filter(user => 
      user.role === 'livreur' && 
      user.verificationStatus === 'approved' &&
      user.deliveryApplicationStatus === 'approved'
    );

    return deliveryUsers.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      phone: user.phone,
      isAvailable: true,
      rating: 5.0,
      pharmacyId: user.pharmacyId
    }));
  }

  // New method to get the owner of a pharmacy (pharmacist user)
  async getPharmacyOwner(pharmacyId: string): Promise<any | null> {
    const users = Array.from(this.users.values());
    return users.find(user => user.role === 'pharmacien' && user.pharmacyId === pharmacyId) || null;
  }

  // New method to get pending delivery applications for a specific pharmacy
  async getDeliveryApplicationsForPharmacy(pharmacyId: string): Promise<any[]> {
    const applications = Array.from(this.users.values()).filter(user => 
      user.role === 'livreur' && 
      user.appliedPharmacyId === pharmacyId &&
      user.deliveryApplicationStatus === 'pending'
    );

    return applications.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt,
      verificationStatus: user.verificationStatus
    }));
  }

  // New method to get pharmacist orders
  async getPharmacistOrders(pharmacyId: string): Promise<any[]> {
    const orders = Array.from(this.orders.values()).filter(order => 
      order.pharmacyId === pharmacyId
    );

    // Enrich with user and pharmacy data
    return orders.map(order => ({
      ...order,
      user: this.users.get(order.userId),
      pharmacy: this.pharmacies.get(order.pharmacyId)
    }));
  }

  // New method to get all pharmacist orders (fallback)
  async getAllPharmacistOrders(): Promise<any[]> {
    const orders = Array.from(this.orders.values());

    // Enrich with user and pharmacy data
    return orders.map(order => ({
      ...order,
      user: this.users.get(order.userId),
      pharmacy: this.pharmacies.get(order.pharmacyId)
    }));
  }

  // New method to get all prescriptions
  async getAllPrescriptions(): Promise<any[]> {
    const prescriptions = Array.from(this.prescriptions.values());

    // Enrich with user data
    return prescriptions.map(prescription => ({
      ...prescription,
      user: this.users.get(prescription.userId)
    }));
  }

  // New method to respond to a delivery application (approve or reject)
  async respondToDeliveryApplication(applicationId: string, action: string, pharmacyId: string | undefined): Promise<any | null> {
    const user = this.users.get(applicationId);
    if (!user || user.role !== 'livreur' || user.deliveryApplicationStatus !== 'pending') {
      return null;
    }

    if (action === 'approve') {
      user.deliveryApplicationStatus = 'approved';
      user.pharmacyId = pharmacyId; // Assign the livreur to the pharmacy
      user.appliedPharmacyId = undefined; // Clear the applied pharmacy ID

      // Create a notification for the livreur
      await this.createNotification({
        userId: user.id,
        title: 'Candidature acceptée !',
        body: 'Félicitations ! Votre candidature a été acceptée. Vous pouvez maintenant accéder à votre tableau de bord.',
        type: 'delivery_application_response',
        isRead: false,
      });
    } else { // action === 'reject'
      user.deliveryApplicationStatus = 'rejected';
      user.appliedPharmacyId = undefined; // Clear the applied pharmacy ID

      // Create a notification for the livreur
      await this.createNotification({
        userId: user.id,
        title: 'Candidature non retenue',
        body: 'Votre candidature n\'a pas été retenue cette fois. Vous pouvez postuler à une autre pharmacie.',
        type: 'delivery_application_response',
        isRead: false,
      });
    }

    this.users.set(applicationId, user);
    return user;
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const newNotification: Notification = {
      id,
      ...notification,
      createdAt: new Date(),
    };

    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;

    notification.isRead = true;
    this.notifications.set(id, notification);
    return notification;
  }

  // Méthodes supplémentaires pour les pharmaciens
  async getAllPharmacistOrders(): Promise<Order[]> {
    const allOrders = Array.from(this.orders.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Enrichir avec les informations de la pharmacie et de l'utilisateur
    const enrichedOrders = allOrders.map(order => {
      const pharmacy = this.pharmacies.get(order.pharmacyId);
      const user = this.users.get(order.userId);
      return {
        ...order,
        pharmacy: pharmacy ? {
          id: pharmacy.id,
          name: pharmacy.name,
          address: pharmacy.address,
          phone: pharmacy.phone,
          rating: pharmacy.rating
        } : null,
        patient: user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone
        } : null,
        totalAmount: order.totalAmount || '0'
      };
    });

    return enrichedOrders;
  }

  async getPharmacistOrders(pharmacyId: string): Promise<Order[]> {
    const pharmacyOrders = Array.from(this.orders.values())
      .filter(order => order.pharmacyId === pharmacyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Enrichir avec les informations de l'utilisateur
    const enrichedOrders = pharmacyOrders.map(order => {
      const user = this.users.get(order.userId);
      const pharmacy = this.pharmacies.get(order.pharmacyId);
      return {
        ...order,
        pharmacy: pharmacy ? {
          id: pharmacy.id,
          name: pharmacy.name,
          address: pharmacy.address,
          phone: pharmacy.phone,
          rating: pharmacy.rating
        } : null,
        patient: user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone
        } : null,
        totalAmount: order.totalAmount || '0'
      };
    });

    return enrichedOrders;
  }

  async getAllPrescriptions(): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getOrderById(orderId: string): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    // Enrichir avec les informations de la pharmacie
    const pharmacy = this.pharmacies.get(order.pharmacyId);
    return {
      ...order,
      pharmacy: pharmacy ? {
        id: pharmacy.id,
        name: pharmacy.name,
        address: pharmacy.address,
        phone: pharmacy.phone,
        rating: pharmacy.rating
      } : null,
      totalAmount: order.totalAmount || '0',
      patientId: order.userId // Ajouter un alias pour la compatibilité
    };
  }

  async updateOrderStatus(id: string, status: string, totalAmount?: number): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    order.status = status as any;
    order.updatedAt = new Date();

    if (totalAmount !== undefined) {
      order.totalAmount = totalAmount.toString();
    }

    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    this.orders.set(id, order);

    // Retourner l'ordre enrichi
    const pharmacy = this.pharmacies.get(order.pharmacyId);
    return {
      ...order,
      pharmacy: pharmacy ? {
        id: pharmacy.id,
        name: pharmacy.name,
        address: pharmacy.address,
        phone: pharmacy.phone,
        rating: pharmacy.rating
      } : null,
      totalAmount: order.totalAmount || '0'
    };
  }

  async getDeliveryOrders(): Promise<Order[]> {
    const deliveryOrders = Array.from(this.orders.values())
      .filter(order => ['ready_for_delivery', 'in_delivery', 'delivered'].includes(order.status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Enrichir avec les informations de la pharmacie et de l'utilisateur
    const enrichedOrders = deliveryOrders.map(order => {
      const pharmacy = this.pharmacies.get(order.pharmacyId);
      const user = this.users.get(order.userId);
      return {
        ...order,
        pharmacy: pharmacy ? {
          id: pharmacy.id,
          name: pharmacy.name,
          address: pharmacy.address,
          phone: pharmacy.phone,
          rating: pharmacy.rating
        } : null,
        patient: user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone
        } : null,
        totalAmount: order.totalAmount || '0'
      };
    });

    return enrichedOrders;
  }

  async assignDeliveryPerson(orderId: string, deliveryPersonId: string): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    order.deliveryPersonId = deliveryPersonId;
    // Keep status as 'ready_for_delivery' when assigned, change to 'in_delivery' when delivery starts
    order.updatedAt = new Date();

    this.orders.set(orderId, order);

    // Créer des notifications pour le livreur et le patient
    const deliveryPerson = this.users.get(deliveryPersonId);
    const patient = this.users.get(order.userId);
    const pharmacy = this.pharmacies.get(order.pharmacyId);

    if (deliveryPerson) {
      // Notification pour le livreur
      await this.createNotification({
        userId: deliveryPersonId,
        title: 'Nouvelle livraison assignée',
        message: `Commande #${order.id.slice(0, 8)} - ${order.deliveryAddress}`,
        type: 'delivery_assigned',
        isRead: false
      });
    }

    if (patient) {
      // Notification pour le patient
      await this.createNotification({
        userId: order.userId,
        title: 'Livreur assigné à votre commande',
        message: `${deliveryPerson?.firstName} ${deliveryPerson?.lastName} va livrer votre commande. Contact: ${deliveryPerson?.phone}`,
        type: 'delivery_assigned',
        isRead: false
      });
    }

    // Retourner l'ordre enrichi
    return {
      ...order,
      pharmacy: pharmacy ? {
        id: pharmacy.id,
        name: pharmacy.name,
        address: pharmacy.address,
        phone: pharmacy.phone,
        rating: pharmacy.rating
      } : null,
      patient: patient ? {
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone
      } : null,
      deliveryPerson: deliveryPerson ? {
        firstName: deliveryPerson.firstName,
        lastName: deliveryPerson.lastName,
        phone: deliveryPerson.phone
      } : null,
      totalAmount: order.totalAmount || '0'
    };
  }
}