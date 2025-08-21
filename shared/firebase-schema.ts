import { z } from "zod";

// Firebase-compatible schemas (without Drizzle-specific features)

// User schema for Firestore
export const userSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  address: z.string(),
  password: z.string(), // Hashed password
  role: z.enum(["patient", "pharmacien", "livreur", "admin"]).default("patient"),
  language: z.string().default("fr"),
  profileImageUrl: z.string().optional(),
  pharmacyId: z.string().optional(), // For pharmacists and approved delivery persons
  isActive: z.boolean().default(true),
  // Identity validation fields (Pharmacists and Delivery personnel)
  idDocumentUrl: z.string().optional(), // ID card
  professionalDocumentUrl: z.string().optional(), // Pharmacist diploma
  drivingLicenseUrl: z.string().optional(), // Driving license
  verificationStatus: z.enum(["pending", "approved", "rejected"]).default("pending"),
  // Delivery application fields
  deliveryApplicationStatus: z.enum(["none", "pending", "approved", "rejected"]).default("none").optional(),
  appliedPharmacyId: z.string().optional(), // Pharmacy the delivery person applied to
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Pharmacy schema
export const pharmacySchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  rating: z.number().default(0.0),
  deliveryTime: z.string().default("30"),
  isOpen: z.boolean().default(true),
  openingHours: z.record(z.any()).optional(),
  createdAt: z.date(),
});

// Prescription schema
export const prescriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  imageUrl: z.string(),
  status: z.enum(["pending", "processed", "fulfilled"]).default("pending"),
  medications: z.array(z.any()).optional(),
  createdAt: z.date(),
});

// Order schema
export const orderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  pharmacyId: z.string(),
  prescriptionId: z.string().optional(),
  status: z.enum(["pending", "confirmed", "preparing", "in_transit", "delivered", "cancelled"]).default("pending"),
  totalAmount: z.number().optional(),
  deliveryAddress: z.string(),
  deliveryLatitude: z.number().optional(),
  deliveryLongitude: z.number().optional(),
  deliveryNotes: z.string().optional(),
  medications: z.array(z.object({
    name: z.string(),
    surBon: z.boolean().optional(),
  })).optional(),
  bonDocuments: z.string().optional(),
  estimatedDelivery: z.date().optional(),
  deliveredAt: z.date().optional(),
  deliveryPersonId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Delivery person schema
export const deliveryPersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  currentLatitude: z.number().optional(),
  currentLongitude: z.number().optional(),
  isAvailable: z.boolean().default(true),
  rating: z.number().default(5.0),
  createdAt: z.date(),
});

// Notification schema
export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  body: z.string(),
  type: z.string(), // order_update, delivery, promotion, etc.
  orderId: z.string().optional(),
  isRead: z.boolean().default(false),
  createdAt: z.date(),
});

// Insert schemas (omitting auto-generated fields)
export const insertUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const registerSchema = insertUserSchema.omit({
  idDocumentUrl: true,
  professionalDocumentUrl: true,
  drivingLicenseUrl: true,
  verificationStatus: true,
}).extend({
  confirmPassword: z.string().min(6),
  role: z.enum(["patient", "pharmacien", "livreur", "admin"]).default("patient"),
  // Files for identity validation (optional but required based on role)
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

export const insertPharmacySchema = pharmacySchema.omit({
  id: true,
  createdAt: true,
});

export const insertPrescriptionSchema = prescriptionSchema.omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = orderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = notificationSchema.omit({
  id: true,
  createdAt: true,
});

// Types
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Pharmacy = z.infer<typeof pharmacySchema>;
export type InsertPharmacy = z.infer<typeof insertPharmacySchema>;

export type Prescription = z.infer<typeof prescriptionSchema>;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type Order = z.infer<typeof orderSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type DeliveryPerson = z.infer<typeof deliveryPersonSchema>;

export type Notification = z.infer<typeof notificationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;