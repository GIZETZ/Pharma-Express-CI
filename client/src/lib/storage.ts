// IndexedDB utilities for offline data caching
interface CacheData {
  data: any;
  timestamp: number;
  expiry?: number;
}

class OfflineStorage {
  private dbName = 'pharmachape-db';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('pharmacies')) {
          db.createObjectStore('pharmacies', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('orders')) {
          db.createObjectStore('orders', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('prescriptions')) {
          db.createObjectStore('prescriptions', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('user')) {
          db.createObjectStore('user', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  async set(store: string, key: string, data: any, expiry?: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      
      const cacheData: CacheData = {
        data,
        timestamp: Date.now(),
        expiry: expiry ? Date.now() + expiry : undefined
      };

      const request = objectStore.put({ key, ...cacheData });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(store: string, key: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check if data has expired
        if (result.expiry && Date.now() > result.expiry) {
          this.delete(store, key);
          resolve(null);
          return;
        }

        resolve(result.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(store: string, key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(store: string): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const results = request.result.map(item => item.data).filter(Boolean);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clear(store: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cache API responses with TTL
  async cacheApiResponse(endpoint: string, data: any, ttl: number = 300000): Promise<void> {
    await this.set('cache', endpoint, data, ttl);
  }

  async getCachedApiResponse(endpoint: string): Promise<any> {
    return await this.get('cache', endpoint);
  }

  // Store user data for offline access
  async storeUserData(user: any): Promise<void> {
    await this.set('user', 'current', user);
  }

  async getUserData(): Promise<any> {
    return await this.get('user', 'current');
  }

  // Store pharmacies for offline browsing
  async storePharmacies(pharmacies: any[]): Promise<void> {
    for (const pharmacy of pharmacies) {
      await this.set('pharmacies', pharmacy.id, pharmacy);
    }
  }

  async getStoredPharmacies(): Promise<any[]> {
    return await this.getAll('pharmacies');
  }

  // Store orders for offline viewing
  async storeOrder(order: any): Promise<void> {
    await this.set('orders', order.id, order);
  }

  async getStoredOrders(): Promise<any[]> {
    return await this.getAll('orders');
  }

  // Store prescriptions
  async storePrescription(prescription: any): Promise<void> {
    await this.set('prescriptions', prescription.id, prescription);
  }

  async getStoredPrescriptions(): Promise<any[]> {
    return await this.getAll('prescriptions');
  }
}

export const offlineStorage = new OfflineStorage();

// Initialize storage when the module is imported
offlineStorage.init().catch(console.error);
