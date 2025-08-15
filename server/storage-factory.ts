import { type IStorage, MemStorage } from "./storage";
import { PostgresStorage } from "./postgres-storage";

export function createStorage(): IStorage {
  // Use PostgreSQL database for persistent storage
  if (process.env.DATABASE_URL) {
    console.log('Using PostgreSQL database storage');
    return new PostgresStorage();
  } else {
    console.log('Using in-memory storage (no DATABASE_URL found)');
    return new MemStorage();
  }
}