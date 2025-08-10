import { type IStorage, MemStorage } from "./storage";
import { FirebaseStorage } from "./firebase-storage";

export function createStorage(): IStorage {
  // For now, always use in-memory storage to avoid Firebase auth issues in development
  // Firebase can be enabled later with proper service account credentials
  console.log('Using in-memory storage (Firebase temporarily disabled for development)');
  return new MemStorage();
  
  // Commented out Firebase storage until proper credentials are configured
  // if (process.env.FIREBASE_PROJECT_ID) {
  //   console.log('Using Firebase storage');
  //   return new FirebaseStorage();
  // } else {
  //   console.log('Using in-memory storage');
  //   return new MemStorage();
  // }
}