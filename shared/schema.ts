import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  phone: varchar("phone").notNull().unique(),
  address: varchar("address").notNull(),
  password: varchar("password").notNull(), // Mot de passe haché
  role: varchar("role").notNull().default("patient"), // patient, pharmacien, livreur, admin
  language: varchar("language").default("fr"),
  profileImageUrl: text("profile_image_url"),
  pharmacyId: varchar("pharmacy_id").references(() => pharmacies.id), // Pour les pharmaciens
  isActive: boolean("is_active").default(true),
  // Champs pour validation d'identité (Pharmaciens et Livreurs)
  idDocumentUrl: text("id_document_url"), // Carte d'identité
  professionalDocumentUrl: text("professional_document_url"), // Diplôme pharmacien
  drivingLicenseUrl: text("driving_license_url"), // Permis de conduire
  verificationStatus: varchar("verification_status").default("pending"), // pending, approved, rejected
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
  deliveryTime: varchar("delivery_time").default("30"),
  isOpen: boolean("is_open").default(true),
  openingHours: jsonb("opening_hours"),
  createdAt: timestamp("created_at").defaultNow(),
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
  status: varchar("status").default("pending"), // pending, confirmed, preparing, in_transit, delivered, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryNotes: text("delivery_notes"),
  estimatedDelivery: timestamp("estimated_delivery"),
  deliveredAt: timestamp("delivered_at"),
  deliveryPersonId: varchar("delivery_person_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deliveryPersons = pgTable("delivery_persons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: varchar("phone").notNull(),
  currentLatitude: decimal("current_latitude", { precision: 10, scale: 8 }),
  currentLongitude: decimal("current_longitude", { precision: 11, scale: 8 }),
  isAvailable: boolean("is_available").default(true),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("5.0"),
  createdAt: timestamp("created_at").defaultNow(),
});

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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Pharmacy = typeof pharmacies.$inferSelect;
export type InsertPharmacy = z.infer<typeof insertPharmacySchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type DeliveryPerson = typeof deliveryPersons.$inferSelect;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;