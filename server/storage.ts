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
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  loginUser(phone: string, password: string): Promise<User | null>;
  getUserStats(userId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    totalSavings: number;
    loyaltyPoints: number;
  }>;

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
  deleteOrder(id: string): Promise<boolean>;

  // Double confirmation delivery operations
  confirmDeliveryArrival(orderId: string): Promise<Order | undefined>;
  confirmDeliveryCompletion(orderId: string): Promise<Order | undefined>;

  // Delivery person operations (using User type with role='livreur')
  getAvailableDeliveryPersonnel(): Promise<User[]>;
  getAvailableDeliveryPersonnelForPharmacy(pharmacyId: string): Promise<User[]>;
  getDeliveryOrders(): Promise<Order[]>;
  assignDeliveryPerson(orderId: string, deliveryPersonId: string): Promise<Order | undefined>;
  getMyAssignedOrders(deliveryPersonId: string): Promise<Order[]>;
  acceptDeliveryAssignment(orderId: string, deliveryPersonId: string): Promise<Order | undefined>;
  rejectDeliveryAssignment(orderId: string, deliveryPersonId: string, isExpired?: boolean): Promise<boolean>;
  cleanupExpiredAssignments(): Promise<void>;

  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;

  // Delivery Profile operations
  getDeliveryProfile(userId: string): Promise<DeliveryProfile | undefined>;
  createDeliveryProfile(profile: InsertDeliveryProfile): Promise<DeliveryProfile>;
  updateDeliveryProfile(userId: string, updates: Partial<InsertDeliveryProfile>): Promise<DeliveryProfile | undefined>;

  // Delivery Vehicle operations
  getDeliveryVehicle(deliveryPersonId: string): Promise<DeliveryVehicle | undefined>;
  createDeliveryVehicle(vehicle: InsertDeliveryVehicle): Promise<DeliveryVehicle>;
  updateDeliveryVehicle(deliveryPersonId: string, updates: Partial<InsertDeliveryVehicle>): Promise<DeliveryVehicle | undefined>;
  getDeliveryPersonWithVehicleAndProfile(deliveryPersonId: string): Promise<{
    user: User;
    profile?: DeliveryProfile;
    vehicle?: DeliveryVehicle;
  } | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private pharmacies: Map<string, Pharmacy> = new Map();
  private prescriptions: Map<string, Prescription> = new Map();
  private orders: Map<string, Order> = new Map();
  // Removed deliveryPersons map - using users with role='livreur' instead
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
        verificationStatus: "approved" as const,
        deliveryApplicationStatus: "pending" as const,
        appliedPharmacyId: null, // Sera défini plus tard
        motivationLetter: "Fort de mon expérience de plusieurs années dans la livraison à Abidjan, je souhaite mettre mes compétences au service de votre pharmacie pour assurer un service de qualité à vos patients.",
        experience: "5 ans d'expérience en livraison dans différents secteurs. Excellente connaissance de toutes les zones d'Abidjan. Ponctuel et fiable.",
        availability: "Disponible du lundi au vendredi de 7h à 19h, et samedi de 8h à 16h. Possibilité d'urgences le dimanche."
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

    // Créer des candidatures de test pour les pharmacies
    await this.createTestDeliveryApplications();
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

  private async createTestDeliveryApplications() {
    // Récupérer les pharmacies et créer quelques livreurs candidats
    const pharmacies = Array.from(this.pharmacies.values());
    if (pharmacies.length === 0) return;

    // Créer des livreurs candidats
    const testDeliveryApplicants = [
      {
        firstName: "Mohamed",
        lastName: "Traore",
        phone: "+225 07 88 99 00",
        address: "Adjamé, Abidjan",
        password: "livreur456",
        role: "livreur" as const,
        language: "fr",
        isActive: true,
        verificationStatus: "approved" as const,
        deliveryApplicationStatus: "pending" as const,
        appliedPharmacyId: pharmacies[0].id, // Postule à la première pharmacie
        motivationLetter: "Je suis très motivé à rejoindre votre équipe de livraison. J'ai de l'expérience dans la livraison et je connais bien Abidjan.",
        experience: "2 ans d'expérience en livraison à moto dans la région d'Abidjan. Ancien livreur chez UberEats.",
        availability: "Disponible du lundi au samedi de 8h à 18h. Flexible pour les urgences le weekend."
      },
      {
        firstName: "Fatou",
        lastName: "Coulibaly",
        phone: "+225 05 11 22 33",
        address: "Treichville, Abidjan",
        password: "livreur789",
        role: "livreur" as const,
        language: "fr",
        isActive: true,
        verificationStatus: "approved" as const,
        deliveryApplicationStatus: "pending" as const,
        appliedPharmacyId: pharmacies[1] ? pharmacies[1].id : pharmacies[0].id, // Postule à la deuxième pharmacie ou première si pas de deuxième
        motivationLetter: "En tant que femme livreur, je souhaite contribuer à améliorer l'accès aux médicaments dans ma communauté.",
        experience: "1 an d'expérience en livraison de colis. Excellente connaissance de Treichville et environs.",
        availability: "Disponible tous les jours de 9h à 17h. Préférence pour les livraisons en journée."
      },
      {
        firstName: "Ibrahim",
        lastName: "Ouattara",
        phone: "+225 01 44 55 66",
        address: "Koumassi, Abidjan",
        password: "livreur101",
        role: "livreur" as const,
        language: "fr",
        isActive: true,
        verificationStatus: "approved" as const,
        deliveryApplicationStatus: "pending" as const,
        appliedPharmacyId: pharmacies[0].id, // Postule aussi à la première pharmacie
        motivationLetter: "Je cherche une opportunité stable dans le secteur de la santé. La livraison de médicaments me semble être un travail valorisant.",
        experience: "Nouveau dans la livraison mais très motivé. J'ai un permis de conduire valide et une moto en bon état.",
        availability: "Très flexible, disponible 7j/7 y compris les urgences de nuit."
      }
    ];

    for (const applicantData of testDeliveryApplicants) {
      // Vérifier qu'un utilisateur avec ce téléphone n'existe pas déjà
      const existingUser = await this.getUserByPhone(applicantData.phone);
      if (!existingUser) {
        await this.createUser(applicantData);
        console.log(`✅ Candidat livreur créé: ${applicantData.firstName} ${applicantData.lastName} -> Pharmacie ${applicantData.appliedPharmacyId}`);
      }
    }

    console.log(`✅ ${testDeliveryApplicants.length} candidatures de livreurs créées pour test`);

    // Mettre à jour Jean-Claude avec une candidature vers la première pharmacie
    const jeanClaude = Array.from(this.users.values()).find(u => u.firstName === "Jean-Claude" && u.lastName === "Koffi");
    if (jeanClaude && pharmacies.length > 0) {
      await this.updateUser(jeanClaude.id, {
        deliveryApplicationStatus: "pending" as const,
        appliedPharmacyId: pharmacies[0].id,
        motivationLetter: "Fort de mon expérience de plusieurs années dans la livraison à Abidjan, je souhaite mettre mes compétences au service de votre pharmacie pour assurer un service de qualité à vos patients.",
        experience: "5 ans d'expérience en livraison dans différents secteurs. Excellente connaissance de toutes les zones d'Abidjan. Ponctuel et fiable.",
        availability: "Disponible du lundi au vendredi de 7h à 19h, et samedi de 8h à 16h. Possibilité d'urgences le dimanche."
      });
      console.log(`✅ Jean-Claude mis à jour avec candidature pour pharmacie ${pharmacies[0].id}`);
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
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

    const patients = usersArray.filter(u => u.role === 'patient').length;
    const pharmaciens = usersArray.filter(u => u.role === 'pharmacien' && u.verificationStatus === 'approved').length;
    const livreurs = usersArray.filter(u => u.role === 'livreur' && u.verificationStatus === 'approved').length;
    const orders = ordersArray.length;
    const pendingOrders = ordersArray.filter(o => o.status === 'pending').length;
    const activeDeliveries = ordersArray.filter(o => ['confirmed', 'preparing', 'ready_for_delivery', 'in_transit', 'in_delivery'].includes(o.status)).length;
    const completedDeliveries = ordersArray.filter(o => o.status === 'delivered').length;

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

  async getUserStats(userId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    totalSavings: number;
    loyaltyPoints: number;
  }> {
    // Filtrer toutes les commandes appartenant à cet utilisateur
    const userOrders = Array.from(this.orders.values()).filter(order => {
      const isUserOrder = order.userId === userId;
      console.log(`Checking order ${order.id}: userId=${order.userId}, targetUserId=${userId}, match=${isUserOrder}`);
      return isUserOrder;
    });

    console.log(`Found ${userOrders.length} orders for user ${userId}`);

    const totalOrders = userOrders.length;
    const totalSpent = userOrders.reduce((sum, order) => {
      const amount = parseFloat(order.totalAmount || '0');
      console.log(`Order ${order.id}: totalAmount=${order.totalAmount}, parsed=${amount}`);
      return sum + amount;
    }, 0);

    // Calcul des économies basé sur les promotions et réductions
    const totalSavings = userOrders.reduce((sum, order) => {
      // Supposons une économie moyenne de 5% sur chaque commande
      return sum + (parseFloat(order.totalAmount || '0') * 0.05);
    }, 0);

    // Points de fidélité : 1 point par 100 FCFA dépensés
    const loyaltyPoints = Math.floor(totalSpent / 100);

    console.log(`User stats for ${userId}:`, {
      totalOrders,
      totalSpent,
      totalSavings: Math.round(totalSavings),
      loyaltyPoints
    });

    return {
      totalOrders,
      totalSpent,
      totalSavings: Math.round(totalSavings),
      loyaltyPoints
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

  // Delivery person operations (using User table instead)

  // Helper method to get daily order count for a delivery person
  getDailyOrderCount(deliveryPersonId: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
    
    return Array.from(this.orders.values()).filter(order => {
      if (order.deliveryPersonId !== deliveryPersonId) return false;
      if (!order.assignedAt) return false;
      
      const assignedDate = new Date(order.assignedAt);
      return assignedDate >= today && assignedDate < tomorrow;
    }).length;
  }

  // Get delivery personnel for a specific pharmacy with daily order counts
  async getAvailableDeliveryPersonnelForPharmacy(pharmacyId: string): Promise<User[]> {
    const filtered = Array.from(this.users.values()).filter(user => {
      const isLivreur = user.role === 'livreur';
      const isApproved = user.verificationStatus === 'approved';
      const isActive = user.isActive !== false; // Default to true if not set
      const isAssignedToPharmacy = user.pharmacyId === pharmacyId;
      const isApplicationApproved = user.deliveryApplicationStatus === 'approved';

      console.log(`Checking livreur ${user.firstName} ${user.lastName}:`, {
        isLivreur,
        isApproved,
        isActive,
        pharmacyId: user.pharmacyId,
        requestedPharmacyId: pharmacyId,
        isAssignedToPharmacy,
        deliveryApplicationStatus: user.deliveryApplicationStatus,
        isApplicationApproved,
        shouldInclude: isLivreur && isApproved && isActive && isAssignedToPharmacy && isApplicationApproved
      });

      // For debugging: also include users that are assigned to pharmacy but not approved yet
      if (isLivreur && isApproved && isActive && isAssignedToPharmacy) {
        console.log(`✅ Found eligible livreur: ${user.firstName} ${user.lastName} - Status: ${user.deliveryApplicationStatus}`);
      }

      return isLivreur && isApproved && isActive && isAssignedToPharmacy && isApplicationApproved;
    });

    console.log(`🔄 Filtering delivery personnel for pharmacy ${pharmacyId}: found ${filtered.length} eligible personnel out of ${Array.from(this.users.values()).filter(u => u.role === 'livreur').length} total delivery personnel`);

    // Additional debug: show all livreurs for this pharmacy regardless of status
    const allLivreursForPharmacy = Array.from(this.users.values()).filter(user => 
      user.role === 'livreur' && user.pharmacyId === pharmacyId
    );
    console.log(`📋 All livreurs assigned to pharmacy ${pharmacyId}:`, allLivreursForPharmacy.map(u => ({
      name: `${u.firstName} ${u.lastName}`,
      status: u.deliveryApplicationStatus,
      verified: u.verificationStatus,
      active: u.isActive
    })));

    // Add daily order count for each delivery person
    const personnelWithDailyCount = filtered.map(person => ({
      ...person,
      dailyOrderCount: this.getDailyOrderCount(person.id)
    }));

    return personnelWithDailyCount;
  }

  // Modified method to filter approved delivery personnel who have been approved by a pharmacy
  async getAvailableDeliveryPersonnel(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.role === 'livreur' && 
      user.verificationStatus === 'approved' &&
      user.isActive === true
    );
  }

  // New method to get the owner of a pharmacy (pharmacist user)
  async getPharmacyOwner(pharmacyId: string): Promise<any | null> {
    const users = Array.from(this.users.values());
    const owner = users.find(user => user.role === 'pharmacien' && user.pharmacyId === pharmacyId);

    if (!owner) {
      // Fallback: try to find by pharmacy phone number
      const pharmacy = this.pharmacies.get(pharmacyId);
      if (pharmacy && pharmacy.phone) {
        const ownerByPhone = users.find(user => 
          user.role === 'pharmacien' && user.phone === pharmacy.phone
        );
        if (ownerByPhone) {
          // Update user with pharmacy ID for future reference
          await this.updateUser(ownerByPhone.id, { pharmacyId });
          return ownerByPhone;
        }
      }
    }

    return owner || null;
  }

  // New method to get pending delivery applications for a specific pharmacy
  async getDeliveryApplicationsForPharmacy(pharmacyId: string): Promise<any[]> {
    console.log('🔍 Recherche des candidatures pour pharmacie:', pharmacyId);

    const applications = Array.from(this.users.values()).filter(user => {
      const isLivreur = user.role === 'livreur';
      const hasApplied = user.appliedPharmacyId === pharmacyId;
      const isPending = user.deliveryApplicationStatus === 'pending';

      console.log(`User ${user.firstName} ${user.lastName}:`, {
        isLivreur,
        appliedPharmacyId: user.appliedPharmacyId,
        hasApplied,
        deliveryApplicationStatus: user.deliveryApplicationStatus,
        isPending,
        matches: isLivreur && hasApplied && isPending
      });

      return isLivreur && hasApplied && isPending;
    });

    console.log(`📋 Trouvé ${applications.length} candidatures pour la pharmacie ${pharmacyId}`);

    return applications.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt,
      verificationStatus: user.verificationStatus,
      appliedPharmacyId: user.appliedPharmacyId,
      deliveryApplicationStatus: user.deliveryApplicationStatus,
      idDocumentUrl: user.idDocumentUrl,
      drivingLicenseUrl: user.drivingLicenseUrl,
      professionalDocumentUrl: user.professionalDocumentUrl,
      motivationLetter: user.motivationLetter,
      experience: user.experience,
      availability: user.availability
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
      console.log(`❌ Cannot respond to application: user not found or invalid status`, {
        userId: applicationId,
        userExists: !!user,
        userRole: user?.role,
        currentStatus: user?.deliveryApplicationStatus
      });
      return null;
    }

    console.log(`📝 Processing delivery application response:`, {
      userId: applicationId,
      userName: `${user.firstName} ${user.lastName}`,
      action,
      pharmacyId,
      currentPharmacyId: user.pharmacyId,
      appliedPharmacyId: user.appliedPharmacyId
    });

    if (action === 'approve') {
      user.deliveryApplicationStatus = 'approved';
      user.pharmacyId = pharmacyId; // Assign the livreur to the pharmacy
      user.appliedPharmacyId = undefined; // Clear the applied pharmacy ID

      console.log(`✅ Approved delivery application for ${user.firstName} ${user.lastName}`, {
        newPharmacyId: user.pharmacyId,
        newStatus: user.deliveryApplicationStatus
      });

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
      user.pharmacyId = undefined; // Remove pharmacy assignment

      console.log(`❌ Rejected delivery application for ${user.firstName} ${user.lastName}`);

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
    console.log(`💾 Updated user in storage:`, {
      userId: user.id,
      pharmacyId: user.pharmacyId,
      deliveryApplicationStatus: user.deliveryApplicationStatus
    });

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
      .filter(order => ['ready_for_delivery', 'in_transit', 'delivered'].includes(order.status))
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

    // Set assignment time to track expiration
    order.assignedAt = new Date();
    // Set status to 'assigned_pending_acceptance'
    order.status = 'assigned_pending_acceptance';


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
        body: `Commande #${order.id.slice(0, 8)} - ${order.deliveryAddress}`,
        type: 'delivery_assigned',
        orderId: orderId,
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

  async getMyAssignedOrders(deliveryPersonId: string): Promise<Order[]> {
    // Nettoyer les assignations expirées
    await this.cleanupExpiredAssignments();

    // Récupérer les commandes assignées à ce livreur
    const assignedOrders = Array.from(this.orders.values()).filter(order => 
      order.deliveryPersonId === deliveryPersonId && 
      ['assigned_pending_acceptance', 'in_transit', 'delivered'].includes(order.status)
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Enrichir avec les données de pharmacie et patient
    return assignedOrders.map(order => {
      const pharmacy = order.pharmacyId ? this.pharmacies.get(order.pharmacyId) : null;
      const patient = this.users.get(order.userId);

      return {
        ...order,
        pharmacy,
        patient
      };
    });
  }

  async acceptDeliveryAssignment(orderId: string, deliveryPersonId: string): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    if (!order || order.deliveryPersonId !== deliveryPersonId || order.status !== 'assigned_pending_acceptance') {
      return undefined;
    }

    // Vérifier si l'assignation n'a pas expiré (3 minutes)
    if (order.assignedAt) {
      const assignedTime = new Date(order.assignedAt).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - assignedTime) / (1000 * 60);

      if (diffMinutes > 3) {
        // Expirée, réjecter automatiquement
        await this.rejectDeliveryAssignment(orderId, deliveryPersonId, true);
        return undefined;
      }
    }

    // Accepter la livraison
    order.status = 'in_transit';
    order.updatedAt = new Date();
    this.orders.set(orderId, order);

    // Notifier le patient
    await this.createNotification({
      userId: order.userId,
      title: 'Livreur en route',
      body: `Votre livreur a accepté la livraison et est en route vers votre adresse.`,
      type: 'delivery_accepted',
      orderId: orderId,
      isRead: false
    });

    return order;
  }

  async rejectDeliveryAssignment(orderId: string, deliveryPersonId: string, isExpired: boolean = false): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order || order.deliveryPersonId !== deliveryPersonId || order.status !== 'assigned_pending_acceptance') {
      return false;
    }

    // Réassigner la commande (retourner en statut ready_for_delivery car elle était déjà prête)
    order.status = 'ready_for_delivery';
    order.deliveryPersonId = undefined;
    order.assignedAt = undefined;
    order.updatedAt = new Date();
    this.orders.set(orderId, order);

    // Notifier selon le type de rejet
    if (!isExpired) {
      await this.createNotification({
        userId: deliveryPersonId,
        title: 'Livraison refusée',
        body: `Vous avez refusé la commande #${orderId.slice(0, 8)}. Elle sera réassignée à un autre livreur.`,
        type: 'delivery_rejected',
        orderId: orderId,
        isRead: false
      });
    }

    return true;
  }

  async cleanupExpiredAssignments(): Promise<void> {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

    const expiredOrders = Array.from(this.orders.values()).filter(order => 
      order.status === 'assigned_pending_acceptance' && 
      order.assignedAt && 
      new Date(order.assignedAt) < threeMinutesAgo
    );

    for (const order of expiredOrders) {
      const expiredDeliveryPersonId = order.deliveryPersonId; // Sauvegarder l'ID avant de le supprimer

      // Retourner au statut ready_for_delivery (pas preparing) car la commande était déjà prête
      order.status = 'ready_for_delivery';
      order.deliveryPersonId = undefined;
      order.assignedAt = undefined;
      order.updatedAt = new Date();
      this.orders.set(order.id, order);

      // Notifier le livreur que l'assignation a expiré
      if (expiredDeliveryPersonId) {
        await this.createNotification({
          userId: expiredDeliveryPersonId,
          title: 'Assignation expirée',
          body: `La commande #${order.id.slice(0, 8)} a été réassignée car vous n'avez pas répondu dans les 3 minutes.`,
          type: 'assignment_expired',
          orderId: order.id,
          isRead: false
        });
      }
    }
  }



  async confirmDeliveryCompletion(orderId: string): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    // Accepter plusieurs statuts pour la confirmation de livraison
    if (!['arrived_pending_confirmation', 'in_transit', 'in_delivery'].includes(order.status)) {
      return undefined;
    }

    // Marquer la livraison comme terminée avec confirmation directe du patient
    order.status = 'delivered';
    order.patientConfirmedAt = new Date();
    order.deliveredAt = new Date();
    order.updatedAt = new Date();
    this.orders.set(orderId, order);

    // Notifier le livreur que la livraison est confirmée
    if (order.deliveryPersonId) {
      await this.createNotification({
        userId: order.deliveryPersonId,
        title: 'Livraison confirmée',
        body: 'Le patient a confirmé la réception. Livraison terminée avec succès !',
        type: 'delivery_completed',
        orderId: orderId,
        isRead: false
      });
    }

    return order;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const deleted = this.orders.delete(id);
    console.log(`Order ${id} ${deleted ? 'successfully deleted' : 'not found'} from memory storage`);
    return deleted;
  }
}