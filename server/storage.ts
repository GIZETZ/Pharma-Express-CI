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
      }
    ];

    for (const pharmacyData of testPharmacies) {
      await this.createPharmacy(pharmacyData);
    }
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

  // Pharmacy operations
  async getPharmacies(lat?: number, lng?: number, radius?: number): Promise<Pharmacy[]> {
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

  async createPharmacy(pharmacy: InsertPharmacy): Promise<Pharmacy> {
    const id = randomUUID();
    const newPharmacy: Pharmacy = {
      id,
      ...pharmacy,
      createdAt: new Date(),
    };
    
    this.pharmacies.set(id, newPharmacy);
    return newPharmacy;
  }

  async getPharmacyByUserId(userId: string): Promise<Pharmacy | undefined> {
    const user = this.users.get(userId);
    if (!user || user.role !== 'pharmacien') return undefined;
    
    // Trouver la pharmacie par numéro de téléphone (liaison temporaire)
    return Array.from(this.pharmacies.values()).find(pharmacy => pharmacy.phone === user.phone);
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
    return Array.from(this.orders.values())
      .filter(o => o.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
}