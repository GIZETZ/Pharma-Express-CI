import { relations } from "drizzle-orm/relations";
import { users, orders, pharmacies, prescriptions, notifications } from "./schema";

export const ordersRelations = relations(orders, ({one, many}) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	pharmacy: one(pharmacies, {
		fields: [orders.pharmacyId],
		references: [pharmacies.id]
	}),
	prescription: one(prescriptions, {
		fields: [orders.prescriptionId],
		references: [prescriptions.id]
	}),
	notifications: many(notifications),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	orders: many(orders),
	pharmacy: one(pharmacies, {
		fields: [users.pharmacyId],
		references: [pharmacies.id]
	}),
	notifications: many(notifications),
	prescriptions: many(prescriptions),
}));

export const pharmaciesRelations = relations(pharmacies, ({many}) => ({
	orders: many(orders),
	users: many(users),
}));

export const prescriptionsRelations = relations(prescriptions, ({one, many}) => ({
	orders: many(orders),
	user: one(users, {
		fields: [prescriptions.userId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
	order: one(orders, {
		fields: [notifications.orderId],
		references: [orders.id]
	}),
}));