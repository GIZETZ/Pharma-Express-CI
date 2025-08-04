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
  type InsertNotification
} from "@shared/schema";
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
    // Seed utilisateurs de test pour chaque rôle
    const testUsers = [
      {
        firstName: "Admin",
        lastName: "YahoPharma",
        phone: "+225 01 23 45 67",
        address: "Siège YahoPharma, Abidjan",
        password: "admin123",
        role: "admin",
        language: "fr"
      },
      {
        firstName: "Dr. Marie",
        lastName: "Kouassi",
        phone: "+225 07 11 22 33",
        address: "Pharmacie de la Paix, Abidjan",
        password: "pharma123",
        role: "pharmacien",
        language: "fr"
      },
      {
        firstName: "Jean-Claude",
        lastName: "Koffi",
        phone: "+225 07 44 55 66",
        address: "Zone livraison Abidjan",
        password: "livreur123",
        role: "livreur",
        language: "fr"
      },
      {
        firstName: "Aya",
        lastName: "Diallo",
        phone: "+225 05 77 88 99",
        address: "Cocody, Abidjan",
        password: "patient123",
        role: "patient",
        language: "fr"
      }
    ];

    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user: User = {
        id: randomUUID(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        address: userData.address,
        password: hashedPassword,
        role: userData.role as any,
        language: userData.language,
        profileImageUrl: null,
        pharmacyId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.users.set(user.id, user);
    }

    // Seed pharmacies
    const pharmaciesData: Pharmacy[] = [
      {
        id: randomUUID(),
        name: "Pharmacie de la Paix",
        address: "Avenue Félix Houphouët-Boigny, Abidjan",
        latitude: "5.3364",
        longitude: "-4.0267",
        phone: "+225 21 24 15 67",
        rating: "4.8",
        deliveryTime: "25",
        isOpen: true,
        openingHours: {
          monday: "08:00-20:00",
          tuesday: "08:00-20:00",
          wednesday: "08:00-20:00",
          thursday: "08:00-20:00",
          friday: "08:00-20:00",
          saturday: "08:00-18:00",
          sunday: "09:00-17:00"
        },
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Pharmacie du Plateau",
        address: "Boulevard de la République, Plateau",
        latitude: "5.3200",
        longitude: "-4.0130",
        phone: "+225 21 32 45 78",
        rating: "4.6",
        deliveryTime: "30",
        isOpen: true,
        openingHours: {
          monday: "07:30-19:30",
          tuesday: "07:30-19:30",
          wednesday: "07:30-19:30",
          thursday: "07:30-19:30",
          friday: "07:30-19:30",
          saturday: "08:00-18:00",
          sunday: "09:00-16:00"
        },
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Pharmacie Moderne",
        address: "Rue des Jardins, Cocody",
        latitude: "5.3580",
        longitude: "-3.9889",
        phone: "+225 22 44 56 89",
        rating: "4.4",
        deliveryTime: "40",
        isOpen: false,
        openingHours: {
          monday: "08:00-19:00",
          tuesday: "08:00-19:00",
          wednesday: "08:00-19:00",
          thursday: "08:00-19:00",
          friday: "08:00-19:00",
          saturday: "08:00-17:00",
          sunday: "closed"
        },
        createdAt: new Date(),
      }
    ];

    pharmaciesData.forEach(pharmacy => {
      this.pharmacies.set(pharmacy.id, pharmacy);
    });

    // Seed delivery persons
    const deliveryPersonsData: DeliveryPerson[] = [
      {
        id: randomUUID(),
        name: "Jean-Claude K.",
        phone: "+225 07 12 34 56",
        currentLatitude: "5.3364",
        currentLongitude: "-4.0267",
        isAvailable: true,
        rating: "4.9",
        createdAt: new Date(),
      }
    ];

    deliveryPersonsData.forEach(person => {
      this.deliveryPersons.set(person.id, person);
    });

    // Seed some test orders
    const testOrders = [
      {
        userId: Array.from(this.users.values()).find(u => u.role === "patient")?.id || randomUUID(),
        pharmacyId: Array.from(this.pharmacies.values())[0]?.id || randomUUID(),
        status: 'pending',
        totalAmount: 25000,
        deliveryAddress: 'Cocody, près du carrefour 2 plateaux',
        deliveryNotes: 'Médicaments pour hypertension',
      },
      {
        userId: Array.from(this.users.values()).find(u => u.role === "patient")?.id || randomUUID(),
        pharmacyId: Array.from(this.pharmacies.values())[1]?.id || randomUUID(),
        status: 'confirmed',
        totalAmount: 15000,
        deliveryAddress: 'Adjamé, près de la gare',
        deliveryNotes: 'Antibiotiques prescrits',
      },
      {
        userId: Array.from(this.users.values()).find(u => u.role === "patient")?.id || randomUUID(),
        pharmacyId: Array.from(this.pharmacies.values())[0]?.id || randomUUID(),
        status: 'ready_for_delivery',
        totalAmount: 8500,
        deliveryAddress: 'Marcory zone 4',
        deliveryNotes: 'Vitamines et compléments',
      },
      {
        userId: Array.from(this.users.values()).find(u => u.role === "patient")?.id || randomUUID(),
        pharmacyId: Array.from(this.pharmacies.values())[1]?.id || randomUUID(),
        status: 'delivered',
        totalAmount: 12000,
        deliveryAddress: 'Plateau, près de la cathédrale',
        deliveryNotes: 'Commande livrée avec succès',
      }
    ];

    testOrders.forEach(orderData => {
      const order: Order = {
        id: randomUUID(),
        userId: orderData.userId,
        pharmacyId: orderData.pharmacyId,
        prescriptionId: null,
        status: orderData.status,
        totalAmount: orderData.totalAmount,
        deliveryAddress: orderData.deliveryAddress,
        deliveryNotes: orderData.deliveryNotes,
        estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000),
        deliveredAt: orderData.status === 'delivered' ? new Date() : null,
        deliveryPersonId: orderData.status === 'delivered' ? Array.from(this.deliveryPersons.values())[0]?.id : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.orders.set(order.id, order);
    });

    // Seed some test prescriptions
    const testPrescriptions = [
      {
        userId: Array.from(this.users.values()).find(u => u.role === "patient")?.id || randomUUID(),
        imageUrl: "/uploads/prescriptions/prescription1.jpg",
        status: 'pending',
        medications: [
          { name: "Paracétamol 500mg", dosage: "2 fois par jour", available: true },
          { name: "Ibuprofène 400mg", dosage: "3 fois par jour", available: true }
        ]
      },
      {
        userId: Array.from(this.users.values()).find(u => u.role === "patient")?.id || randomUUID(),
        imageUrl: "/uploads/prescriptions/prescription2.jpg",
        status: 'processed',
        medications: [
          { name: "Amoxicilline 1g", dosage: "2 fois par jour", available: false },
          { name: "Doliprane 1000mg", dosage: "3 fois par jour", available: true }
        ]
      }
    ];

    testPrescriptions.forEach(prescData => {
      const prescription: Prescription = {
        id: randomUUID(),
        userId: prescData.userId,
        imageUrl: prescData.imageUrl,
        status: prescData.status,
        medications: prescData.medications,
        createdAt: new Date()
      };
      this.prescriptions.set(prescription.id, prescription);
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phone === phone);
  }

  async getPendingUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      (user.role === "pharmacien" || user.role === "livreur") && 
      user.verificationStatus === "pending"
    );
  }

  async updateUserVerificationStatus(userId: string, status: "approved" | "rejected" | "pending"): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    const updatedUser = {
      ...user,
      verificationStatus: status,
      updatedAt: new Date()
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
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
    const allUsers = Array.from(this.users.values());
    const allOrders = Array.from(this.orders.values());

    const patients = allUsers.filter(u => u.role === "patient").length;
    const pharmaciens = allUsers.filter(u => u.role === "pharmacien" && u.verificationStatus === "approved").length;
    const livreurs = allUsers.filter(u => u.role === "livreur" && u.verificationStatus === "approved").length;
    const orders = allOrders.length;
    const pendingOrders = allOrders.filter(o => o.status === "pending").length;
    const activeDeliveries = allOrders.filter(o => o.status === "in_transit").length;
    const completedDeliveries = allOrders.filter(o => o.status === "delivered").length;

    return {
      patients,
      pharmaciens,
      livreurs,
      orders,
      pendingOrders,
      activeDeliveries,
      completedDeliveries
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);

    const user: User = { 
      id,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      phone: insertUser.phone,
      address: insertUser.address,
      password: hashedPassword,
      role: insertUser.role ?? "patient",
      language: insertUser.language ?? "fr",
      profileImageUrl: insertUser.profileImageUrl ?? null,
      pharmacyId: insertUser.pharmacyId ?? null,
      isActive: insertUser.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...updates,
      // Si le mot de passe est mis à jour, le hacher
      password: updates.password ? await bcrypt.hash(updates.password, 10) : user.password,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async loginUser(phone: string, password: string): Promise<User | null> {
    const user = await this.getUserByPhone(phone);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : null;
  }

  // Pharmacy operations
  async getPharmacies(lat?: number, lng?: number, radius?: number): Promise<Pharmacy[]> {
    let pharmacies = Array.from(this.pharmacies.values());

    // If coordinates provided, sort by distance (mock implementation)
    if (lat && lng) {
      pharmacies = pharmacies.sort((a, b) => {
        const distA = Math.sqrt(
          Math.pow(parseFloat(a.latitude || "0") - lat, 2) + 
          Math.pow(parseFloat(a.longitude || "0") - lng, 2)
        );
        const distB = Math.sqrt(
          Math.pow(parseFloat(b.latitude || "0") - lat, 2) + 
          Math.pow(parseFloat(b.longitude || "0") - lng, 2)
        );
        return distA - distB;
      });

      // Filter by radius if provided
      if (radius) {
        pharmacies = pharmacies.filter(pharmacy => {
          const distance = Math.sqrt(
            Math.pow(parseFloat(pharmacy.latitude || "0") - lat, 2) + 
            Math.pow(parseFloat(pharmacy.longitude || "0") - lng, 2)
          );
          return distance <= radius / 100; // Convert to degrees approximation
        });
      }
    }

    return pharmacies;
  }

  async getPharmacy(id: string): Promise<Pharmacy | undefined> {
    return this.pharmacies.get(id);
  }

  async createPharmacy(insertPharmacy: InsertPharmacy): Promise<Pharmacy> {
    const id = randomUUID();
    const pharmacy: Pharmacy = { 
      id,
      name: insertPharmacy.name,
      address: insertPharmacy.address,
      latitude: insertPharmacy.latitude ?? null,
      longitude: insertPharmacy.longitude ?? null,
      phone: insertPharmacy.phone ?? null,
      rating: insertPharmacy.rating ?? null,
      deliveryTime: insertPharmacy.deliveryTime ?? null,
      isOpen: insertPharmacy.isOpen ?? null,
      openingHours: insertPharmacy.openingHours ?? null,
      createdAt: new Date()
    };
    this.pharmacies.set(id, pharmacy);
    return pharmacy;
  }

  // Prescription operations
  async getPrescription(id: string): Promise<Prescription | undefined> {
    return this.prescriptions.get(id);
  }

  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const id = randomUUID();
    const prescription: Prescription = { 
      id,
      userId: insertPrescription.userId,
      imageUrl: insertPrescription.imageUrl,
      status: insertPrescription.status ?? null,
      medications: insertPrescription.medications ?? null,
      createdAt: new Date()
    };
    this.prescriptions.set(id, prescription);
    return prescription;
  }

  async getUserPrescriptions(userId: string): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(p => p.userId === userId);
  }

  async updatePrescriptionStatus(id: string, status: string): Promise<Prescription | undefined> {
    const prescription = this.prescriptions.get(id);
    if (prescription) {
      prescription.status = status;
      this.prescriptions.set(id, prescription);
    }
    return prescription;
  }

  // Order operations
  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const deliveryPersonId = Array.from(this.deliveryPersons.values())
      .find(dp => dp.isAvailable)?.id ?? null;

    const order: Order = { 
      id,
      userId: insertOrder.userId,
      pharmacyId: insertOrder.pharmacyId,
      prescriptionId: insertOrder.prescriptionId ?? null,
      status: insertOrder.status ?? null,
      totalAmount: insertOrder.totalAmount ?? null,
      deliveryAddress: insertOrder.deliveryAddress,
      deliveryNotes: insertOrder.deliveryNotes ?? null,
      estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      deliveredAt: null,
      deliveryPersonId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.set(id, order);
    return order;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(o => o.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  // Get orders for pharmacist
  async getPharmacistOrders(pharmacistId: string): Promise<any[]> {
    const ordersArray = Array.from(this.orders.values());
    const usersArray = Array.from(this.users.values());
    
    // Pour l'instant, retourner toutes les commandes car nous n'avons pas encore
    // d'association directe entre pharmacien et pharmacie
    const ordersWithUserDetails = ordersArray.map(order => {
        const user = usersArray.find(user => user.id === order.userId);
        return {
            id: order.id,
            userId: order.userId,
            pharmacyId: order.pharmacyId,
            status: order.status,
            totalAmount: order.totalAmount,
            deliveryAddress: order.deliveryAddress,
            createdAt: order.createdAt,
            user: user ? {
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone
            } : null
        };
    });

    return ordersWithUserDetails.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    const order = this.orders.get(orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date();
      this.orders.set(orderId, order);
      return order;
    }
    return undefined;
  }

  async getDeliveryOrders(deliveryPersonId?: string): Promise<any[]> {
    const ordersArray = Array.from(this.orders.values());
    const usersArray = Array.from(this.users.values());
    const pharmaciesArray = Array.from(this.pharmacies.values());

    let filteredOrders = ordersArray;

    if (deliveryPersonId) {
      filteredOrders = ordersArray.filter(order => order.deliveryPersonId === deliveryPersonId);
    } else {
      filteredOrders = ordersArray.filter(order => order.status === 'ready_for_delivery');
    }

    const ordersWithDetails = filteredOrders.map(order => {
      const user = usersArray.find(user => user.id === order.userId);
      const pharmacy = pharmaciesArray.find(pharmacy => pharmacy.id === order.pharmacyId);

      return {
        id: order.id,
        userId: order.userId,
        pharmacyId: order.pharmacyId,
        deliveryPersonId: order.deliveryPersonId,
        status: order.status,
        totalAmount: order.totalAmount,
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt,
        user: user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone
        } : null,
        pharmacy: pharmacy ? {
          name: pharmacy.name,
          address: pharmacy.address
        } : null
      };
    });

    return ordersWithDetails.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async assignDeliveryPerson(orderId: string, deliveryPersonId: string): Promise<any> {
    const order = this.orders.get(orderId);
    if (order) {
      order.deliveryPersonId = deliveryPersonId;
      order.status = 'in_delivery';
      order.updatedAt = new Date();
      this.orders.set(orderId, order);
      return order;
    }
    return undefined;
  }

  async getCurrentOrder(userId: string): Promise<Order | undefined> {
    return Array.from(this.orders.values())
      .filter(o => o.userId === userId && !['delivered', 'cancelled'].includes(o.status || ''))
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))[0];
  }

  

  async getAllPrescriptions(): Promise<any[]> {
    const prescriptionsArray = Array.from(this.prescriptions.values());
    const usersArray = Array.from(this.users.values());
    
    const prescriptionsWithUserDetails = prescriptionsArray.map(prescription => {
      const user = usersArray.find(user => user.id === prescription.userId);
      return {
        id: prescription.id,
        userId: prescription.userId,
        imageUrl: prescription.imageUrl,
        status: prescription.status,
        medications: prescription.medications,
        createdAt: prescription.createdAt,
        user: user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone
        } : null
      };
    });

    return prescriptionsWithUserDetails.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  // Create new pharmacy
  async createPharmacy(pharmacyData: any): Promise<any> {
    const id = randomUUID();
    const pharmacy: Pharmacy = {
      id,
      name: pharmacyData.name,
      address: pharmacyData.address,
      latitude: pharmacyData.latitude ?? null,
      longitude: pharmacyData.longitude ?? null,
      phone: pharmacyData.phone ?? null,
      rating: pharmacyData.rating ?? null,
      deliveryTime: pharmacyData.deliveryTime ?? null,
      isOpen: pharmacyData.isOpen ?? null,
      openingHours: pharmacyData.openingHours ?? null,
      createdAt: new Date()
    };
    this.pharmacies.set(id, pharmacy);
    return pharmacy;
  }

  // Create new order
  async createOrder(orderData: any): Promise<any> {
    const id = randomUUID();
    const deliveryPersonId = Array.from(this.deliveryPersons.values())
    .find(dp => dp.isAvailable)?.id ?? null;

    const order: Order = {
      id,
      userId: orderData.userId,
      pharmacyId: orderData.pharmacyId,
      prescriptionId: orderData.prescriptionId ?? null,
      status: orderData.status ?? null,
      totalAmount: orderData.totalAmount ?? null,
      deliveryAddress: orderData.deliveryAddress,
      deliveryNotes: orderData.deliveryNotes ?? null,
      estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      deliveredAt: null,
      deliveryPersonId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (order) {
      order.status = status;
      order.updatedAt = new Date();
      if (status === 'delivered') {
        order.deliveredAt = new Date();
      }
      this.orders.set(id, order);
    }
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
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = { 
      id,
      userId: insertNotification.userId,
      title: insertNotification.title,
      body: insertNotification.body,
      type: insertNotification.type,
      orderId: insertNotification.orderId ?? null,
      isRead: insertNotification.isRead ?? null,
      createdAt: new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.isRead = true;
      this.notifications.set(id, notification);
    }
    return notification;
  }
}

export const storage = new MemStorage();