import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin only if it hasn't been initialized yet
let app;
if (getApps().length === 0) {
  if (process.env.FIREBASE_PROJECT_ID) {
    // Initialize with minimal config for development
    // This bypasses the need for service account credentials in development
    app = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    
    // Disable authentication for development environment
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    process.env.GCLOUD_PROJECT = process.env.FIREBASE_PROJECT_ID;
  } else {
    throw new Error('Firebase configuration missing. Please set FIREBASE_PROJECT_ID.');
  }
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
export { app };