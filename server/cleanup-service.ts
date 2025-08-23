import { createStorage } from "./storage-factory";

export class CleanupService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly storage = createStorage();

  // Intervalle de nettoyage: toutes les heures (3600000 ms)
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 heure

  start(): void {
    if (this.intervalId) {
      console.log('⚠️ Service de nettoyage déjà démarré');
      return;
    }

    console.log('🚀 Démarrage du service de nettoyage automatique des commandes');
    
    // Exécuter immédiatement au démarrage puis toutes les heures
    this.performCleanup();
    
    this.intervalId = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL);

    console.log(`⏰ Service de nettoyage programmé toutes les ${this.CLEANUP_INTERVAL / (60 * 1000)} minutes`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Service de nettoyage arrêté');
    }
  }

  private async performCleanup(): Promise<void> {
    try {
      console.log('🧹 Exécution du nettoyage automatique...');
      const deletedCount = await this.storage.cleanupOldOrders();
      
      if (deletedCount > 0) {
        console.log(`✅ Nettoyage terminé: ${deletedCount} commandes supprimées`);
      } else {
        console.log('✅ Nettoyage terminé: aucune commande à supprimer');
      }
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage automatique:', error);
    }
  }

  // Méthode pour forcer un nettoyage manuel (utile pour les tests)
  async forceCleanup(): Promise<number> {
    console.log('🧹 Nettoyage manuel forcé...');
    return await this.storage.cleanupOldOrders();
  }
}

// Instance singleton du service
export const cleanupService = new CleanupService();