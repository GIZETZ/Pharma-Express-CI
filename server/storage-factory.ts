import { type IStorage, MemStorage } from "./storage";
import { FirebaseStorage } from "./firebase-storage";

export function createStorage(): IStorage {
  // Check if Firebase is configured
  if (process.env.FIREBASE_PROJECT_ID) {
    console.log('Using Firebase storage');
    return new FirebaseStorage();
  } else {
    console.log('Using in-memory storage');
    return new MemStorage();
  }
}