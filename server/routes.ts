import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import session from "express-session";
import { createStorage } from "./storage-factory";
import {
  insertPharmacySchema,
  insertPrescriptionSchema,
  insertOrderSchema,
  insertNotificationSchema,
  registerSchema,
  loginSchema
} from "@shared/schema";

// Create storage instance
const storage = createStorage();
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

// Multer configuration for delivery applications (allows documents)
const uploadDeliveryDocs = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, PDF and Word documents are allowed.'));
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
  console.log('Auth Check:', {
    sessionID: req.sessionID,
    userId: req.session?.userId,
    hasSession: !!req.session
  });

  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Middleware pour vérifier le rôle de l'utilisateur
const requireRole = (role: string) => (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  storage.getUser(req.session.userId).then(user => {
    if (!user || user.role !== role) {
      return res.status(403).json({ message: `Access denied. Role ${role} required.` });
    }
    next();
  }).catch(error => {
    console.error('Error in requireRole middleware:', error);
    res.status(500).json({ message: 'Internal server error' });
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configuration CORS pour les cookies
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
  });

  // Configuration des sessions
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-development-only',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Désactivé temporairement pour débugger
      httpOnly: false, // Permettre l'accès côté client pour débugger
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      sameSite: 'lax' // Important pour le cross-origin
    },
    name: 'pharma-session' // Nom personnalisé pour éviter les conflits
  }));

  // Middleware de débogage des sessions
  app.use((req: any, res, next) => {
    console.log('Session Debug:', {
      sessionID: req.sessionID,
      userId: req.session?.userId,
      cookies: req.headers.cookie,
      path: req.path
    });
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Test route to verify code changes are applied
  app.get('/api/test-debug', (req, res) => {
    console.log('🚀 TEST ROUTE ACCESSED - CHANGES ARE APPLIED!');
    res.json({ message: 'Debug test route working', timestamp: new Date().toISOString() });
  });

  // Simple test route for pharmacy GET debugging
  app.get('/api/test-pharmacy-get', requireAuth, (req, res) => {
    console.log('🎯 PHARMACY GET TEST - User:', req.session.userId);
    res.json({ success: true, userId: req.session.userId });
  });

  // Test POST route to compare with GET
  app.post('/api/test-pharmacy-post', requireAuth, (req, res) => {
    console.log('🎯 PHARMACY POST TEST - User:', req.session.userId);
    res.json({ success: true, userId: req.session.userId, method: 'POST' });
  });

  // Routes d'authentification
  app.post('/api/auth/register', upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'professionalDocument', maxCount: 1 },
    { name: 'drivingLicense', maxCount: 1 }
  ]), async (req, res) => {
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

      // Process uploaded documents
      let idDocumentUrl = null;
      let professionalDocumentUrl = null;
      let drivingLicenseUrl = null;

      if (req.files) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (files['idDocument'] && files['idDocument'][0]) {
          const idDoc = files['idDocument'][0];
          idDocumentUrl = `data:${idDoc.mimetype};base64,${idDoc.buffer.toString('base64')}`;
          console.log('ID Document uploaded:', idDoc.originalname);
        }

        if (files['professionalDocument'] && files['professionalDocument'][0]) {
          const profDoc = files['professionalDocument'][0];
          professionalDocumentUrl = `data:${profDoc.mimetype};base64,${profDoc.buffer.toString('base64')}`;
          console.log('Professional Document uploaded:', profDoc.originalname);
        }

        if (files['drivingLicense'] && files['drivingLicense'][0]) {
          const drivingDoc = files['drivingLicense'][0];
          drivingLicenseUrl = `data:${drivingDoc.mimetype};base64,${drivingDoc.buffer.toString('base64')}`;
          console.log('Driving License uploaded:', drivingDoc.originalname);
        }
      }

      // Créer l'utilisateur
      const { confirmPassword, ...userData } = validatedData;
      const user = await storage.createUser({
        ...userData,
        verificationStatus,
        idDocumentUrl,
        professionalDocumentUrl,
        drivingLicenseUrl,
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

      // Démarrer la session avec callback pour assurer la sauvegarde
      req.session.userId = user.id;
      req.session.language = user.language || "fr";

      // Sauvegarder explicitement la session
      req.session.save((err) => {
        if (err) {
          console.error('Erreur sauvegarde session:', err);
          return res.status(500).json({ message: 'Erreur de session' });
        }

        console.log('Session sauvegardée pour utilisateur:', user.id);

        // Retourner les infos utilisateur (sans le mot de passe)
        const { password, ...userInfo } = user;
        res.json(userInfo);
      });
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

  // Get current user
    app.get('/api/auth/user', requireAuth, async (req, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
      } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    // Get user statistics
    app.get('/api/auth/user-stats', requireAuth, async (req, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const userStats = await storage.getUserStats(userId);
        res.json(userStats);
      } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ message: 'Internal server error' });
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

  // Endpoint pour vérifier le mot de passe (pour l'accès aux paramètres)
  app.post('/api/auth/verify-password', requireAuth, async (req: any, res) => {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        return res.status(400).json({ message: 'Téléphone et mot de passe requis' });
      }

      // Vérifier que le téléphone correspond à l'utilisateur connecté
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser || currentUser.phone !== phone) {
        return res.status(403).json({ message: 'Numéro de téléphone incorrect' });
      }

      // Vérifier le mot de passe
      const user = await storage.loginUser(phone, password);
      if (!user || user.id !== req.session.userId) {
        return res.status(401).json({ message: 'Mot de passe incorrect' });
      }

      res.json({ success: true, message: 'Mot de passe vérifié' });
    } catch (error) {
      console.error('Erreur lors de la vérification du mot de passe:', error);
      res.status(401).json({ message: 'Mot de passe incorrect' });
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
      const { lat, lng, radius = 50 } = req.query;
      console.log('Fetching pharmacies with params:', { lat, lng, radius });

      const pharmacies = await storage.getPharmacies(
        lat ? parseFloat(lat as string) : undefined,
        lng ? parseFloat(lng as string) : undefined,
        radius ? parseInt(radius as string) : undefined
      );

      console.log(`Found ${pharmacies.length} pharmacies`);

      // Ajouter des headers pour éviter la mise en cache excessive
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

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

  app.post('/api/pharmacies', requireAuth, async (req: any, res) => {
    try {
      // Vérifier que l'utilisateur est un pharmacien
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'pharmacien') {
        return res.status(403).json({ message: 'Seuls les pharmaciens peuvent créer une pharmacie' });
      }

      // Vérifier si le pharmacien a déjà une pharmacie
      const existingPharmacy = await storage.getPharmacyByUserId(req.session.userId);
      if (existingPharmacy) {
        return res.status(400).json({ 
          message: 'Vous avez déjà une pharmacie associée à votre compte',
          existingPharmacy: existingPharmacy
        });
      }

      // Convert numeric fields to strings for decimal database fields
      const bodyData = {
        ...req.body,
        latitude: req.body.latitude ? String(req.body.latitude) : undefined,
        longitude: req.body.longitude ? String(req.body.longitude) : undefined,
        rating: req.body.rating ? String(req.body.rating) : undefined,
        reviewCount: req.body.reviewCount ? String(req.body.reviewCount) : undefined,
      };

      console.log('📊 Données de pharmacie reçues:', bodyData);

      const pharmacyData = insertPharmacySchema.parse(bodyData);
      const pharmacy = await storage.createPharmacy(pharmacyData);

      // Associer automatiquement la pharmacie au pharmacien
      await storage.updateUser(req.session.userId, { pharmacyId: pharmacy.id });

      console.log('✅ Nouvelle pharmacie créée:', {
        id: pharmacy.id,
        name: pharmacy.name,
        address: pharmacy.address,
        ownerId: req.session.userId
      });

      // Ajouter des headers pour éviter la mise en cache
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.status(201).json(pharmacy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('🚨 Erreurs de validation pharmacie:', error.errors);
        return res.status(400).json({ 
          message: 'Données de pharmacie invalides', 
          errors: error.errors,
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      console.error('❌ Erreur lors de la création de la pharmacie:', error);
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
      const bonDocumentsInfo = []; // Renamed from bonDocuments to avoid shadowing
      for (let i = 0; i < 5; i++) {
        const fieldName = `bonDocument${i}`;
        if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
          const bonFile = req.files[fieldName][0];
          bonDocumentsInfo.push({
            name: bonFile.originalname,
            data: `data:${bonFile.mimetype};base64,${bonFile.buffer.toString('base64')}`,
          });
        }
      }

      // Récupérer les informations de la pharmacie
      const pharmacy = await storage.getPharmacyById(orderData.pharmacyId);

      // Extraire les médicaments du body
      const medications = orderData.medications ? 
        (typeof orderData.medications === 'string' ? JSON.parse(orderData.medications) : orderData.medications) 
        : [];

      // Créer la commande
      const order = await storage.createOrder({
        userId: req.session.userId,
        pharmacyId: orderData.pharmacyId,
        deliveryAddress: orderData.deliveryAddress,
        deliveryLatitude: orderData.deliveryLatitude || null,
        deliveryLongitude: orderData.deliveryLongitude || null,
        deliveryNotes: orderData.deliveryNotes || null,
        medications: JSON.stringify(medications),
        status: 'pending',
        totalAmount: '0', // Sera mis à jour par la pharmacie
        prescriptionId: prescriptionId,
        bonDocuments: bonDocumentsInfo.length > 0 ? JSON.stringify(bonDocumentsInfo) : null
      });

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

  // Get orders assigned to the current delivery person (including pending acceptance)
  app.get('/api/orders/my-assigned', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Accès non autorisé - Rôle livreur requis' });
      }

      const assignedOrders = await storage.getMyAssignedOrders(req.session.userId);
      res.json(assignedOrders);
    } catch (error) {
      console.error('Error fetching assigned orders:', error);
      res.status(500).json({ message: 'Failed to fetch assigned orders' });
    }
  });

  // Accept a delivery assignment
  app.post('/api/orders/:orderId/accept', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Accès non autorisé - Rôle livreur requis' });
      }

      const order = await storage.acceptDeliveryAssignment(req.params.orderId, req.session.userId);
      if (!order) {
        return res.status(404).json({ message: 'Commande non trouvée ou assignation expirée' });
      }

      res.json({ message: 'Livraison acceptée avec succès', order });
    } catch (error) {
      console.error('Error accepting delivery assignment:', error);
      res.status(500).json({ message: 'Failed to accept delivery assignment' });
    }
  });

  // Reject a delivery assignment
  app.post('/api/orders/:orderId/reject', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Accès non autorisé - Rôle livreur requis' });
      }

      const success = await storage.rejectDeliveryAssignment(req.params.orderId, req.session.userId, false);
      if (!success) {
        return res.status(404).json({ message: 'Commande non trouvée ou assignation déjà traitée' });
      }

      res.json({ message: 'Livraison refusée avec succès' });
    } catch (error) {
      console.error('Error rejecting delivery assignment:', error);
      res.status(500).json({ message: 'Failed to reject delivery assignment' });
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

  // Get all orders for admin
  app.get('/api/admin/orders', requireAdmin, async (req, res) => {
    try {
      const orders = await storage.getAllOrdersForAdmin();
      res.json(orders);
    } catch (error) {
      console.error('Error fetching admin orders:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  // Update order status (admin)
  app.patch('/api/admin/orders/:orderId/status', requireAdmin, async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Failed to update order status' });
    }
  });

  // Get weekly statistics
  app.get('/api/admin/weekly-stats', requireAdmin, async (req, res) => {
    try {
      const { date } = req.query;
      const weekDate = date ? new Date(date as string) : new Date();
      const stats = await storage.getWeeklyStats(weekDate);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      res.status(500).json({ message: 'Failed to fetch weekly statistics' });
    }
  });

  // Get all pharmacies for admin
  app.get('/api/admin/pharmacies', requireAdmin, async (req, res) => {
    try {
      const pharmacies = await storage.getAllPharmaciesForAdmin();
      res.json(pharmacies);
    } catch (error) {
      console.error('Error fetching admin pharmacies:', error);
      res.status(500).json({ message: 'Failed to fetch pharmacies' });
    }
  });

  // Update pharmacy status
  app.patch('/api/admin/pharmacies/:pharmacyId/status', requireAdmin, async (req, res) => {
    try {
      const { pharmacyId } = req.params;
      const { isActive } = req.body;

      const updatedPharmacy = await storage.updatePharmacy(pharmacyId, { isOpen: isActive });
      if (!updatedPharmacy) {
        return res.status(404).json({ message: 'Pharmacy not found' });
      }

      res.json(updatedPharmacy);
    } catch (error) {
      console.error('Error updating pharmacy status:', error);
      res.status(500).json({ message: 'Failed to update pharmacy status' });
    }
  });

  // Get all delivery personnel for admin
  app.get('/api/admin/delivery-personnel', requireAdmin, async (req, res) => {
    try {
      const personnel = await storage.getAllDeliveryPersonnelForAdmin();
      res.json(personnel);
    } catch (error) {
      console.error('Error fetching delivery personnel:', error);
      res.status(500).json({ message: 'Failed to fetch delivery personnel' });
    }
  });

  // Update delivery person status
  app.patch('/api/admin/delivery-personnel/:deliveryPersonId/status', requireAdmin, async (req, res) => {
    try {
      const { deliveryPersonId } = req.params;
      const { isActive } = req.body;

      const updatedPerson = await storage.updateUser(deliveryPersonId, { isActive });
      if (!updatedPerson) {
        return res.status(404).json({ message: 'Delivery person not found' });
      }

      res.json(updatedPerson);
    } catch (error) {
      console.error('Error updating delivery person status:', error);
      res.status(500).json({ message: 'Failed to update delivery person status' });
    }
  });

  // Admin respond to delivery application
  app.post('/api/admin/delivery-applications/:applicationId/respond', requireAdmin, async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { action } = req.body;

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
      }

      // Get the user making the application
      const user = await storage.getUser(applicationId);
      if (!user || user.role !== 'livreur') {
        return res.status(404).json({ message: 'Delivery person not found' });
      }

      if (!user.appliedPharmacyId) {
        return res.status(400).json({ message: 'No pharmacy application found' });
      }

      const result = await storage.respondToDeliveryApplication(applicationId, action, user.appliedPharmacyId);

      if (!result) {
        return res.status(404).json({ message: 'Application not found' });
      }

      res.json({ message: `Application ${action}d successfully`, result });
    } catch (error) {
      console.error('Error responding to delivery application:', error);
      res.status(500).json({ message: 'Failed to respond to application' });
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

  // Send response to patient (pharmacist)
  app.post('/api/pharmacien/orders/:orderId/send-response', requireAuth, async (req: any, res) => {
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

      console.log('Received medications for order', orderId, ':', medications);

      // Calculate total amount from medication prices
      const totalAmount = medications.reduce((sum: number, med: any) => {
        const price = parseFloat(med.price) || 0;
        const isAvailable = med.available !== false; // Default to true if not specified
        console.log(`Medication ${med.name}: price=${price}, available=${isAvailable}`);
        return sum + (price && isAvailable ? price : 0);
      }, 0);

      console.log('Calculated total amount:', totalAmount);

      // Update order with medication details and total amount
      const updatedOrder = await storage.updateOrderMedications(orderId, medications);
      if (updatedOrder) {
        await storage.updateOrderStatus(orderId, 'confirmed', totalAmount.toString());
      }

      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json({ ...updatedOrder, totalAmount: totalAmount.toString() });
    } catch (error) {
      console.error('Error sending response:', error);
      res.status(500).json({ message: 'Failed to send response' });
    }
  });

  // Process payment for order
  app.post('/api/orders/payment', requireAuth, async (req: any, res) => {
    try {
      const { orderId, paymentMethod, amount, deliveryFee, transactionId, selectedMedications } = req.body;

      if (!orderId || !paymentMethod || !amount) {
        return res.status(400).json({ message: 'Missing required payment information' });
      }

      // Mettre à jour la commande avec seulement les médicaments sélectionnés
      if (selectedMedications && selectedMedications.length > 0) {
        await storage.updateOrderMedications(orderId, selectedMedications);
      }

      // Update order status to ready_for_delivery after payment
      const updatedOrder = await storage.updateOrderStatus(orderId, 'ready_for_delivery', amount);

      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Log payment information
      console.log('Payment processed:', {
        orderId,
        paymentMethod,
        amount,
        deliveryFee,
        transactionId,
        timestamp: new Date().toISOString()
      });

      res.json({
        message: 'Payment processed successfully',
        order: updatedOrder,
        paymentDetails: {
          method: paymentMethod,
          amount,
          deliveryFee,
          transactionId
        }
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ message: 'Failed to process payment' });
    }
  });

  // Cancel order
  app.post('/api/orders/:orderId/cancel', requireAuth, async (req: any, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.session.userId;

      // Check if user owns the order
      const order = await storage.getOrderById(orderId);
      if (!order || order.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Only allow cancellation for certain statuses
      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({ message: 'Cannot cancel order at this stage' });
      }

      const updatedOrder = await storage.updateOrderStatus(orderId, 'cancelled');

      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json({ message: 'Order cancelled successfully', order: updatedOrder });
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ message: 'Failed to cancel order' });
    }
  });

  // Delete order permanently (complete removal from database)
  app.delete('/api/orders/:orderId', requireAuth, async (req: any, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.session.userId;

      // Check if user owns the order
      const order = await storage.getOrderById(orderId);
      if (!order || order.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Delete the order permanently from database
      const deleted = await storage.deleteOrder(orderId);

      if (!deleted) {
        return res.status(404).json({ message: 'Order not found' });
      }

      console.log(`Order ${orderId} permanently deleted by user ${userId}`);
      res.json({ message: 'Order permanently deleted from database' });
    } catch (error) {
      console.error('Error deleting order permanently:', error);
      res.status(500).json({ message: 'Failed to delete order' });
    }
  });

  // Get delivery orders assigned to this livreur
  app.get('/api/livreur/deliveries', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Use the new method that includes pending assignments and timeout checking
      const myDeliveries = await storage.getMyAssignedOrders(user.id);

      res.json(myDeliveries);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      res.status(500).json({ message: 'Failed to fetch deliveries' });
    }
  });

  // Get available deliveries (not assigned to anyone yet)
  app.get('/api/livreur/available-deliveries', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Get only orders that are preparing (ready for assignment) but not assigned to anyone
      const allDeliveries = await storage.getDeliveryOrders();
      const availableDeliveries = allDeliveries.filter(delivery => 
        delivery.status === 'preparing' && !delivery.deliveryPersonId
      );

      res.json(availableDeliveries);
    } catch (error) {
      console.error('Error fetching available deliveries:', error);
      res.status(500).json({ message: 'Failed to fetch available deliveries' });
    }
  });

  // Accept delivery assignment (livreur)
  app.post('/api/livreur/deliveries/:orderId/accept', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { orderId } = req.params;
      const updatedOrder = await storage.acceptDeliveryAssignment(orderId, user.id);

      if (!updatedOrder) {
        return res.status(400).json({ message: 'Cannot accept this delivery - it may have expired or was not assigned to you' });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error accepting delivery:', error);
      res.status(500).json({ message: 'Failed to accept delivery' });
    }
  });

  // Reject delivery assignment (livreur)
  app.post('/api/livreur/deliveries/:orderId/reject', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { orderId } = req.params;
      const success = await storage.rejectDeliveryAssignment(orderId, user.id);

      if (!success) {
        return res.status(400).json({ message: 'Cannot reject this delivery - it was not assigned to you' });
      }

      res.json({ message: 'Delivery rejected successfully' });
    } catch (error) {
      console.error('Error rejecting delivery:', error);
      res.status(500).json({ message: 'Failed to reject delivery' });
    }
  });

  // Update delivery status (livreur) - only allows changing to 'in_delivery'
  app.post('/api/livreur/deliveries/:orderId/status', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { orderId } = req.params;
      const { status } = req.body;

      // Les livreurs peuvent commencer la livraison ou marquer arrivé sur place
      if (!['in_delivery', 'arrived_pending_confirmation'].includes(status)) {
        return res.status(403).json({ message: 'Invalid status for delivery person' });
      }

      // Vérifier que la commande est assignée à ce livreur
      const order = await storage.getOrderById(orderId);
      if (!order || order.deliveryPersonId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating delivery status:', error);
      res.status(500).json({ message: 'Failed to update delivery status' });
    }
  });



  // Delivery person confirms arrival at delivery location
  app.post('/api/deliveries/:deliveryId/confirm-arrival', requireAuth, async (req: any, res) => {
    try {
      const { deliveryId } = req.params;
      const userId = req.session.userId;

      // Vérifier que l'utilisateur est bien un livreur
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Vérifier que la commande est assignée à ce livreur et en transit
      const order = await storage.getOrderById(deliveryId);
      if (!order || order.deliveryPersonId !== userId || order.status !== 'in_transit') {
        return res.status(403).json({ message: 'Access denied or invalid status' });
      }

      // Mettre à jour le statut en attente de confirmation du patient
      const updatedOrder = await storage.updateOrderStatus(deliveryId, 'arrived_pending_confirmation');

      // Notifier le patient de l'arrivée du livreur
      if (updatedOrder) {
        await storage.createNotification({
          userId: order.userId,
          title: 'Livreur arrivé',
          body: 'Votre livreur est arrivé ! Confirmez la réception de votre commande.',
          type: 'delivery_arrived',
          orderId: deliveryId,
          isRead: false
        });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error confirming arrival:', error);
      res.status(500).json({ message: 'Failed to confirm arrival' });
    }
  });

  // Patient confirms delivery completion
  app.post('/api/orders/:orderId/confirm-delivery-completion', requireAuth, async (req: any, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.session.userId;

      // Vérifier que l'utilisateur est le propriétaire de la commande
      const order = await storage.getOrderById(orderId);
      if (!order || order.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Accepter plusieurs statuts pour la confirmation de livraison
      if (!['arrived_pending_confirmation', 'in_transit', 'in_delivery'].includes(order.status)) {
        return res.status(400).json({ message: 'Order is not ready for delivery confirmation' });
      }

      const updatedOrder = await storage.confirmDeliveryCompletion(orderId);
      res.json({ message: 'Delivery confirmed successfully', order: updatedOrder });
    } catch (error) {
      console.error('Error confirming delivery:', error);
      res.status(500).json({ message: 'Failed to confirm delivery' });
    }
  });

  // Legacy endpoint for backward compatibility
  app.post('/api/orders/:orderId/confirm-delivery', requireAuth, async (req: any, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.session.userId;

      // Vérifier que l'utilisateur est le propriétaire de la commande
      const order = await storage.getOrderById(orderId);
      if (!order || order.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Accepter plusieurs statuts pour la confirmation de livraison
      if (!['arrived_pending_confirmation', 'in_transit', 'in_delivery'].includes(order.status)) {
        return res.status(400).json({ message: 'Order is not ready for delivery confirmation' });
      }

      const updatedOrder = await storage.confirmDeliveryCompletion(orderId);
      res.json({ message: 'Delivery confirmed successfully', order: updatedOrder });
    } catch (error) {
      console.error('Error confirming delivery:', error);
      res.status(500).json({ message: 'Failed to confirm delivery' });
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

  // Pharmacy profile routes
  // Note: GET route is intercepted by Vite middleware in development, using PUT with empty body as workaround

  app.put('/api/pharmacies/my-pharmacy', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== 'pharmacien') {
        return res.status(403).json({ message: 'Accès refusé' });
      }

      // If no body data, act as a GET request (workaround for Vite middleware issue)
      const pharmacyData = req.body;
      if (!pharmacyData || Object.keys(pharmacyData).length === 0) {
        console.log('PUT request with no data - acting as GET request');

        // Same logic as GET route
        let pharmacy = null;

        // Try to get pharmacy by pharmacyId from user
        if (user.pharmacyId) {
          pharmacy = await storage.getPharmacy(user.pharmacyId);
          console.log('Pharmacy found by pharmacyId:', pharmacy ? pharmacy.id : 'not found');
        }

        // If not found, try the old method (fallback)
        if (!pharmacy) {
          pharmacy = await storage.getPharmacyByUserId(req.session.userId!);
          console.log('Pharmacy found by userId method:', pharmacy ? pharmacy.id : 'not found');

          // If found by old method, update user with pharmacyId
          if (pharmacy) {
            await storage.updateUser(req.session.userId!, { pharmacyId: pharmacy.id });
            console.log('Updated user with pharmacyId:', pharmacy.id);
          }
        }

        // Last resort: search by phone number directly
        if (!pharmacy) {
          const allPharmacies = await storage.getPharmacies();
          pharmacy = allPharmacies.find(p => p.phone === user.phone);
          console.log('Pharmacy found by phone search:', pharmacy ? pharmacy.id : 'not found');

          // If found, update user with pharmacyId
          if (pharmacy) {
            await storage.updateUser(req.session.userId!, { pharmacyId: pharmacy.id });
            console.log('Updated user with pharmacyId from phone search:', pharmacy.id);
          }
        }

        if (!pharmacy) {
          console.log('No pharmacy found for user. All pharmacies:', await storage.getPharmacies());
          return res.status(404).json({ message: 'Pharmacy not found' });
        }

        console.log('Returning pharmacy via PUT-as-GET:', pharmacy.id);
        return res.json(pharmacy);
      }

      console.log('Updating pharmacy with data:', pharmacyData);

      // Try to find existing pharmacy by pharmacyId first, then fallback to ownerId
      let pharmacy = null;
      if (user.pharmacyId) {
        pharmacy = await storage.getPharmacy(user.pharmacyId);
        console.log('Found pharmacy by pharmacyId:', pharmacy?.id);
      }

      // Skip the phone matching search - always create new pharmacy if pharmacyId not set
      if (!pharmacy && !user.pharmacyId) {
        console.log('No pharmacyId set for user - will create new pharmacy');
      }

      if (pharmacy) {
        // Update existing pharmacy
        console.log('Updating existing pharmacy:', pharmacy.id);
        const updatedPharmacy = await storage.updatePharmacy(pharmacy.id, pharmacyData);

        // Ensure user has the pharmacyId
        if (!user.pharmacyId) {
          console.log('Updating user with pharmacyId:', pharmacy.id);
          await storage.updateUser(req.session.userId!, { pharmacyId: pharmacy.id });
        }

        console.log('Pharmacy updated successfully:', updatedPharmacy);
        res.json(updatedPharmacy);
      } else {
        // Before creating new pharmacy, check if there's already one with same phone
        const allPharmacies = await storage.getPharmacies();
        const existingByPhone = allPharmacies.find(p => 
          p.phone === pharmacyData.phone || p.phone === user.phone
        );

        if (existingByPhone) {
          console.log('Found existing pharmacy by phone, updating instead of creating:', existingByPhone.id);
          const updatedPharmacy = await storage.updatePharmacy(existingByPhone.id, pharmacyData);

          // Update user with the existing pharmacy ID
          await storage.updateUser(req.session.userId!, { pharmacyId: existingByPhone.id });

          console.log('Existing pharmacy updated successfully:', updatedPharmacy);
          res.json(updatedPharmacy);
        } else {
          // Create new pharmacy only if no existing one found
          console.log('Creating new pharmacy for user:', req.session.userId);
          const newPharmacy = await storage.createPharmacy({
            ...pharmacyData,
            ownerId: req.session.userId!,
            rating: pharmacyData.rating || 4.5,
            reviewCount: pharmacyData.reviewCount || 0,
            isOpen: pharmacyData.isOpen !== undefined ? pharmacyData.isOpen : true,
            openingHours: pharmacyData.openingHours || {
              monday: { open: '08:00', close: '19:00' },
              tuesday: { open: '08:00', close: '19:00' },
              wednesday: { open: '08:00', close: '19:00' },
              thursday: { open: '08:00', close: '19:00' },
              friday: { open: '08:00', close: '19:00' },
              saturday: { open: '08:00', close: '17:00' },
              sunday: { open: '09:00', close: '15:00' }
            }
          });

          // Update user with the new pharmacy ID
          console.log('Updating user with new pharmacyId:', newPharmacy.id);
          await storage.updateUser(req.session.userId!, { pharmacyId: newPharmacy.id });

          console.log('New pharmacy created successfully:', newPharmacy);
          res.json(newPharmacy);
        }
      }
    } catch (error) {
      console.error('Error updating pharmacy:', error);
      res.status(500).json({ message: 'Erreur lors de la mise à jour de la pharmacie' });
    }
  });

  // Get available delivery personnel for pharmacists (filtered by pharmacy)
  app.get('/api/pharmacien/delivery-personnel', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'pharmacien') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Get pharmacist's pharmacy ID
      let pharmacyId = user.pharmacyId;

      // If no pharmacyId set, try to find pharmacy by phone or auto-create
      if (!pharmacyId) {
        const pharmacy = await storage.getPharmacyByUserId(req.session.userId);
        if (pharmacy) {
          pharmacyId = pharmacy.id;
          // Update user with pharmacy ID for future reference
          await storage.updateUser(req.session.userId, { pharmacyId });
        } else {
          return res.status(400).json({ message: 'Pharmacist not associated with any pharmacy' });
        }
      }

      console.log(`🔍 Fetching delivery personnel for pharmacy: ${pharmacyId}`);

      // Get only delivery personnel associated with this pharmacy
      const deliveryPersonnel = await storage.getAvailableDeliveryPersonnelForPharmacy(pharmacyId);

      console.log(`📋 Found ${deliveryPersonnel.length} delivery personnel for pharmacy ${pharmacyId}`);
      console.log('Delivery personnel:', deliveryPersonnel.map(p => ({ 
        id: p.id, 
        name: `${p.firstName} ${p.lastName}`, 
        pharmacyId: p.pharmacyId,
        deliveryApplicationStatus: p.deliveryApplicationStatus
      })));

      res.json(deliveryPersonnel);
    } catch (error) {
      console.error('Error fetching delivery personnel:', error);
      res.status(500).json({ message: 'Failed to fetch delivery personnel' });
    }
  });

  // Nouvelle API : Candidature complète avec documents
  app.post('/api/delivery/apply', requireAuth, uploadDeliveryDocs.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'drivingLicense', maxCount: 1 },
    { name: 'cvDocument', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { pharmacyId, motivationLetter, experience, availability, phone } = req.body;

      if (!pharmacyId || !motivationLetter || !experience || !availability || !phone) {
        return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
      }

      // Vérifier que la pharmacie existe
      const pharmacy = await storage.getPharmacy(pharmacyId);
      if (!pharmacy) {
        return res.status(404).json({ message: 'Pharmacy not found' });
      }

      // Traitement des fichiers uploadés
      let idDocumentUrl = null;
      let drivingLicenseUrl = null;
      let cvDocumentUrl = null;

      if (req.files) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (files['idDocument'] && files['idDocument'][0]) {
          const idDoc = files['idDocument'][0];
          idDocumentUrl = `data:${idDoc.mimetype};base64,${idDoc.buffer.toString('base64')}`;
          console.log('ID Document uploaded for delivery application:', idDoc.originalname);
        }

        if (files['drivingLicense'] && files['drivingLicense'][0]) {
          const drivingDoc = files['drivingLicense'][0];
          drivingLicenseUrl = `data:${drivingDoc.mimetype};base64,${drivingDoc.buffer.toString('base64')}`;
          console.log('Driving License uploaded for delivery application:', drivingDoc.originalname);
        }

        if (files['cvDocument'] && files['cvDocument'][0]) {
          const cvDoc = files['cvDocument'][0];
          cvDocumentUrl = `data:${cvDoc.mimetype};base64,${cvDoc.buffer.toString('base64')}`;
          console.log('CV Document uploaded for delivery application:', cvDoc.originalname);
        }
      }

      // Vérifier si le numéro de téléphone est déjà utilisé par un autre utilisateur
      if (phone && phone !== user.phone) {
        const existingUserWithPhone = await storage.getUserByPhone(phone);
        if (existingUserWithPhone && existingUserWithPhone.id !== user.id) {
          return res.status(400).json({ 
            message: 'Ce numéro de téléphone est déjà utilisé par un autre utilisateur' 
          });
        }
      }

      // Préparer les données à mettre à jour
      const updateData: any = {
        appliedPharmacyId: pharmacyId,
        deliveryApplicationStatus: 'pending',
        motivationLetter: motivationLetter,
        experience: experience,
        availability: availability
      };

      // Mettre à jour les documents seulement s'ils sont fournis
      if (idDocumentUrl) {
        updateData.idDocumentUrl = idDocumentUrl;
      }
      if (drivingLicenseUrl) {
        updateData.drivingLicenseUrl = drivingLicenseUrl;
      }
      if (cvDocumentUrl) {
        updateData.professionalDocumentUrl = cvDocumentUrl;
      }

      // Ne mettre à jour le téléphone que s'il est différent de l'existant
      if (phone && phone !== user.phone) {
        updateData.phone = phone;
      }

      // Mettre à jour le profil du livreur avec toutes les informations
      const updatedUser = await storage.updateUser(req.session.userId, updateData);

      // Créer une notification pour le pharmacien propriétaire de la pharmacie
      try {
        const pharmacyOwner = await storage.getPharmacyOwner(pharmacyId);
        if (pharmacyOwner) {
          await storage.createNotification({
            userId: pharmacyOwner.id,
            title: 'Nouvelle candidature livreur',
            body: `${user.firstName} ${user.lastName} a envoyé une candidature complète avec documents`,
            type: 'delivery_application',
            isRead: false,
          });
          console.log('Notification created for pharmacy owner:', pharmacyOwner.id);
        } else {
          console.log('No pharmacy owner found for pharmacy:', pharmacyId);
        }
      } catch (notificationError) {
        console.log('Notification creation failed (non-critical):', notificationError);
      }

      res.json({ 
        message: 'Candidature envoyée avec succès', 
        user: updatedUser,
        documents: {
          idDocument: !!idDocumentUrl,
          drivingLicense: !!drivingLicenseUrl,
          cvDocument: !!cvDocumentUrl
        }
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      res.status(500).json({ message: 'Erreur lors de l\'envoi de la candidature' });
    }
  });

  // Livreur postule à une pharmacie (ancienne API, gardée pour compatibilité)
  app.post('/api/livreur/apply-to-pharmacy', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { pharmacyId } = req.body;
      if (!pharmacyId) {
        return res.status(400).json({ message: 'pharmacyId is required' });
      }

      // Vérifier que la pharmacie existe
      const pharmacy = await storage.getPharmacy(pharmacyId);
      if (!pharmacy) {
        return res.status(404).json({ message: 'Pharmacy not found' });
      }

      // Mettre à jour le statut de candidature du livreur
      const updatedUser = await storage.updateUser(req.session.userId, {
        appliedPharmacyId: pharmacyId,
        deliveryApplicationStatus: 'pending'
      });

      // Créer une notification pour la pharmacie
      const pharmacyOwner = await storage.getPharmacyOwner(pharmacyId);
      if (pharmacyOwner) {
        await storage.createNotification({
          userId: pharmacyOwner.id,
          title: 'Nouvelle candidature livreur',
          body: `${user.firstName} ${user.lastName} souhaite rejoindre votre équipe de livraison`,
          type: 'delivery_application',
          isRead: false,
        });
      }

      res.json({ message: 'Application sent successfully', user: updatedUser });
    } catch (error) {
      console.error('Error applying to pharmacy:', error);
      res.status(500).json({ message: 'Failed to apply to pharmacy' });
    }
  });

  // Pharmacien gère les candidatures de livreurs
  app.get('/api/pharmacien/delivery-applications', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      console.log('🏥 Pharmacien requesting applications:', {
        userId: req.session.userId,
        userRole: user?.role,
        pharmacyId: user?.pharmacyId
      });

      if (!user || user.role !== 'pharmacien') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Récupérer la pharmacie du pharmacien
      let pharmacy = null;
      if (user.pharmacyId) {
        pharmacy = await storage.getPharmacy(user.pharmacyId);
      }

      // Fallback: chercher par téléphone si pas de pharmacyId
      if (!pharmacy) {
        const allPharmacies = await storage.getPharmacies();
        pharmacy = allPharmacies.find(p => p.phone === user.phone);

        if (pharmacy) {
          // Mettre à jour l'utilisateur avec l'ID de pharmacie
          await storage.updateUser(req.session.userId, { pharmacyId: pharmacy.id });
          console.log('📋 Pharmacie trouvée par téléphone et mise à jour:', pharmacy.id);
        }
      }

      if (!pharmacy) {
        console.log('❌ Aucune pharmacie trouvée pour le pharmacien');
        return res.status(404).json({ message: 'Pharmacy not found' });
      }

      console.log('㈠ Pharmacie trouvée:', {
        id: pharmacy.id,
        name: pharmacy.name,
        phone: pharmacy.phone
      });

      const applications = await storage.getDeliveryApplicationsForPharmacy(pharmacy.id);
      console.log(`📬 Retour de ${applications.length} candidatures`);

      res.json(applications);
    } catch (error) {
      console.error('Error fetching delivery applications:', error);
      res.status(500).json({ message: 'Failed to fetch delivery applications' });
    }
  });

  // Pharmacien accepte ou rejette une candidature
  app.post('/api/pharmacien/delivery-applications/:applicationId/respond', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'pharmacien') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { applicationId } = req.params;
      const { action } = req.body; // 'approve' ou 'reject'

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
      }

      const result = await storage.respondToDeliveryApplication(applicationId, action, user.pharmacyId);

      if (!result) {
        return res.status(404).json({ message: 'Application not found' });
      }

      res.json({ message: `Application ${action}d successfully`, result });
    } catch (error) {
      console.error('Error responding to delivery application:', error);
      res.status(500).json({ message: 'Failed to respond to application' });
    }
  });

  // Get delivery application status for the current user
  app.get('/api/delivery/application-status', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const applicationStatus = {
        status: user.deliveryApplicationStatus || 'none',
        appliedPharmacyId: user.appliedPharmacyId,
        appliedAt: user.updatedAt,
        documents: {
          idDocument: !!user.idDocumentUrl,
          drivingLicense: !!user.drivingLicenseUrl,
          cv: !!user.professionalDocumentUrl,
        }
      };

      res.json(applicationStatus);
    } catch (error) {
      console.error('Error fetching application status:', error);
      res.status(500).json({ message: 'Failed to fetch application status' });
    }
  });

  // Cancel delivery application
  app.post('/api/livreur/cancel-application', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'livreur') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Check if user has an active pending application
      if (!user.appliedPharmacyId || user.deliveryApplicationStatus !== 'pending') {
        return res.status(400).json({ message: 'No active application to cancel' });
      }

      // Reset application status
      const updatedUser = await storage.updateUser(req.session.userId, {
        appliedPharmacyId: undefined,
        deliveryApplicationStatus: 'none'
      });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create notification for user
      await storage.createNotification({
        userId: req.session.userId,
        title: 'Candidature annulée',
        body: 'Votre candidature a été annulée avec succès. Vous pouvez maintenant postuler ailleurs.',
        type: 'application_cancelled',
        isRead: false,
      });

      res.json({ 
        message: 'Application cancelled successfully', 
        user: updatedUser 
      });
    } catch (error) {
      console.error('Error cancelling application:', error);
      res.status(500).json({ message: 'Failed to cancel application' });
    }
  });

  // Admin: Suspend/Activate any user
  app.patch('/api/admin/users/:userId/status', requireAuth, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.session.userId);
      if (!adminUser || adminUser.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied - Admin only' });
      }

      const { userId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive must be a boolean' });
      }

      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prevent admin from suspending themselves
      if (userId === req.session.userId) {
        return res.status(400).json({ message: 'Cannot suspend your own account' });
      }

      const updatedUser = await storage.updateUser(userId, { isActive });
      if (!updatedUser) {
        return res.status(404).json({ message: 'Failed to update user' });
      }

      // Create notification for the affected user
      await storage.createNotification({
        userId: userId,
        title: isActive ? 'Compte réactivé' : 'Compte suspendu',
        body: isActive 
          ? 'Votre compte a été réactivé par l\'administration. Vous pouvez maintenant accéder à toutes les fonctionnalités.'
          : 'Votre compte a été suspendu par l\'administration. Contactez le support pour plus d\'informations.',
        type: isActive ? 'account_activated' : 'account_suspended',
        isRead: false,
      });

      res.json({ 
        message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
        user: updatedUser 
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: 'Failed to update user status' });
    }
  });

  // Admin: Get all users for management
  app.get('/api/admin/users', requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const users = await storage.getUsers();

      // Remove sensitive information and exclude admin users from the list
      const safeUsers = users
        .filter(user => user.role !== 'admin')
        .map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: user.address,
          role: user.role,
          isActive: user.isActive,
          verificationStatus: user.verificationStatus,
          deliveryApplicationStatus: user.deliveryApplicationStatus,
          createdAt: user.createdAt,
          pharmacyId: user.pharmacyId
        }));

      res.json(safeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Assign delivery person to order
  app.post('/api/pharmacien/orders/:orderId/assign-delivery', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'pharmacien') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { orderId } = req.params;
      const { deliveryPersonId } = req.body;

      if (!deliveryPersonId) {
        return res.status(400).json({ message: 'deliveryPersonId is required' });
      }

      const updatedOrder = await storage.assignDeliveryPerson(orderId, deliveryPersonId);
      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error assigning delivery person:', error);
      res.status(500).json({ message: 'Failed to assign delivery person' });
    }
  });

  // Fire delivery person from pharmacy
  app.post('/api/pharmacien/fire-delivery-person/:deliveryPersonId', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'pharmacien') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { deliveryPersonId } = req.params;

      // Get the delivery person to verify they're assigned to this pharmacy
      const deliveryPerson = await storage.getUser(deliveryPersonId);
      if (!deliveryPerson || deliveryPerson.role !== 'livreur') {
        return res.status(404).json({ message: 'Delivery person not found' });
      }

      // Verify the delivery person is assigned to this pharmacist's pharmacy
      if (deliveryPerson.pharmacyId !== user.pharmacyId) {
        return res.status(403).json({ message: 'This delivery person is not assigned to your pharmacy' });
      }

      // Remove the delivery person from the pharmacy
      const updatedDeliveryPerson = await storage.updateUser(deliveryPersonId, {
        pharmacyId: null,
        deliveryApplicationStatus: 'none'
      });

      if (!updatedDeliveryPerson) {
        return res.status(404).json({ message: 'Failed to update delivery person' });
      }

      // Create notification for the delivery person
      await storage.createNotification({
        userId: deliveryPersonId,
        title: 'Fin de contrat',
        body: 'Votre contrat avec la pharmacie a pris fin. Vous pouvez maintenant postuler ailleurs.',
        type: 'employment_terminated',
        isRead: false,
      });

      console.log(`Delivery person ${deliveryPerson.firstName} ${deliveryPerson.lastName} fired from pharmacy ${user.pharmacyId}`);

      res.json({ 
        message: 'Delivery person fired successfully', 
        deliveryPerson: updatedDeliveryPerson 
      });
    } catch (error) {
      console.error('Error firing delivery person:', error);
      res.status(500).json({ message: 'Failed to fire delivery person' });
    }
  });

  // Get delivery person info with vehicle and profile
  app.get('/api/delivery-person/:deliveryPersonId', requireAuth, async (req: any, res) => {
    try {
      const { deliveryPersonId } = req.params;

      const deliveryPersonInfo = await storage.getDeliveryPersonWithVehicleAndProfile(deliveryPersonId);

      if (!deliveryPersonInfo) {
        return res.status(404).json({ message: 'Delivery person not found' });
      }

      res.json(deliveryPersonInfo);
    } catch (error) {
      console.error('Error fetching delivery person info:', error);
      res.status(500).json({ message: 'Failed to fetch delivery person info' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}