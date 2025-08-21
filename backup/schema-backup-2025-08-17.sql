-- =====================================================
-- PHARMA EXPRESS CI - SCHEMA BACKUP
-- Date: 17/08/2025 23:33:04
-- Version: 1.0.0
-- =====================================================

-- Suppression des tables existantes (si elles existent)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS pharmacies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- TABLE: users
-- =====================================================
CREATE TABLE users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    firstName VARCHAR NOT NULL,
    lastName VARCHAR NOT NULL,
    phone VARCHAR UNIQUE NOT NULL,
    address VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'patient',
    language VARCHAR(2) DEFAULT 'fr',
    profileImageUrl VARCHAR,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW(),
    isActive BOOLEAN DEFAULT true,
    verificationStatus VARCHAR DEFAULT 'pending',
    deliveryApplicationStatus VARCHAR DEFAULT 'none',
    pharmacyId VARCHAR,
    appliedPharmacyId VARCHAR,
    motivationLetter TEXT,
    experience TEXT,
    availability TEXT
);

-- =====================================================
-- TABLE: pharmacies
-- =====================================================
CREATE TABLE pharmacies (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    phone VARCHAR,
    address VARCHAR NOT NULL,
    latitude VARCHAR,
    longitude VARCHAR,
    rating VARCHAR,
    reviewCount VARCHAR,
    deliveryTime VARCHAR,
    isOpen BOOLEAN DEFAULT true,
    isEmergency24h BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABLE: prescriptions
-- =====================================================
CREATE TABLE prescriptions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    createdAt TIMESTAMP DEFAULT NOW(),
    status VARCHAR DEFAULT 'pending',
    userId VARCHAR NOT NULL REFERENCES users(id),
    imageUrl VARCHAR NOT NULL,
    medications JSONB DEFAULT '[]'
);

-- =====================================================
-- TABLE: orders
-- =====================================================
CREATE TABLE orders (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW(),
    pharmacyId VARCHAR NOT NULL REFERENCES pharmacies(id),
    status VARCHAR DEFAULT 'pending',
    userId VARCHAR NOT NULL REFERENCES users(id),
    medications JSONB DEFAULT '[]',
    prescriptionId VARCHAR REFERENCES prescriptions(id),
    totalAmount VARCHAR,
    deliveryAddress VARCHAR,
    deliveryLatitude VARCHAR,
    deliveryLongitude VARCHAR,
    deliveryNotes TEXT,
    bonDocuments JSONB DEFAULT '[]',
    estimatedDelivery TIMESTAMP,
    deliveredAt TIMESTAMP,
    deliveryPersonId VARCHAR REFERENCES users(id)
);

-- =====================================================
-- TABLE: notifications
-- =====================================================
CREATE TABLE notifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    createdAt TIMESTAMP DEFAULT NOW(),
    type VARCHAR NOT NULL,
    userId VARCHAR NOT NULL REFERENCES users(id),
    title VARCHAR NOT NULL,
    body VARCHAR NOT NULL,
    orderId VARCHAR REFERENCES orders(id),
    isRead BOOLEAN DEFAULT false
);

-- =====================================================
-- INDEX POUR PERFORMANCES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_pharmacy_id ON users(pharmacyId);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verificationStatus);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(userId);
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy_id ON orders(pharmacyId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_person ON orders(deliveryPersonId);
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(userId);

-- =====================================================
-- DONNÉES DE BASE ESSENTIELLES
-- =====================================================

-- Admin principal du système
INSERT INTO users (
    firstName, lastName, phone, address, password, role, 
    language, isActive, verificationStatus
) VALUES (
    'Admin', 'YahoPharma', '+225 01 23 45 67', 
    'Siège YahoPharma, Abidjan', 
    '$2b$10$rVl.E8rV7mGdXJZQx8QcX.HQCqJC2HQY2Y2GqcJqXc5J5QcX8QcX.', 
    'admin', 'fr', true, 'approved'
) ON CONFLICT (phone) DO NOTHING;

-- Pharmacien de test 1
INSERT INTO users (
    firstName, lastName, phone, address, password, role, 
    language, isActive, verificationStatus, pharmacyId
) VALUES (
    'Dr. Marie', 'Kouassi', '+225 07 11 22 33', 
    'Pharmacie de la Paix, Abidjan', 
    '$2b$10$rVl.E8rV7mGdXJZQx8QcX.HQCqJC2HQY2Y2GqcJqXc5J5QcX8QcX.', 
    'pharmacien', 'fr', true, 'approved', 
    (SELECT id FROM pharmacies WHERE phone = '+225 07 11 22 33' LIMIT 1)
) ON CONFLICT (phone) DO NOTHING;

-- Pharmacien de test 2
INSERT INTO users (
    firstName, lastName, phone, address, password, role, 
    language, isActive, verificationStatus, pharmacyId
) VALUES (
    'Dr. Adjoua', 'Bamba', '+225 05 44 33 22', 
    'Pharmacie Centrale Plus, Marcory', 
    '$2b$10$rVl.E8rV7mGdXJZQx8QcX.HQCqJC2HQY2Y2GqcJqXc5J5QcX8QcX.', 
    'pharmacien', 'fr', true, 'approved',
    (SELECT id FROM pharmacies WHERE phone = '+225 05 44 33 22' LIMIT 1)
) ON CONFLICT (phone) DO NOTHING;

-- Pharmacies de test
INSERT INTO pharmacies (
    name, address, latitude, longitude, phone, rating, 
    deliveryTime, isOpen
) VALUES 
(
    'Pharmacie Dr. Marie Kouassi', 'Quartier Riviera Golf, Cocody', 
    '5.3364', '-4.0267', '+225 07 11 22 33', '4.8', '25', true
),
(
    'Pharmacie de la Paix', 'Boulevard de la Paix, Cocody', 
    '5.3364', '-4.0267', '+225 05 44 33 22', '4.7', '30', true
),
(
    'Pharmacie Centrale Plus', 'Zone commerciale Marcory', 
    '5.2886', '-3.9986', '+225 07 88 99 00', '4.6', '20', true
)
ON CONFLICT (phone) DO NOTHING;

-- Livreurs de test
INSERT INTO users (
    firstName, lastName, phone, address, password, role, 
    language, isActive, verificationStatus, deliveryApplicationStatus, pharmacyId
) VALUES 
(
    'Jean-Claude', 'Koffi', '+225 07 44 55 66', 
    'Zone livraison Abidjan', 
    '$2b$10$rVl.E8rV7mGdXJZQx8QcX.HQCqJC2HQY2Y2GqcJqXc5J5QcX8QcX.', 
    'livreur', 'fr', true, 'approved', 'approved',
    (SELECT id FROM pharmacies WHERE phone = '+225 07 11 22 33' LIMIT 1)
),
(
    'Aya', 'Traore', '+225 05 77 88 99', 
    'Marcory, Abidjan', 
    '$2b$10$rVl.E8rV7mGdXJZQx8QcX.HQCqJC2HQY2Y2GqcJqXc5J5QcX8QcX.', 
    'livreur', 'fr', true, 'approved', 'approved',
    (SELECT id FROM pharmacies WHERE phone = '+225 05 44 33 22' LIMIT 1)
)
ON CONFLICT (phone) DO NOTHING;

-- Patient de test
INSERT INTO users (
    firstName, lastName, phone, address, password, role, 
    language, isActive, verificationStatus
) VALUES (
    'Konan', 'Akissi', '+225 01 11 22 33', 
    'Cocody, Abidjan', 
    '$2b$10$rVl.E8rV7mGdXJZQx8QcX.HQCqJC2HQY2Y2GqcJqXc5J5QcX8QcX.', 
    'patient', 'fr', true, 'approved'
) ON CONFLICT (phone) DO NOTHING;

-- =====================================================
-- SCRIPT TERMINÉ AVEC SUCCÈS
-- =====================================================
COMMENT ON DATABASE CURRENT_DATABASE() IS 'Pharma Express CI - Base de données restaurée le 17/08/2025 23:33:04';

SELECT 
    'Database schema restored successfully!' as status,
    COUNT(*) as total_users 
FROM users;
