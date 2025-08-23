import {
  type User,
  type InsertUser,
  type Pharmacy,
  type InsertPharmacy,
  type Prescription,
  type InsertPrescription,
  type Order,
  type InsertOrder,
  type Notification,
  type InsertNotification,
  type DeliveryVehicle,
  type InsertDeliveryVehicle,
  type DeliveryProfile,
  type InsertDeliveryProfile,
} from "@shared/schema";
import { eq, and, or, desc, asc, lt, sql, ne } from "drizzle-orm";
import { users, pharmacies, prescriptions, orders, notifications, deliveryVehicles, deliveryProfiles } from "@shared/schema";
// Import db only when needed to avoid DATABASE_URL requirement in development
let db: any = null;

const getDb = async () => {
  if (!db) {
    const { db: dbInstance } = await import("./db");
    db = dbInstance;
  }
  return db;
};
import bcrypt from "bcryptjs";
import { type IStorage } from "./storage";

export class PostgresStorage implements IStorage {
  constructor() {
    this.seedInitialData();
  }

  private async seedInitialData() {
    try {
      const db = await getDb();
      // Check if admin user already exists
      const existingAdmin = await db.select().from(users).where(eq(users.phone, "+225 01 23 45 67")).limit(1);

      if (existingAdmin.length === 0) {
        console.log('🌱 Seeding initial data...');

        // Create admin user
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await db.insert(users).values({
          firstName: "Admin",
          lastName: "YahoPharma",
          phone: "+225 01 23 45 67",
          address: "Siège YahoPharma, Abidjan",
          password: hashedPassword,
          role: "admin",
          language: "fr",
          isActive: true,
          verificationStatus: "approved"
        });

        // Create test pharmacist users
        const testUsers = [
          {
            firstName: "Dr. Marie",
            lastName: "Kouassi",
            phone: "+225 07 11 22 33",
            address: "Pharmacie de la Paix, Abidjan",
            password: await bcrypt.hash("pharma123", 10),
            role: "pharmacien",
            language: "fr",
            isActive: true,
            verificationStatus: "approved"
          },
          {
            firstName: "Dr. Adjoua",
            lastName: "Bamba",
            phone: "+225 05 44 33 22",
            address: "Pharmacie Centrale Plus, Marcory",
            password: await bcrypt.hash("pharma2024", 10),
            role: "pharmacien",
            language: "fr",
            isActive: true,
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
            isActive: true,
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
            isActive: true,
            verificationStatus: "approved"
          }
        ];

        for (const userData of testUsers) {
          await db.insert(users).values(userData);
        }

        // Create test pharmacies
        const testPharmacies = [
          {
            name: "Pharmacie Dr. Marie Kouassi",
            address: "Quartier Riviera Golf, Cocody",
            latitude: "5.3364",
            longitude: "-4.0267",
            phone: "+225 07 11 22 33",
            rating: "4.8",
            deliveryTime: "25",
            isOpen: true
          },
          {
            name: "Pharmacie de la Paix",
            address: "Boulevard de la Paix, Cocody",
            latitude: "5.3364",
            longitude: "-4.0267",
            phone: "+225 27 22 44 55 66",
            rating: "4.5",
            deliveryTime: "30",
            isOpen: true
          },
          {
            name: "Pharmacie du Plateau",
            address: "Avenue Chardy, Plateau",
            latitude: "5.3198",
            longitude: "-4.0267",
            phone: "+225 27 20 21 22 23",
            rating: "4.2",
            deliveryTime: "25",
            isOpen: true
          },
          {
            name: "Pharmacie Centrale Plus",
            address: "Boulevard VGE, Marcory",
            latitude: "5.2845",
            longitude: "-3.9731",
            phone: "+225 05 44 33 22",
            rating: "4.7",
            deliveryTime: "20",
            isOpen: true
          },
          {
            name: "Ithiel Pharma",
            address: "Avenue des Martyrs, Yopougon",
            latitude: "5.3456",
            longitude: "-4.0892",
            phone: "+225 27 23 45 67 89",
            rating: "4.6",
            deliveryTime: "25",
            isOpen: true
          }
        ];

        for (const pharmacyData of testPharmacies) {
          await db.insert(pharmacies).values(pharmacyData);
        }

        console.log('✅ Base de données initialisée avec succès');
        console.log('📋 Accès administrateur:');
        console.log('   Téléphone: +225 01 23 45 67');
        console.log('   Mot de passe: admin123');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const db = await getDb();
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    const db = await getDb();
    return await db.select().from(users);
  }

  // Alias pour compatibilité avec l'interface IStorage
  async getUsers(): Promise<User[]> {
    return this.getAllUsers();
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const db = await getDb();
    const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const db = await getDb();
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await db.insert(users).values({
      ...user,
      password: hashedPassword,
      deliveryApplicationStatus: user.role === 'livreur' ? 'none' : 'none',
    }).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const db = await getDb();
    const result = await db.update(users).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async loginUser(phone: string, password: string): Promise<User | null> {
    const user = await this.getUserByPhone(phone);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    return user;
  }

  // Admin operations
  async getPendingUsers(): Promise<User[]> {
    const db = await getDb();
    return await db.select().from(users).where(
      and(
        eq(users.verificationStatus, 'pending'),
        or(eq(users.role, 'pharmacien'), eq(users.role, 'livreur'))
      )
    );
  }

  async updateUserVerificationStatus(userId: string, status: "approved" | "rejected" | "pending"): Promise<User | null> {
    const updates: any = {
      verificationStatus: status,
      updatedAt: new Date(),
    };

    // If approving a livreur, also update delivery application status
    if (status === 'approved') {
      const user = await this.getUser(userId);
      if (user?.role === 'livreur' && user.deliveryApplicationStatus === 'pending') {
        updates.deliveryApplicationStatus = 'approved';
      }
    } else if (status === 'rejected') {
      const user = await this.getUser(userId);
      if (user?.role === 'livreur') {
        updates.deliveryApplicationStatus = 'rejected';
        updates.appliedPharmacyId = null;
      }
    }

    const result = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
    return result[0] || null;
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
    const [usersResult, ordersResult] = await Promise.all([
      db.select({ role: users.role }).from(users),
      db.select({ status: orders.status }).from(orders),
    ]);

    const usersByRole = usersResult.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ordersByStatus = ordersResult.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      patients: usersByRole.patient || 0,
      pharmaciens: usersByRole.pharmacien || 0,
      livreurs: usersByRole.livreur || 0,
      orders: ordersResult.length,
      pendingOrders: ordersByStatus.pending || 0,
      activeDeliveries: (ordersByStatus.confirmed || 0) + (ordersByStatus.preparing || 0) + (ordersByStatus.in_transit || 0),
      completedDeliveries: ordersByStatus.delivered || 0,
    };
  }

  // Pharmacy operations
  async getPharmacies(lat?: number, lng?: number, radius?: number): Promise<Pharmacy[]> {
    const result = await db.select().from(pharmacies);

    if (lat !== undefined && lng !== undefined) {
      return result.sort((a, b) => {
        const distA = this.calculateDistance(lat, lng, parseFloat(a.latitude || '0'), parseFloat(a.longitude || '0'));
        const distB = this.calculateDistance(lat, lng, parseFloat(b.latitude || '0'), parseFloat(b.longitude || '0'));
        return distA - distB;
      });
    }

    return result;
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
    const result = await db.select().from(pharmacies).where(eq(pharmacies.id, id)).limit(1);
    return result[0];
  }

  async createPharmacy(pharmacy: InsertPharmacy): Promise<Pharmacy> {
    const result = await db.insert(pharmacies).values(pharmacy).returning();
    console.log('✅ Pharmacie créée:', { id: result[0].id, name: result[0].name, phone: result[0].phone });
    return result[0];
  }

  async updatePharmacy(id: string, updates: Partial<InsertPharmacy>): Promise<Pharmacy | undefined> {
    const result = await db.update(pharmacies).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(pharmacies.id, id)).returning();
    return result[0];
  }

  async getPharmacyByUserId(userId: string): Promise<Pharmacy | undefined> {
    const user = await this.getUser(userId);
    if (!user || user.role !== 'pharmacien') return undefined;

    // First check if user has a pharmacyId assigned
    if (user.pharmacyId) {
      const pharmacy = await this.getPharmacy(user.pharmacyId);
      if (pharmacy) return pharmacy;
    }

    // Fallback: try to find pharmacy by phone number
    const result = await db.select().from(pharmacies).where(eq(pharmacies.phone, user.phone)).limit(1);
    return result[0];
  }

  async getPharmacyById(pharmacyId: string): Promise<Pharmacy | undefined> {
    return this.getPharmacy(pharmacyId);
  }

  // Prescription operations
  async getPrescription(id: string): Promise<Prescription | undefined> {
    const result = await db.select().from(prescriptions).where(eq(prescriptions.id, id)).limit(1);
    return result[0];
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const result = await db.insert(prescriptions).values(prescription).returning();
    return result[0];
  }

  async getUserPrescriptions(userId: string): Promise<Prescription[]> {
    return await db.select().from(prescriptions).where(eq(prescriptions.userId, userId)).orderBy(desc(prescriptions.createdAt));
  }

  async updatePrescriptionStatus(id: string, status: string): Promise<Prescription | undefined> {
    const result = await db.update(prescriptions).set({ status }).where(eq(prescriptions.id, id)).returning();
    return result[0];
  }

  // Order operations
  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async getCurrentOrder(userId: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(
      and(
        eq(orders.userId, userId),
        or(
          eq(orders.status, 'pending'),
          eq(orders.status, 'confirmed'),
          eq(orders.status, 'preparing'),
          eq(orders.status, 'ready_for_delivery'),
          eq(orders.status, 'in_transit')
        )
      )
    ).orderBy(desc(orders.createdAt)).limit(1);
    return result[0];
  }

  async updateOrderStatus(orderId: string, status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_delivery' | 'in_transit' | 'arrived_pending_confirmation' | 'delivered' | 'cancelled'): Promise<Order | undefined> {
    const updates: any = { status, updatedAt: new Date() };
    if (status === 'delivered') {
      updates.deliveredAt = new Date();
    }
    const result = await db.update(orders).set(updates).where(eq(orders.id, orderId)).returning();
    return result[0];
  }

  async updateOrderMedications(id: string, medications: any[]): Promise<Order | undefined> {
    const result = await db.update(orders).set({
      medications,
      updatedAt: new Date(),
    }).where(eq(orders.id, id)).returning();
    return result[0];
  }



  async confirmDeliveryCompletion(orderId: string): Promise<Order | undefined> {
    const db = await getDb();

    // Vérifier d'abord que la commande est en attente de confirmation
    const existingOrder = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!existingOrder[0] || existingOrder[0].status !== 'arrived_pending_confirmation') {
      return undefined;
    }

    // Marquer la livraison comme terminée avec confirmation directe du patient
    const result = await db.update(orders).set({
      status: 'delivered',
      patientConfirmedAt: new Date(),
      deliveredAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(orders.id, orderId)).returning();

    if (result[0]) {
      // Notifier le livreur que la livraison est confirmée
      if (result[0].deliveryPersonId) {
        await db.insert(notifications).values({
          userId: result[0].deliveryPersonId,
          title: 'Livraison confirmée',
          body: 'Le patient a confirmé la réception. Livraison terminée avec succès !',
          type: 'delivery_completed',
          orderId: orderId
        });
      }
    }

    return result[0];
  }

  // Delivery person operations (using User table instead)

  // Helper method to get daily order count for a delivery person
  async getDailyOrderCount(deliveryPersonId: string): Promise<number> {
    const db = await getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
    
    const result = await db
      .select({ count: sql`count(*)` })
      .from(orders)
      .where(
        and(
          eq(orders.deliveryPersonId, deliveryPersonId),
          sql`${orders.assignedAt} >= ${today.toISOString()}::timestamp`,
          sql`${orders.assignedAt} < ${tomorrow.toISOString()}::timestamp`
        )
      );
    
    return parseInt(result[0]?.count as string) || 0;
  }

  // Get delivery personnel for a specific pharmacy with daily order counts
  async getAvailableDeliveryPersonnelForPharmacy(pharmacyId: string): Promise<User[]> {
    const db = await getDb();
    const personnel = await db.select().from(users).where(
      and(
        eq(users.role, 'livreur'),
        eq(users.verificationStatus, 'approved'),
        eq(users.isActive, true),
        eq(users.pharmacyId, pharmacyId)
      )
    );

    // Add daily order count for each delivery person
    const personnelWithDailyCount = await Promise.all(
      personnel.map(async (person) => {
        const dailyOrderCount = await this.getDailyOrderCount(person.id);
        return {
          ...person,
          dailyOrderCount
        };
      })
    );

    return personnelWithDailyCount;
  }

  async getAvailableDeliveryPersonnel(): Promise<User[]> {
    const db = await getDb();
    return await db.select().from(users).where(
      and(
        eq(users.role, 'livreur'),
        eq(users.verificationStatus, 'approved'),
        eq(users.isActive, true)
      )
    );
  }

  async getDeliveryOrders(): Promise<Order[]> {
    const db = await getDb();
    return await db.select().from(orders).where(
      or(
        eq(orders.status, 'preparing'), // Available for assignment
        eq(orders.status, 'in_transit')
      )
    ).orderBy(desc(orders.createdAt));
  }

  // Nouvelle méthode pour récupérer les commandes assignées à un livreur spécifique
  async getMyAssignedOrders(deliveryPersonId: string): Promise<Order[]> {
    const db = await getDb();

    // D'abord, vérifier les commandes expirées (plus de 3 minutes) et les réassigner
    await this.checkAndRejectExpiredAssignments();

    return await db.select().from(orders).where(
      and(
        eq(orders.deliveryPersonId, deliveryPersonId),
        or(
          eq(orders.status, 'assigned_pending_acceptance'),
          eq(orders.status, 'in_transit'),
          eq(orders.status, 'delivered')
        )
      )
    ).orderBy(desc(orders.createdAt));
  }

  // Méthode pour vérifier et rejeter les assignations expirées
  async checkAndRejectExpiredAssignments(): Promise<void> {
    const db = await getDb();
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

    const expiredOrders = await db.select().from(orders).where(
      and(
        eq(orders.status, 'assigned_pending_acceptance'),
        sql`${orders.assignedAt} < ${threeMinutesAgo}`
      )
    );

    for (const order of expiredOrders) {
      await db.update(orders).set({
        status: 'preparing',
        deliveryPersonId: null,
        assignedAt: null,
        updatedAt: new Date()
      }).where(eq(orders.id, order.id));

      // Notifier le livreur que l'assignation a expiré
      if (order.deliveryPersonId) {
        await db.insert(notifications).values({
          userId: order.deliveryPersonId,
          title: 'Assignation expirée',
          body: `La commande #${order.id.slice(0, 8)} a été réassignée car vous n'avez pas répondu dans les 3 minutes.`,
          type: 'assignment_expired',
          orderId: order.id
        });
      }
    }
  }

  // Méthode pour accepter une livraison assignée
  async acceptDeliveryAssignment(orderId: string, deliveryPersonId: string): Promise<Order | undefined> {
    const db = await getDb();

    // Vérifier que la commande est bien assignée à ce livreur et en attente d'acceptation
    const order = await db.select().from(orders).where(
      and(
        eq(orders.id, orderId),
        eq(orders.deliveryPersonId, deliveryPersonId),
        eq(orders.status, 'assigned_pending_acceptance')
      )
    ).limit(1);

    if (!order[0]) {
      return undefined;
    }

    // Vérifier si l'assignation n'a pas expiré (3 minutes)
    const assignedAt = new Date(order[0].assignedAt!);
    const now = new Date();
    const diffMinutes = (now.getTime() - assignedAt.getTime()) / (1000 * 60);

    if (diffMinutes > 3) {
      // Expirée, la réassigner automatiquement
      await this.rejectDeliveryAssignment(orderId, deliveryPersonId, true);
      return undefined;
    }

    // Accepter la livraison
    const result = await db.update(orders).set({
      status: 'in_transit',
      updatedAt: new Date()
    }).where(eq(orders.id, orderId)).returning();

    // Notifier le patient
    if (result[0]) {
      await db.insert(notifications).values({
        userId: result[0].userId,
        title: 'Livreur en route',
        body: `Votre livreur a accepté la livraison et est en route vers votre adresse.`,
        type: 'delivery_accepted',
        orderId: orderId
      });
    }

    return result[0];
  }

  // Méthode pour rejeter une livraison assignée
  async rejectDeliveryAssignment(orderId: string, deliveryPersonId: string, isExpired: boolean = false): Promise<boolean> {
    const db = await getDb();

    // Vérifier que la commande est bien assignée à ce livreur
    const order = await db.select().from(orders).where(
      and(
        eq(orders.id, orderId),
        eq(orders.deliveryPersonId, deliveryPersonId),
        eq(orders.status, 'assigned_pending_acceptance')
      )
    ).limit(1);

    if (!order[0]) {
      return false;
    }

    // Réassigner la commande (retourner en statut ready_for_delivery car elle était déjà prête)
    await db.update(orders).set({
      status: 'ready_for_delivery',
      deliveryPersonId: null,
      assignedAt: null,
      updatedAt: new Date()
    }).where(eq(orders.id, orderId));

    // Notifier selon le type de rejet
    if (!isExpired) {
      await db.insert(notifications).values({
        userId: deliveryPersonId,
        title: 'Livraison refusée',
        body: `Vous avez refusé la commande #${orderId.slice(0, 8)}. Elle sera réassignée à un autre livreur.`,
        type: 'delivery_rejected',
        orderId: orderId
      });
    }

    return true;
  }

  async assignDeliveryPerson(orderId: string, deliveryPersonId: string): Promise<Order | undefined> {
    const db = await getDb();
    const assignedAt = new Date();
    const result = await db.update(orders).set({
      deliveryPersonId,
      status: 'assigned_pending_acceptance',
      assignedAt,
      updatedAt: assignedAt,
    }).where(eq(orders.id, orderId)).returning();

    // Créer une notification pour le livreur
    if (result[0]) {
      await db.insert(notifications).values({
        userId: deliveryPersonId,
        title: 'Nouvelle livraison assignée',
        body: `Commande #${orderId.slice(0, 8)} vous a été assignée. Vous avez 3 minutes pour accepter.`,
        type: 'delivery_assignment',
        orderId: orderId
      });
    }

    return result[0];
  }

  // Récupérer toutes les commandes assignées à un livreur (y compris celles en attente d'acceptation)
  async getMyAssignedOrders(deliveryPersonId: string): Promise<Order[]> {
    const db = await getDb();

    // D'abord vérifier s'il y a des commandes expirées et les nettoyer
    await this.cleanupExpiredAssignments();

    // Récupérer toutes les commandes assignées à ce livreur
    const assignedOrders = await db.select().from(orders).where(
      and(
        eq(orders.deliveryPersonId, deliveryPersonId),
        or(
          eq(orders.status, 'assigned_pending_acceptance'),
          eq(orders.status, 'in_transit'),
          eq(orders.status, 'delivered')
        )
      )
    ).orderBy(desc(orders.createdAt));

    // Enrichir avec les données de pharmacie et patient
    const enrichedOrders = await Promise.all(
      assignedOrders.map(async (order) => {
        const [pharmacy, patient] = await Promise.all([
          order.pharmacyId ? this.getPharmacy(order.pharmacyId) : null,
          this.getUser(order.userId)
        ]);

        return {
          ...order,
          pharmacy,
          patient
        };
      })
    );

    return enrichedOrders;
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const result = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
    return result[0];
  }

  // Additional methods for pharmacy management
  async getAllPharmacistOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getPharmacistOrders(pharmacyId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.pharmacyId, pharmacyId)).orderBy(desc(orders.createdAt));
  }

  async getAllPrescriptions(): Promise<Prescription[]> {
    return await db.select().from(prescriptions).orderBy(desc(prescriptions.createdAt));
  }

  // Delivery application methods
  async getPharmacyOwner(pharmacyId: string): Promise<User | null> {
    // Try to find user by pharmacyId first
    const ownerByPharmacyId = await db.select().from(users).where(
      and(
        eq(users.role, 'pharmacien'),
        eq(users.pharmacyId, pharmacyId)
      )
    ).limit(1);

    if (ownerByPharmacyId.length > 0) {
      return ownerByPharmacyId[0];
    }

    // Fallback: find by pharmacy phone number
    const pharmacy = await this.getPharmacy(pharmacyId);
    if (pharmacy?.phone) {
      const ownerByPhone = await db.select().from(users).where(
        and(
          eq(users.role, 'pharmacien'),
          eq(users.phone, pharmacy.phone)
        )
      ).limit(1);

      if (ownerByPhone.length > 0) {
        // Update user with pharmacy ID for future reference
        await this.updateUser(ownerByPhone[0].id, { pharmacyId });
        return ownerByPhone[0];
      }
    }

    return null;
  }

  async getDeliveryApplicationsForPharmacy(pharmacyId: string): Promise<User[]> {
    return await db.select().from(users).where(
      and(
        eq(users.role, 'livreur'),
        eq(users.appliedPharmacyId, pharmacyId),
        eq(users.deliveryApplicationStatus, 'pending')
      )
    );
  }

  async respondToDeliveryApplication(applicationId: string, action: string, pharmacyId: string | undefined): Promise<User | null> {
    const user = await this.getUser(applicationId);
    if (!user || user.role !== 'livreur' || user.deliveryApplicationStatus !== 'pending') {
      return null;
    }

    const updates: any = {
      updatedAt: new Date(),
    };

    if (action === 'approve') {
      updates.deliveryApplicationStatus = 'approved';
      updates.pharmacyId = pharmacyId;
      updates.appliedPharmacyId = null;

      // Create notification for the livreur
      await this.createNotification({
        userId: user.id,
        title: 'Candidature acceptée !',
        body: 'Félicitations ! Votre candidature a été acceptée. Vous pouvez maintenant accéder à votre tableau de bord.',
        type: 'delivery_application_response',
        isRead: false,
      });
    } else { // action === 'reject'
      updates.deliveryApplicationStatus = 'rejected';
      updates.appliedPharmacyId = null;

      // Create notification for the livreur
      await this.createNotification({
        userId: user.id,
        title: 'Candidature non retenue',
        body: 'Votre candidature n\'a pas été retenue cette fois. Vous pouvez postuler à une autre pharmacie.',
        type: 'delivery_application_response',
        isRead: false,
      });
    }

    const result = await db.update(users).set(updates).where(eq(users.id, applicationId)).returning();
    return result[0] || null;
  }

  // Admin methods
  async getAllOrdersForAdmin(): Promise<any[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));

    return allOrders.map(order => ({
      ...order,
      pharmacy: null, // Would need joins to populate
      patient: null,  // Would need joins to populate
      deliveryPerson: null, // Would need joins to populate
      totalAmount: order.totalAmount || '0'
    }));
  }

  async getWeeklyStats(weekDate: Date): Promise<{ totalRevenue: number; ordersCount: number }> {
    const startOfWeek = new Date(weekDate);
    startOfWeek.setDate(weekDate.getDate() - weekDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekOrders = await db.select().from(orders).where(
      and(
        // Date filtering would need proper SQL date functions
        or(
          eq(orders.status, 'confirmed'),
          eq(orders.status, 'ready_for_delivery'),
          eq(orders.status, 'in_delivery'),
          eq(orders.status, 'delivered')
        )
      )
    );

    const totalRevenue = weekOrders.reduce((sum, order) => {
      return sum + (parseFloat(order.totalAmount || '0') || 0);
    }, 0);

    return {
      totalRevenue,
      ordersCount: weekOrders.length
    };
  }

  async getAllPharmaciesForAdmin(): Promise<any[]> {
    return await db.select().from(pharmacies);
  }

  async getAllDeliveryPersonnelForAdmin(): Promise<any[]> {
    const deliveryPersonnel = await db.select().from(users).where(eq(users.role, 'livreur'));

    return deliveryPersonnel.map(person => ({
      ...person,
      totalDeliveries: 0, // Would need proper counting
      activeDeliveries: 0, // Would need proper counting
      pharmacyName: null, // Would need joins
      rating: 5.0,
      isActive: person.isActive !== false
    }));
  }

  // Order management methods
  async getOrderById(orderId: string): Promise<Order | undefined> {
    return this.getOrder(orderId);
  }

  async updateOrderStatus(orderId: string, status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_delivery' | 'in_transit' | 'arrived_pending_confirmation' | 'delivered' | 'cancelled'): Promise<Order | undefined> {
    const updates: any = { 
      status, 
      updatedAt: new Date() 
    };

    if (status === 'delivered') {
      updates.deliveredAt = new Date();
    }

    const result = await db.update(orders).set(updates).where(eq(orders.id, orderId)).returning();
    return result[0];
  }

  async deleteOrder(id: string): Promise<boolean> {
    const db = await getDb();

    try {
      // First, delete all notifications associated with this order
      await db.delete(notifications).where(eq(notifications.orderId, id));
      console.log(`Deleted notifications for order ${id}`);

      // Then delete the order itself
      const result = await db.delete(orders).where(eq(orders.id, id)).returning();
      const deleted = result.length > 0;
      console.log(`Order ${id} ${deleted ? 'successfully deleted' : 'not found'} from PostgreSQL`);
      return deleted;
    } catch (error) {
      console.error(`Error deleting order ${id}:`, error);
      return false;
    }
  }

  async cleanupOldOrders(): Promise<number> {
    const db = await getDb();
    
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      // Supprimer les commandes non livrées de plus de 24h
      const oldUndeliveredOrders = await db.delete(orders).where(
        and(
          ne(orders.status, 'delivered'),
          sql`${orders.createdAt} < ${twentyFourHoursAgo.toISOString()}::timestamp`
        )
      ).returning({ id: orders.id });

      // Supprimer les commandes livrées de plus de 5 jours
      const oldDeliveredOrders = await db.delete(orders).where(
        and(
          eq(orders.status, 'delivered'),
          sql`${orders.createdAt} < ${fiveDaysAgo.toISOString()}::timestamp`
        )
      ).returning({ id: orders.id });

      const totalDeleted = oldUndeliveredOrders.length + oldDeliveredOrders.length;

      if (totalDeleted > 0) {
        console.log(`🗑️ Nettoyage automatique: ${totalDeleted} commandes supprimées (${oldUndeliveredOrders.length} non livrées + ${oldDeliveredOrders.length} livrées)`);
        
        // Supprimer aussi les notifications associées aux commandes supprimées
        const deletedOrderIds = [
          ...oldUndeliveredOrders.map(o => o.id),
          ...oldDeliveredOrders.map(o => o.id)
        ];
        
        if (deletedOrderIds.length > 0) {
          const deletedNotifications = await db.delete(notifications).where(
            sql`${notifications.orderId} = ANY(${deletedOrderIds})`
          ).returning({ id: notifications.id });
          
          console.log(`🗑️ ${deletedNotifications.length} notifications associées supprimées`);
        }
      }

      return totalDeleted;
    } catch (error) {
      console.error('Erreur lors du nettoyage automatique des commandes:', error);
      return 0;
    }
  }

  // Méthodes pour la gestion des assignations et acceptation/rejet
  async acceptDeliveryAssignment(orderId: string, deliveryPersonId: string): Promise<Order | undefined> {
    const db = await getDb();

    // Vérifier que l'assignation est valide et non expirée
    const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order[0] || order[0].deliveryPersonId !== deliveryPersonId || order[0].status !== 'assigned_pending_acceptance') {
      return undefined;
    }

    // Vérifier expiration (3 minutes)
    if (order[0].assignedAt) {
      const assignedTime = new Date(order[0].assignedAt).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - assignedTime) / (1000 * 60);

      if (diffMinutes > 3) {
        // Expirée, réjecter automatiquement
        await this.rejectDeliveryAssignment(orderId, deliveryPersonId, true);
        return undefined;
      }
    }

    // Accepter la livraison
    const result = await db.update(orders).set({
      status: 'in_transit',
      updatedAt: new Date(),
    }).where(eq(orders.id, orderId)).returning();

    if (result[0]) {
      // Notifier le patient
      await db.insert(notifications).values({
        userId: order[0].userId,
        title: 'Livreur en route',
        body: `Votre livreur a accepté la livraison et est en route vers votre adresse.`,
        type: 'delivery_accepted',
        orderId: orderId
      });
    }

    return result[0];
  }

  async rejectDeliveryAssignment(orderId: string, deliveryPersonId: string, isExpired: boolean = false): Promise<boolean> {
    const db = await getDb();

    // Vérifier que l'assignation est valide
    const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order[0] || order[0].deliveryPersonId !== deliveryPersonId || order[0].status !== 'assigned_pending_acceptance') {
      return false;
    }

    // Réassigner la commande (retourner en statut preparing)
    await db.update(orders).set({
      status: 'preparing',
      deliveryPersonId: null,
      assignedAt: null,
      updatedAt: new Date(),
    }).where(eq(orders.id, orderId));

    // Notifier selon le type de rejet
    if (!isExpired) {
      await db.insert(notifications).values({
        userId: deliveryPersonId,
        title: 'Livraison refusée',
        body: `Vous avez refusé la commande #${orderId.slice(0, 8)}. Elle sera réassignée à un autre livreur.`,
        type: 'delivery_rejected',
        orderId: orderId
      });
    }

    return true;
  }

  async cleanupExpiredAssignments(): Promise<void> {
    const db = await getDb();
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

    // Trouver les commandes expirées
    const expiredOrders = await db.select().from(orders).where(
      and(
        eq(orders.status, 'assigned_pending_acceptance'),
        lt(orders.assignedAt, threeMinutesAgo)
      )
    );

    // Nettoyer chaque commande expirée
    for (const order of expiredOrders) {
      await db.update(orders).set({
        status: 'ready_for_delivery',
        deliveryPersonId: null,
        assignedAt: null,
        updatedAt: new Date(),
      }).where(eq(orders.id, order.id));

      // Notifier le livreur que l'assignation a expiré
      if (order.deliveryPersonId) {
        await db.insert(notifications).values({
          userId: order.deliveryPersonId,
          title: 'Assignation expirée',
          body: `La commande #${order.id.slice(0, 8)} a été réassignée car vous n'avez pas répondu dans les 3 minutes.`,
          type: 'assignment_expired',
          orderId: order.id
        });
      }
    }
  }

  // Delivery Profile operations
  async getDeliveryProfile(userId: string): Promise<DeliveryProfile | undefined> {
    const db = await getDb();
    const result = await db.select().from(deliveryProfiles).where(eq(deliveryProfiles.userId, userId)).limit(1);
    return result[0];
  }

  async createDeliveryProfile(profile: InsertDeliveryProfile): Promise<DeliveryProfile> {
    const db = await getDb();
    const result = await db.insert(deliveryProfiles).values(profile).returning();
    return result[0];
  }

  async updateDeliveryProfile(userId: string, updates: Partial<InsertDeliveryProfile>): Promise<DeliveryProfile | undefined> {
    const db = await getDb();
    const result = await db.update(deliveryProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Delivery Vehicle operations
  async getDeliveryVehicle(deliveryPersonId: string): Promise<DeliveryVehicle | undefined> {
    const db = await getDb();
    const result = await db.select().from(deliveryVehicles).where(eq(deliveryVehicles.deliveryPersonId, deliveryPersonId)).limit(1);
    return result[0];
  }

  async createDeliveryVehicle(vehicle: InsertDeliveryVehicle): Promise<DeliveryVehicle> {
    const db = await getDb();
    const result = await db.insert(deliveryVehicles).values(vehicle).returning();
    return result[0];
  }

  async updateDeliveryVehicle(deliveryPersonId: string, updates: Partial<InsertDeliveryVehicle>): Promise<DeliveryVehicle | undefined> {
    const db = await getDb();
    const result = await db.update(deliveryVehicles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deliveryVehicles.deliveryPersonId, deliveryPersonId))
      .returning();
    return result[0];
  }

  async getDeliveryPersonWithVehicleAndProfile(deliveryPersonId: string): Promise<{
    user: User;
    profile?: DeliveryProfile;
    vehicle?: DeliveryVehicle;
  } | undefined> {
    const db = await getDb();

    // Get the user
    const user = await db.select().from(users).where(eq(users.id, deliveryPersonId)).limit(1);
    if (!user[0]) {
      return undefined;
    }

    // Get profile and vehicle
    const profile = await this.getDeliveryProfile(deliveryPersonId);
    const vehicle = await this.getDeliveryVehicle(deliveryPersonId);

    return {
      user: user[0],
      profile,
      vehicle,
    };
  }

  async confirmDeliveryArrival(orderId: string): Promise<Order | undefined> {
    const db = await getDb();
    const result = await db.update(orders)
      .set({
        deliveryPersonConfirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();
    return result[0];
  }
}