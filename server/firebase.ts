import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin only if it hasn't been initialized yet
let app;
if (getApps().length === 0) {
  // For development, we can use environment variables
  // For production, you'll need to provide service account credentials
  if (process.env.FIREBASE_PROJECT_ID) {
    app = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
      // Add other config as needed
    });
  } else {
    // Fallback for development - you can also use a service account key
    throw new Error('Firebase configuration missing. Please set FIREBASE_PROJECT_ID or provide service account credentials.');
  }
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
export { app };