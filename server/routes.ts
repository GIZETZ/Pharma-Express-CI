import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { insertPharmacySchema, insertPrescriptionSchema, insertOrderSchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Pharmacies endpoints
  app.get('/api/pharmacies', async (req, res) => {
    try {
      const { lat, lng, radius = 10 } = req.query;
      const pharmacies = await storage.getPharmacies(
        lat ? parseFloat(lat as string) : undefined,
        lng ? parseFloat(lng as string) : undefined,
        radius ? parseInt(radius as string) : undefined
      );
      res.json(pharmacies);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
      res.status(500).json({ message: 'Failed to fetch pharmacies' });
    }
  });

  app.get('/api/pharmacies/:id', async (req, res) => {
    try {
      const pharmacy = await storage.getPharmacy(req.params.id);
      if (!pharmacy) {
        return res.status(404).json({ message: 'Pharmacy not found' });
      }
      res.json(pharmacy);
    } catch (error) {
      console.error('Error fetching pharmacy:', error);
      res.status(500).json({ message: 'Failed to fetch pharmacy' });
    }
  });

  app.post('/api/pharmacies', async (req, res) => {
    try {
      const pharmacyData = insertPharmacySchema.parse(req.body);
      const pharmacy = await storage.createPharmacy(pharmacyData);
      res.status(201).json(pharmacy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid pharmacy data', errors: error.errors });
      }
      console.error('Error creating pharmacy:', error);
      res.status(500).json({ message: 'Failed to create pharmacy' });
    }
  });

  // Prescriptions endpoints
  app.post('/api/prescriptions', upload.single('prescription'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Prescription image is required' });
      }

      // In a real implementation, you would:
      // 1. Upload the file to cloud storage (AWS S3, Google Cloud, etc.)
      // 2. Process the image with OCR to extract medication info
      // 3. Store the metadata in the database

      // For now, we'll simulate storing the image URL
      const imageUrl = `/uploads/prescriptions/${Date.now()}-${req.file.originalname}`;
      
      const prescriptionData = {
        userId: 'current-user', // In real app, get from session/auth
        imageUrl,
        status: 'pending' as const,
        medications: null, // Would be populated by OCR processing
      };

      const prescription = await storage.createPrescription(prescriptionData);
      
      // Simulate OCR processing with a delay
      setTimeout(async () => {
        try {
          await storage.updatePrescriptionStatus(prescription.id, 'processed');
          // In real app, would send push notification here
        } catch (error) {
          console.error('Error updating prescription status:', error);
        }
      }, 3000);

      res.status(201).json(prescription);
    } catch (error) {
      console.error('Error uploading prescription:', error);
      res.status(500).json({ message: 'Failed to upload prescription' });
    }
  });

  app.get('/api/prescriptions', async (req, res) => {
    try {
      const userId = 'current-user'; // In real app, get from session/auth
      const prescriptions = await storage.getUserPrescriptions(userId);
      res.json(prescriptions);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      res.status(500).json({ message: 'Failed to fetch prescriptions' });
    }
  });

  app.get('/api/prescriptions/:id', async (req, res) => {
    try {
      const prescription = await storage.getPrescription(req.params.id);
      if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found' });
      }
      res.json(prescription);
    } catch (error) {
      console.error('Error fetching prescription:', error);
      res.status(500).json({ message: 'Failed to fetch prescription' });
    }
  });

  // Orders endpoints
  app.post('/api/orders', async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      
      // Send confirmation notification
      await storage.createNotification({
        userId: order.userId,
        title: 'Commande confirmée',
        body: `Votre commande #${order.id.slice(-6)} a été confirmée`,
        type: 'order_update',
        orderId: order.id,
        isRead: false,
      });

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid order data', errors: error.errors });
      }
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Failed to create order' });
    }
  });

  app.get('/api/orders', async (req, res) => {
    try {
      const userId = 'current-user'; // In real app, get from session/auth
      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  app.get('/api/orders/current', async (req, res) => {
    try {
      const userId = 'current-user'; // In real app, get from session/auth
      const order = await storage.getCurrentOrder(userId);
      res.json(order);
    } catch (error) {
      console.error('Error fetching current order:', error);
      res.status(500).json({ message: 'Failed to fetch current order' });
    }
  });

  app.get('/api/orders/:id', async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: 'Failed to fetch order' });
    }
  });

  app.patch('/api/orders/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, status);
      
      if (order) {
        // Send status update notification
        await storage.createNotification({
          userId: order.userId,
          title: 'Mise à jour de commande',
          body: `Votre commande est maintenant: ${status}`,
          type: 'order_update',
          orderId: order.id,
          isRead: false,
        });
      }

      res.json(order);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Failed to update order status' });
    }
  });

  // Delivery persons endpoints
  app.get('/api/delivery-persons/:id', async (req, res) => {
    try {
      const deliveryPerson = await storage.getDeliveryPerson(req.params.id);
      if (!deliveryPerson) {
        return res.status(404).json({ message: 'Delivery person not found' });
      }
      res.json(deliveryPerson);
    } catch (error) {
      console.error('Error fetching delivery person:', error);
      res.status(500).json({ message: 'Failed to fetch delivery person' });
    }
  });

  // Notifications endpoints
  app.get('/api/notifications', async (req, res) => {
    try {
      const userId = 'current-user'; // In real app, get from session/auth
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.patch('/api/notifications/:id/read', async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to update notification' });
    }
  });

  // User endpoints (mock for demo)
  app.get('/api/user', async (req, res) => {
    try {
      // Mock user data - in real app this would come from authentication
      const user = {
        id: 'current-user',
        email: 'david.kouame@email.com',
        firstName: 'David',
        lastName: 'Kouame',
        phone: '+225 01 02 03 04 05',
        profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100',
        language: 'fr',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date(),
      };
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Geolocation helper endpoint
  app.get('/api/location/reverse', async (req, res) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }

      // Mock reverse geocoding - in real app would use Google Maps API, etc.
      const address = {
        formatted_address: 'Avenue Félix Houphouët-Boigny, Abidjan, Côte d\'Ivoire',
        city: 'Abidjan',
        country: 'Côte d\'Ivoire',
        postal_code: '',
      };

      res.json(address);
    } catch (error) {
      console.error('Error with reverse geocoding:', error);
      res.status(500).json({ message: 'Failed to get address' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
