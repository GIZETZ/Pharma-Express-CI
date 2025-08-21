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
import { db } from "./firebase";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { type IStorage } from "./storage";

export class FirebaseStorage implements IStorage {
  
  // Helper function to convert Firestore timestamp to Date
  private convertTimestamp(data: any): any {
    if (data && typeof data === 'object') {
      const converted = { ...data };
      Object.keys(converted).forEach(key => {
        if (converted[key] && typeof converted[key].toDate === 'function') {
          converted[key] = converted[key].toDate();
        }
      });
      return converted;
    }
    return data;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const doc = await db.collection('users').doc(id).get();
      if (!doc.exists) return undefined;
      
      const data = this.convertTimestamp(doc.data());
      return { id: doc.id, ...data } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    try {
      const snapshot = await db.collection('users').where('phone', '==', phone).limit(1).get();
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      const data = this.convertTimestamp(doc.data());
      return { id: doc.id, ...data } as User;
    } catch (error) {
      console.error('Error getting user by phone:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const id = randomUUID();
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      const userData = {
        ...user,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('users').doc(id).set(userData);
      return { id, ...userData } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await db.collection('users').doc(id).update(updateData);
      return this.getUser(id);
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async loginUser(phone: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByPhone(phone);
      if (!user) return null;

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return null;

      return user;
    } catch (error) {
      console.error('Error during login:', error);
      return null;
    }
  }

  // Admin operations
  async getPendingUsers(): Promise<User[]> {
    try {
      const snapshot = await db.collection('users')
        .where('verificationStatus', '==', 'pending')
        .where('role', 'in', ['pharmacien', 'livreur'])
        .get();
      
      return snapshot.docs.map(doc => {
        const data = this.convertTimestamp(doc.data());
        return { id: doc.id, ...data } as User;
      });
    } catch (error) {
      console.error('Error getting pending users:', error);
      return [];
    }
  }

  async updateUserVerificationStatus(userId: string, status: "approved" | "rejected" | "pending"): Promise<User | null> {
    try {
      await db.collection('users').doc(userId).update({
        verificationStatus: status,
        updatedAt: new Date(),
      });
      return this.getUser(userId) ?? null;
    } catch (error) {
      console.error('Error updating verification status:', error);
      return null;
    }
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
    try {
      // Get user counts
      const [patientsSnapshot, pharmaciensSnapshot, livreursSnapshot] = await Promise.all([
        db.collection('users').where('role', '==', 'patient').get(),
        db.collection('users').where('role', '==', 'pharmacien').get(),
        db.collection('users').where('role', '==', 'livreur').get(),
      ]);

      // Get order counts
      const [ordersSnapshot, pendingOrdersSnapshot, activeDeliveriesSnapshot, completedDeliveriesSnapshot] = await Promise.all([
        db.collection('orders').get(),
        db.collection('orders').where('status', '==', 'pending').get(),
        db.collection('orders').where('status', 'in', ['confirmed', 'preparing', 'in_transit']).get(),
        db.collection('orders').where('status', '==', 'delivered').get(),
      ]);

      return {
        patients: patientsSnapshot.size,
        pharmaciens: pharmaciensSnapshot.size,
        livreurs: livreursSnapshot.size,
        orders: ordersSnapshot.size,
        pendingOrders: pendingOrdersSnapshot.size,
        activeDeliveries: activeDeliveriesSnapshot.size,
        completedDeliveries: completedDeliveriesSnapshot.size,
      };
    } catch (error) {
      console.error('Error getting application stats:', error);
      return {
        patients: 0,
        pharmaciens: 0,
        livreurs: 0,
        orders: 0,
        pendingOrders: 0,
        activeDeliveries: 0,
        completedDeliveries: 0,
      };
    }
  }

  // Pharmacy operations
  async getPharmacies(lat?: number, lng?: number, radius?: number): Promise<Pharmacy[]> {
    try {
      // For now, return all pharmacies. In a real implementation, you'd use geospatial queries
      const snapshot = await db.collection('pharmacies').get();
      
      const pharmacies = snapshot.docs.map(doc => {
        const data = this.convertTimestamp(doc.data());
        return { id: doc.id, ...data } as Pharmacy;
      });

      // If coordinates are provided, sort by distance (simple implementation)
      if (lat !== undefined && lng !== undefined) {
        return pharmacies.sort((a, b) => {
          const distA = this.calculateDistance(lat, lng, a.latitude || 0, a.longitude || 0);
          const distB = this.calculateDistance(lat, lng, b.latitude || 0, b.longitude || 0);
          return distA - distB;
        });
      }

      return pharmacies;
    } catch (error) {
      console.error('Error getting pharmacies:', error);
      return [];
    }
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
    try {
      const doc = await db.collection('pharmacies').doc(id).get();
      if (!doc.exists) return undefined;
      
      const data = this.convertTimestamp(doc.data());
      return { id: doc.id, ...data } as Pharmacy;
    } catch (error) {
      console.error('Error getting pharmacy:', error);
      return undefined;
    }
  }

  async createPharmacy(pharmacy: InsertPharmacy): Promise<Pharmacy> {
    try {
      const id = randomUUID();
      const pharmacyData = {
        ...pharmacy,
        createdAt: new Date(),
      };

      await db.collection('pharmacies').doc(id).set(pharmacyData);
      return { id, ...pharmacyData } as Pharmacy;
    } catch (error) {
      console.error('Error creating pharmacy:', error);
      throw error;
    }
  }

  // Prescription operations
  async getPrescription(id: string): Promise<Prescription | undefined> {
    try {
      const doc = await db.collection('prescriptions').doc(id).get();
      if (!doc.exists) return undefined;
      
      const data = this.convertTimestamp(doc.data());
      return { id: doc.id, ...data } as Prescription;
    } catch (error) {
      console.error('Error getting prescription:', error);
      return undefined;
    }
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    try {
      const id = randomUUID();
      const prescriptionData = {
        ...prescription,
        createdAt: new Date(),
      };

      await db.collection('prescriptions').doc(id).set(prescriptionData);
      return { id, ...prescriptionData } as Prescription;
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error;
    }
  }

  async getUserPrescriptions(userId: string): Promise<Prescription[]> {
    try {
      const snapshot = await db.collection('prescriptions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => {
        const data = this.convertTimestamp(doc.data());
        return { id: doc.id, ...data } as Prescription;
      });
    } catch (error) {
      console.error('Error getting user prescriptions:', error);
      return [];
    }
  }

  async updatePrescriptionStatus(id: string, status: string): Promise<Prescription | undefined> {
    try {
      await db.collection('prescriptions').doc(id).update({ status });
      return this.getPrescription(id);
    } catch (error) {
      console.error('Error updating prescription status:', error);
      return undefined;
    }
  }

  // Order operations
  async getOrder(id: string): Promise<Order | undefined> {
    try {
      const doc = await db.collection('orders').doc(id).get();
      if (!doc.exists) return undefined;
      
      const data = this.convertTimestamp(doc.data());
      return { id: doc.id, ...data } as Order;
    } catch (error) {
      console.error('Error getting order:', error);
      return undefined;
    }
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    try {
      const id = randomUUID();
      const orderData = {
        ...order,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('orders').doc(id).set(orderData);
      return { id, ...orderData } as Order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const snapshot = await db.collection('orders')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => {
        const data = this.convertTimestamp(doc.data());
        return { id: doc.id, ...data } as Order;
      });
    } catch (error) {
      console.error('Error getting user orders:', error);
      return [];
    }
  }

  async getCurrentOrder(userId: string): Promise<Order | undefined> {
    try {
      const snapshot = await db.collection('orders')
        .where('userId', '==', userId)
        .where('status', 'in', ['pending', 'confirmed', 'preparing', 'in_transit'])
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      const data = this.convertTimestamp(doc.data());
      return { id: doc.id, ...data } as Order;
    } catch (error) {
      console.error('Error getting current order:', error);
      return undefined;
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'delivered') {
        updateData.deliveredAt = new Date();
      }

      await db.collection('orders').doc(id).update(updateData);
      return this.getOrder(id);
    } catch (error) {
      console.error('Error updating order status:', error);
      return undefined;
    }
  }

  async updateOrderMedications(id: string, medications: any[]): Promise<Order | undefined> {
    try {
      await db.collection('orders').doc(id).update({
        medications,
        updatedAt: new Date(),
      });
      return this.getOrder(id);
    } catch (error) {
      console.error('Error updating order medications:', error);
      return undefined;
    }
  }

  // Delivery person operations
  async getDeliveryPerson(id: string): Promise<DeliveryPerson | undefined> {
    try {
      const doc = await db.collection('delivery_persons').doc(id).get();
      if (!doc.exists) return undefined;
      
      const data = this.convertTimestamp(doc.data());
      return { id: doc.id, ...data } as DeliveryPerson;
    } catch (error) {
      console.error('Error getting delivery person:', error);
      return undefined;
    }
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const snapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => {
        const data = this.convertTimestamp(doc.data());
        return { id: doc.id, ...data } as Notification;
      });
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      const id = randomUUID();
      const notificationData = {
        ...notification,
        createdAt: new Date(),
      };

      await db.collection('notifications').doc(id).set(notificationData);
      return { id, ...notificationData } as Notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    try {
      await db.collection('notifications').doc(id).update({ isRead: true });
      
      const doc = await db.collection('notifications').doc(id).get();
      if (!doc.exists) return undefined;
      
      const data = this.convertTimestamp(doc.data());
      return { id: doc.id, ...data } as Notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return undefined;
    }
  }
}