import { pgTable, varchar, text, numeric, boolean, timestamp, foreignKey, jsonb, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const deliveryPersons = pgTable("delivery_persons", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	phone: varchar().notNull(),
	currentLatitude: numeric("current_latitude", { precision: 10, scale:  8 }),
	currentLongitude: numeric("current_longitude", { precision: 11, scale:  8 }),
	isAvailable: boolean("is_available").default(true),
	rating: numeric({ precision: 2, scale:  1 }).default('5.0'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const orders = pgTable("orders", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	pharmacyId: varchar("pharmacy_id").notNull(),
	prescriptionId: varchar("prescription_id"),
	status: varchar().default('pending'),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }),
	deliveryAddress: text("delivery_address").notNull(),
	deliveryNotes: text("delivery_notes"),
	estimatedDelivery: timestamp("estimated_delivery", { mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { mode: 'string' }),
	deliveryPersonId: varchar("delivery_person_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	medications: jsonb(),
	bonDocuments: text("bon_documents"),
	deliveryLatitude: numeric("delivery_latitude", { precision: 10, scale:  8 }),
	deliveryLongitude: numeric("delivery_longitude", { precision: 11, scale:  8 }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.pharmacyId],
			foreignColumns: [pharmacies.id],
			name: "orders_pharmacy_id_pharmacies_id_fk"
		}),
	foreignKey({
			columns: [table.prescriptionId],
			foreignColumns: [prescriptions.id],
			name: "orders_prescription_id_prescriptions_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	firstName: varchar("first_name").notNull(),
	lastName: varchar("last_name").notNull(),
	phone: varchar().notNull(),
	address: varchar().notNull(),
	password: varchar().notNull(),
	role: varchar().default('patient').notNull(),
	language: varchar().default('fr'),
	profileImageUrl: text("profile_image_url"),
	pharmacyId: varchar("pharmacy_id"),
	isActive: boolean("is_active").default(true),
	idDocumentUrl: text("id_document_url"),
	professionalDocumentUrl: text("professional_document_url"),
	drivingLicenseUrl: text("driving_license_url"),
	verificationStatus: varchar("verification_status").default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.pharmacyId],
			foreignColumns: [pharmacies.id],
			name: "users_pharmacy_id_pharmacies_id_fk"
		}),
	unique("users_phone_unique").on(table.phone),
]);

export const notifications = pgTable("notifications", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	title: text().notNull(),
	body: text().notNull(),
	type: varchar().notNull(),
	orderId: varchar("order_id"),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "notifications_order_id_orders_id_fk"
		}),
]);

export const pharmacies = pgTable("pharmacies", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	address: text().notNull(),
	latitude: numeric({ precision: 10, scale:  8 }),
	longitude: numeric({ precision: 11, scale:  8 }),
	phone: varchar(),
	rating: numeric({ precision: 2, scale:  1 }).default('0.0'),
	deliveryTime: varchar("delivery_time").default('30'),
	isOpen: boolean("is_open").default(true),
	openingHours: jsonb("opening_hours"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const prescriptions = pgTable("prescriptions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	imageUrl: text("image_url").notNull(),
	status: varchar().default('pending'),
	medications: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "prescriptions_user_id_users_id_fk"
		}),
]);
