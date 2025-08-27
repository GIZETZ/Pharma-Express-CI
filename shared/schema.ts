import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  phone: varchar("phone").notNull().unique(),
  email: varchar("email"),
  address: varchar("address").notNull(),
  password: varchar("password").notNull(), // Mot de passe haché
  role: varchar("role").notNull().default("patient"), // patient, pharmacien, livreur, admin
  language: varchar("language").default("fr"),
  profileImageUrl: text("profile_image_url"),
  pharmacyId: varchar("pharmacy_id").references(() => pharmacies.id), // Pour les pharmaciens et livreurs
  isActive: boolean("is_active").default(true),
  // Champs pour validation d'identité (Pharmaciens et Livreurs)
  idDocumentUrl: text("id_document_url"), // Carte d'identité
  professionalDocumentUrl: text("professional_document_url"), // Diplôme pharmacien
  drivingLicenseUrl: text("driving_license_url"), // Permis de conduire
  verificationStatus: varchar("verification_status").default("pending"), // pending, approved, rejected
  deliveryApplicationStatus: varchar("delivery_application_status").default("none"), // none, pending, approved, rejected (pour livreurs)
  appliedPharmacyId: varchar("applied_pharmacy_id").references(() => pharmacies.id), // Pharmacie à laquelle le livreur a postulé
  // Champs GPS avancés pour tracking haute précision (livreurs)
  lat: decimal("lat", { precision: 10, scale: 8 }), // Latitude GPS actuelle
  lng: decimal("lng", { precision: 11, scale: 8 }), // Longitude GPS actuelle
  speed: decimal("speed", { precision: 5, scale: 2 }), // Vitesse en km/h
  bearing: decimal("bearing", { precision: 5, scale: 2 }), // Direction/cap en degrés (0-360)
  accuracy: decimal("accuracy", { precision: 6, scale: 2 }), // Précision GPS en mètres
  lastLocationUpdate: timestamp("last_location_update"), // Dernière mise à jour GPS
  isActiveTracking: boolean("is_active_tracking").default(false), // Si le livreur est en mode tracking actif
  // Champs livreur consolidés (anciennement dans delivery_profiles et delivery_vehicles)
  emergencyContactName: varchar("emergency_contact_name"), // Contact d'urgence
  emergencyContactPhone: varchar("emergency_contact_phone"), // Téléphone d'urgence
  bankAccountNumber: varchar("bank_account_number"), // Compte bancaire pour paiements
  rating: decimal("rating", { precision: 2, scale: 1 }).default("5.0"), // Note du livreur
  totalDeliveries: varchar("total_deliveries").default("0"), // Nombre de livraisons effectuées
  isAvailable: boolean("is_available").default(true), // Disponibilité actuelle
  currentOrderId: varchar("current_order_id"), // Commande en cours (foreign key will be added later)
  // Informations du véhicule (pour livreurs)
  vehicleType: varchar("vehicle_type"), // moto, scooter, voiture, vélo, tricycle
  vehicleBrand: varchar("vehicle_brand"), // Yamaha, Honda, Toyota, etc.
  vehicleModel: varchar("vehicle_model"), // Modèle du véhicule
  vehicleColor: varchar("vehicle_color"), // Couleur du véhicule
  vehicleLicensePlate: varchar("vehicle_license_plate"), // Plaque d'immatriculation (TRÈS VISIBLE)
  vehicleInsuranceNumber: varchar("vehicle_insurance_number"), // Numéro d'assurance
  vehicleRegistrationDocumentUrl: text("vehicle_registration_document_url"), // Carte grise
  vehicleInsuranceDocumentUrl: text("vehicle_insurance_document_url"), // Attestation d'assurance
  vehicleVerificationStatus: varchar("vehicle_verification_status").default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pharmacies = pgTable("pharmacies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  phone: varchar("phone"),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0.0"),
  reviewCount: varchar("review_count").default("0"),
  deliveryTime: varchar("delivery_time", { length: 10 }),
  isOpen: boolean("is_open").default(true),
  isEmergency24h: boolean("is_emergency_24h").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  imageUrl: text("image_url").notNull(),
  status: varchar("status").default("pending"), // pending, processed, fulfilled
  medications: jsonb("medications"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  pharmacyId: varchar("pharmacy_id").references(() => pharmacies.id).notNull(),
  prescriptionId: varchar("prescription_id").references(() => prescriptions.id),
  status: varchar("status").default("pending"), // pending, confirmed, preparing, assigned_pending_acceptance, in_transit, arrived_pending_confirmation, delivered, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryLatitude: decimal("delivery_latitude", { precision: 10, scale: 8 }),
  deliveryLongitude: decimal("delivery_longitude", { precision: 11, scale: 8 }),
  deliveryNotes: text("delivery_notes"),
  medications: jsonb("medications"), // Array of {name: string, surBon: boolean}
  bonDocuments: text("bon_documents"), // Reference to uploaded documents
  estimatedDelivery: timestamp("estimated_delivery"),
  deliveredAt: timestamp("delivered_at"),
  deliveryPersonId: varchar("delivery_person_id"),
  assignedAt: timestamp("assigned_at"), // Timestamp pour l'assignation et calcul du timeout
  // Double confirmation system
  deliveryPersonConfirmedAt: timestamp("delivery_person_confirmed_at"), // Quand le livreur confirme être arrivé
  patientConfirmedAt: timestamp("patient_confirmed_at"), // Quand le patient confirme avoir reçu
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tables supprimées - informations consolidées dans users

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: varchar("type").notNull(), // order_update, delivery, promotion, etc.
  orderId: varchar("order_id").references(() => orders.id),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetCodes = pgTable("password_reset_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  idDocumentUrl: z.string().optional(),
  professionalDocumentUrl: z.string().optional(),
  drivingLicenseUrl: z.string().optional(),
  deliveryApplicationStatus: z.enum(["none", "pending", "approved", "rejected"]).optional(),
  appliedPharmacyId: z.string().optional(),
});

// Auth schemas
export const registerSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  idDocumentUrl: true,
  professionalDocumentUrl: true,
  drivingLicenseUrl: true,
  verificationStatus: true,
}).extend({
  email: z.string().email("Adresse email invalide"),
  confirmPassword: z.string().min(6),
  role: z.enum(["patient", "pharmacien", "livreur", "admin"]).default("patient"),
  // Files pour validation d'identité (optionnels mais requis selon le rôle)
  idDocument: z.any().optional(),
  professionalDocument: z.any().optional(),
  drivingLicense: z.any().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  phone: z.string().min(1, "Le numéro de téléphone est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export const insertPharmacySchema = createInsertSchema(pharmacies).omit({
  id: true,
  createdAt: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetCodeSchema = createInsertSchema(passwordResetCodes).omit({
  id: true,
  createdAt: true,
});

// Password reset schemas
export const requestPasswordResetSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const verifyResetCodeSchema = z.object({
  email: z.string().email("Email invalide"),
  code: z.string().length(6, "Le code doit contenir 6 chiffres"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
  code: z.string().length(6, "Le code doit contenir 6 chiffres"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string().min(6, "Confirmez votre mot de passe"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

// Schémas supprimés - informations consolidées dans users

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Pharmacy = typeof pharmacies.$inferSelect;
export type InsertPharmacy = z.infer<typeof insertPharmacySchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Removed DeliveryPerson type - using User type with role='livreur' instead

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type PasswordResetCode = typeof passwordResetCodes.$inferSelect;
export type InsertPasswordResetCode = z.infer<typeof insertPasswordResetCodeSchema>;

// Types supprimés - informations consolidées dans users