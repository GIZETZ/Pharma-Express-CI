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
} from "@shared/schema";
import { eq, and, or, desc, asc } from "drizzle-orm";
import { users, pharmacies, prescriptions, orders, deliveryPersons, notifications } from "@shared/schema";
import { db } from "./db";
import bcrypt from "bcryptjs";
import { type IStorage } from "./storage";

export class PostgresStorage implements IStorage {
  constructor() {
    this.seedInitialData();
  }

  private async seedInitialData() {
    try {
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
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await db.insert(users).values({
      ...user,
      password: hashedPassword,
      deliveryApplicationStatus: user.role === 'livreur' ? 'none' : 'none',
    }).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
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
          eq(orders.status, 'in_delivery')
        )
      )
    ).orderBy(desc(orders.createdAt)).limit(1);
    return result[0];
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const updates: any = { status, updatedAt: new Date() };
    if (status === 'delivered') {
      updates.deliveredAt = new Date();
    }
    const result = await db.update(orders).set(updates).where(eq(orders.id, id)).returning();
    return result[0];
  }

  async updateOrderMedications(id: string, medications: any[]): Promise<Order | undefined> {
    const result = await db.update(orders).set({
      medications,
      updatedAt: new Date(),
    }).where(eq(orders.id, id)).returning();
    return result[0];
  }

  // Delivery person operations
  async getDeliveryPerson(id: string): Promise<DeliveryPerson | undefined> {
    const result = await db.select().from(deliveryPersons).where(eq(deliveryPersons.id, id)).limit(1);
    return result[0];
  }

  async getAvailableDeliveryPersonnel(): Promise<User[]> {
    return await db.select().from(users).where(
      and(
        eq(users.role, 'livreur'),
        eq(users.verificationStatus, 'approved'),
        eq(users.isActive, true)
      )
    );
  }

  async getDeliveryOrders(): Promise<Order[]> {
    return await db.select().from(orders).where(
      or(
        eq(orders.status, 'ready_for_delivery'),
        eq(orders.status, 'in_delivery')
      )
    ).orderBy(desc(orders.createdAt));
  }

  async assignDeliveryPerson(orderId: string, deliveryPersonId: string): Promise<Order | undefined> {
    const result = await db.update(orders).set({
      deliveryPersonId,
      status: 'in_delivery',
      updatedAt: new Date(),
    }).where(eq(orders.id, orderId)).returning();
    return result[0];
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

  async updateOrderStatus(id: string, status: string, totalAmount?: number): Promise<Order | undefined> {
    const updates: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (totalAmount !== undefined) {
      updates.totalAmount = totalAmount.toString();
    }
    
    if (status === 'delivered') {
      updates.deliveredAt = new Date();
    }
    
    const result = await db.update(orders).set(updates).where(eq(orders.id, id)).returning();
    return result[0];
  }
}