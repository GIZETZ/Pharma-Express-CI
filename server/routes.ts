import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import session from "express-session";
import { storage } from "./storage";
import { 
  insertPharmacySchema, 
  insertPrescriptionSchema, 
  insertOrderSchema, 
  insertNotificationSchema,
  registerSchema,
  loginSchema
} from "@shared/schema";
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

// Interface pour les sessions
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    language?: string;
  }
}

// Middleware d'authentification
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configuration des sessions
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-development-only',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true en production avec HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    }
  }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes d'authentification
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await storage.getUserByPhone(validatedData.phone);
      if (existingUser) {
        return res.status(400).json({ message: 'Un utilisateur avec ce numéro existe déjà' });
      }

      // Set verification status based on role
      let verificationStatus = "approved"; // Default for patients
      if (validatedData.role === "pharmacien" || validatedData.role === "livreur") {
        verificationStatus = "pending"; // Requires admin validation
      }

      // Créer l'utilisateur
      const { confirmPassword, ...userData } = validatedData;
      const user = await storage.createUser({
        ...userData,
        verificationStatus,
      });

      // Démarrer la session
      req.session.userId = user.id;
      req.session.language = user.language || "fr";

      // Retourner les infos utilisateur (sans le mot de passe)
      const { password, ...userInfo } = user;
      res.status(201).json(userInfo);
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(500).json({ message: 'Erreur lors de l\'inscription' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      const user = await storage.loginUser(validatedData.phone, validatedData.password);
      if (!user) {
        return res.status(400).json({ message: 'Numéro de téléphone ou mot de passe incorrect' });
      }

      // Démarrer la session
      req.session.userId = user.id;
      req.session.language = user.language || "fr";

      // Retourner les infos utilisateur (sans le mot de passe)
      const { password, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Données invalides', errors: error.errors });
      }
      res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la déconnexion' });
      }
      res.json({ message: 'Déconnexion réussie' });
    });
  });

  app.get('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Check if professional account is pending validation
      if ((user.role === "pharmacien" || user.role === "livreur") && user.verificationStatus === "pending") {
        const { password, ...userInfo } = user;
        return res.json({
          ...userInfo,
          isPending: true,
          message: "Votre compte est en attente de validation administrative"
        });
      }

      // Retourner les infos utilisateur (sans le mot de passe)
      const { password, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  app.put('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      const updates = req.body;
      const updatedUser = await storage.updateUser(req.session.userId, updates);

      if (!updatedUser) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Mettre à jour la langue de session si elle a changé
      if (updates.language) {
        req.session.language = updates.language;
      }

      // Retourner les infos utilisateur (sans le mot de passe)
      const { password, ...userInfo } = updatedUser;
      res.json(userInfo);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
  });

  // Upload profile image
  app.post('/api/auth/upload-profile-image', requireAuth, upload.single('profileImage'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier fourni' });
      }

      // Simuler la sauvegarde de l'image (en production, vous sauvegarderez sur un service cloud)
      const imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      const updatedUser = await storage.updateUser(req.session.userId, { 
        profileImageUrl: imageUrl 
      });

      if (!updatedUser) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
      res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image' });
    }
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
  app.post('/api/prescriptions', requireAuth, upload.single('prescription'), async (req: any, res) => {
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
        userId: req.session.userId, // Utiliser l'ID de l'utilisateur connecté
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

  app.get('/api/prescriptions', requireAuth, async (req: any, res) => {
    try {
      const prescriptions = await storage.getUserPrescriptions(req.session.userId);
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
  app.post('/api/orders', requireAuth, upload.fields([
    { name: 'prescriptionPhoto', maxCount: 1 },
    { name: 'bonDocument0', maxCount: 1 },
    { name: 'bonDocument1', maxCount: 1 },
    { name: 'bonDocument2', maxCount: 1 },
    { name: 'bonDocument3', maxCount: 1 },
    { name: 'bonDocument4', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      console.log('Order request body:', req.body);
      console.log('Order files:', req.files);
      
      const orderData = { ...req.body, userId: req.session.userId };
      
      // Ensure pharmacyId is present
      if (!orderData.pharmacyId) {
        return res.status(400).json({ message: 'Pharmacy ID is required' });
      }

      // Handle prescription photo upload
      let prescriptionId = null;
      if (req.files && req.files['prescriptionPhoto'] && req.files['prescriptionPhoto'][0]) {
        const prescriptionFile = req.files['prescriptionPhoto'][0];
        console.log('Prescription photo found:', prescriptionFile.originalname);
        
        // Create a prescription record
        const prescriptionData = {
          userId: req.session.userId,
          imageUrl: `data:${prescriptionFile.mimetype};base64,${prescriptionFile.buffer.toString('base64')}`,
          status: 'processed' as const,
          medications: null,
        };
        
        const prescription = await storage.createPrescription(prescriptionData);
        prescriptionId = prescription.id;
        console.log('Created prescription with ID:', prescriptionId);
      }

      // Add prescription ID to order data
      if (prescriptionId) {
        orderData.prescriptionId = prescriptionId;
      }

      // Handle BON documents
      const bonDocuments = [];
      for (let i = 0; i < 5; i++) {
        const fieldName = `bonDocument${i}`;
        if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
          const bonFile = req.files[fieldName][0];
          bonDocuments.push({
            name: bonFile.originalname,
            data: `data:${bonFile.mimetype};base64,${bonFile.buffer.toString('base64')}`,
          });
        }
      }

      if (bonDocuments.length > 0) {
        orderData.bonDocuments = JSON.stringify(bonDocuments);
      }
      
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

  app.get('/api/orders', requireAuth, async (req: any, res) => {
    try {
      const orders = await storage.getUserOrders(req.session.userId);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  app.get('/api/orders/current', requireAuth, async (req: any, res) => {
    try {
      const order = await storage.getCurrentOrder(req.session.userId);
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
  app.get('/api/notifications', requireAuth, async (req: any, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.session.userId);
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



  // Geolocation helper endpoint
  app.get('/api/location/reverse', async (req, res) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }

      // Using OpenStreetMap Nominatim for free reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PharmaExpressCI/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();
      
      if (!data || !data.display_name) {
        throw new Error('No address found for these coordinates');
      }

      const address = {
        formatted_address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village || '',
        country: data.address?.country || 'Côte d\'Ivoire',
        postal_code: data.address?.postcode || '',
        state: data.address?.state || '',
        region: data.address?.region || ''
      };

      res.json(address);
    } catch (error) {
      console.error('Error with reverse geocoding:', error);
      
      // Fallback to a generic response
      const fallbackAddress = {
        formatted_address: `Position GPS: ${req.query.lat}, ${req.query.lng}`,
        city: '',
        country: 'Côte d\'Ivoire',
        postal_code: '',
      };
      
      res.json(fallbackAddress);
    }
  });

  // Admin routes for SupervisorLock
  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  };

  // Get pending users for validation
  app.get('/api/admin/pending-users', requireAdmin, async (req, res) => {
    try {
      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      res.status(500).json({ message: 'Failed to fetch pending users' });
    }
  });

  // Validate or reject user account
  app.post('/api/admin/validate-user', requireAdmin, async (req, res) => {
    try {
      const { userId, action } = req.body;

      if (!userId || !action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Invalid request data' });
      }

      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const updatedUser = await storage.updateUserVerificationStatus(userId, newStatus);

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: `User ${action}d successfully`, user: updatedUser });
    } catch (error) {
      console.error('Error validating user:', error);
      res.status(500).json({ message: 'Failed to validate user' });
    }
  });

  // Get application statistics
  app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getApplicationStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });

  // Get pharmacist orders
  app.get('/api/pharmacien/orders', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'pharmacien') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // If user has a pharmacyId, get orders for that pharmacy
      // Otherwise get all orders (for now, until we properly associate pharmacists with pharmacies)
      const orders = user.pharmacyId 
        ? await storage.getPharmacistOrders(user.pharmacyId)
        : await storage.getAllPharmacistOrders();
        
      res.json(orders);
    } catch (error) {
      console.error('Error fetching pharmacist orders:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  // Get pharmacist prescriptions
  app.get('/api/pharmacien/prescriptions', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'pharmacien') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const allPrescriptions = await storage.getAllPrescriptions();
      res.json(allPrescriptions);
    } catch (error) {
      console.error('Error fetching pharmacist prescriptions:', error);
      res.status(500).json({ message: 'Failed to fetch prescriptions' });
    }
  });

  // Update order status (pharmacist)
  app.post('/api/pharmacien/orders/:orderId/status', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'pharmacien') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { orderId } = req.params;
      const { status } = req.body;

      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Failed to update order status' });
    }
  });

  // Update order medications (pharmacist)
  app.post('/api/pharmacien/orders/:orderId/medications', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'pharmacien') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { orderId } = req.params;
      const { medications } = req.body;

      if (!Array.isArray(medications)) {
        return res.status(400).json({ message: 'Medications must be an array' });
      }

      const updatedOrder = await storage.updateOrderMedications(orderId, medications);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating order medications:', error);
      res.status(500).json({ message: 'Failed to update medications' });
    }
  });

  // Get delivery orders (livreur)
  app.get('/api/livreur/deliveries', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const deliveries = await storage.getDeliveryOrders();
      res.json(deliveries);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      res.status(500).json({ message: 'Failed to fetch deliveries' });
    }
  });

  // Get available deliveries (livreur)
  app.get('/api/livreur/available-deliveries', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const availableDeliveries = await storage.getDeliveryOrders();
      res.json(availableDeliveries);
    } catch (error) {
      console.error('Error fetching available deliveries:', error);
      res.status(500).json({ message: 'Failed to fetch available deliveries' });
    }
  });

  // Accept delivery (livreur)
  app.post('/api/livreur/deliveries/:orderId/accept', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { orderId } = req.params;
      const updatedOrder = await storage.assignDeliveryPerson(orderId, user.id);
      res.json(updatedOrder);
    } catch (error) {
      console.error('Error accepting delivery:', error);
      res.status(500).json({ message: 'Failed to accept delivery' });
    }
  });

  // Update delivery status (livreur)
  app.post('/api/livreur/deliveries/:orderId/status', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { orderId } = req.params;
      const { status } = req.body;

      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating delivery status:', error);
      res.status(500).json({ message: 'Failed to update delivery status' });
    }
  });
  // Get all orders
  app.get('/api/orders', requireAuth, async (req: any, res) => {
    try {
      const orders = await storage.getUserOrders(req.session.userId);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  // Create new order
  app.post('/api/orders', requireAuth, async (req: any, res) => {
    try {
      const { 
        pharmacyId, 
        deliveryAddress, 
        deliveryLatitude, 
        deliveryLongitude, 
        medications, 
        pharmacyMessage, 
        notes, 
        totalAmount, 
        status 
      } = req.body;

      if (!pharmacyId || !deliveryAddress) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const orderData: any = {
        userId: req.session.userId,
        pharmacyId,
        deliveryAddress,
        deliveryNotes: notes || pharmacyMessage || '',
        totalAmount: totalAmount ? totalAmount.toString() : '0',
        status: status || 'pending'
      };

      // Ajouter les coordonnées si disponibles
      if (deliveryLatitude) {
        orderData.deliveryLatitude = deliveryLatitude;
      }
      if (deliveryLongitude) {
        orderData.deliveryLongitude = deliveryLongitude;
      }

      // Ajouter les médicaments si disponibles
      if (medications) {
        orderData.medications = typeof medications === 'string' 
          ? JSON.parse(medications) 
          : medications;
      }

      const newOrder = await storage.createOrder(orderData);

      res.status(201).json(newOrder);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Failed to create order' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}