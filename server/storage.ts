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

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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

  private seedData() {
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
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      email: insertUser.email ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      phone: insertUser.phone ?? null,
      profileImageUrl: insertUser.profileImageUrl ?? null,
      language: insertUser.language ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
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

  async getCurrentOrder(userId: string): Promise<Order | undefined> {
    return Array.from(this.orders.values())
      .filter(o => o.userId === userId && ['pending', 'confirmed', 'preparing', 'in_transit'].includes(o.status || ''))
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))[0];
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
