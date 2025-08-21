import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

// Types pour les statuts de commande
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready_for_delivery' | 'in_transit' | 'in_delivery' | 'delivered' | 'cancelled';

// Configuration des sons par statut
const NOTIFICATION_SOUNDS: Record<OrderStatus, { file: string; title: string; message: string; urgency: 'low' | 'medium' | 'high' }> = {
  pending: {
    file: '/sounds/order-pending.mp3',
    title: '🔄 Commande en attente',
    message: 'Votre commande est en cours de traitement',
    urgency: 'low'
  },
  confirmed: {
    file: '/sounds/order-confirmed.mp3',
    title: '✅ Commande confirmée',
    message: 'Votre commande a été confirmée par la pharmacie',
    urgency: 'medium'
  },
  preparing: {
    file: '/sounds/order-preparing.mp3',
    title: '🔄 En préparation',
    message: 'Votre commande est en cours de préparation',
    urgency: 'medium'
  },
  ready_for_delivery: {
    file: '/sounds/order-ready.mp3',
    title: '📦 Prête pour livraison',
    message: 'Votre commande est prête et en attente du livreur',
    urgency: 'medium'
  },
  in_transit: {
    file: '/sounds/delivery-started.mp3',
    title: '🚚 Livraison en route',
    message: 'Le livreur est en route vers vous',
    urgency: 'high'
  },
  in_delivery: {
    file: '/sounds/delivery-arrival.mp3',
    title: '🎯 Livreur en approche',
    message: 'Le livreur arrive bientôt à destination',
    urgency: 'high'
  },
  delivered: {
    file: '/sounds/delivery-complete.mp3',
    title: '🎉 Livraison terminée',
    message: 'Votre commande a été livrée avec succès',
    urgency: 'medium'
  },
  cancelled: {
    file: '/sounds/order-cancelled.mp3',
    title: '❌ Commande annulée',
    message: 'Votre commande a été annulée',
    urgency: 'low'
  }
};

export function useOrderNotifications() {
  const { user } = useAuth();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const lastOrderStatusRef = useRef<Record<string, OrderStatus>>({});

  // Initialiser les fichiers audio
  useEffect(() => {
    Object.entries(NOTIFICATION_SOUNDS).forEach(([status, config]) => {
      const audio = new Audio(config.file);
      audio.preload = 'auto';
      audio.volume = 0.8;
      audioRefs.current[status] = audio;
    });

    return () => {
      // Nettoyer les références audio
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);

  // Demander permission pour les notifications
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Ce navigateur ne supporte pas les notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      setIsNotificationsEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        // Enregistrer le service worker pour les notifications
        await registerServiceWorker();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return false;
    }
  };

  // Enregistrer le service worker
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw-notifications.js');
        console.log('Service Worker enregistré:', registration);
        return registration;
      } catch (error) {
        console.error('Erreur enregistrement Service Worker:', error);
      }
    }
  };

  // Jouer le son pour un statut donné
  const playNotificationSound = async (status: OrderStatus) => {
    try {
      const audio = audioRefs.current[status];
      if (audio) {
        audio.currentTime = 0;
        await audio.play();
        
        // Vibration sur mobile
        if ('vibrator' in navigator || 'vibrate' in navigator) {
          const pattern = NOTIFICATION_SOUNDS[status].urgency === 'high' ? [200, 100, 200] : [100];
          navigator.vibrate?.(pattern);
        }
      }
    } catch (error) {
      console.log('Impossible de jouer le son:', error);
    }
  };

  // Afficher une notification système
  const showSystemNotification = async (status: OrderStatus, orderId?: string) => {
    if (!isNotificationsEnabled || permissionStatus !== 'granted') return;

    const config = NOTIFICATION_SOUNDS[status];
    
    try {
      // Essayer d'utiliser le Service Worker d'abord
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.showNotification) {
          await registration.showNotification(config.title, {
            body: config.message,
            icon: '/icons/pharma-icon-192.png',
            badge: '/icons/pharma-icon-72.png',
            tag: `order-${orderId || 'general'}`,
            requireInteraction: config.urgency === 'high',
            data: {
              orderId,
              status,
              timestamp: Date.now()
            }
          });
          return;
        }
      }
      
      // Fallback vers Notification API standard
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(config.title, {
          body: config.message,
          icon: '/icons/pharma-icon-192.png',
          badge: '/icons/pharma-icon-72.png',
          tag: `order-${orderId || 'general'}`,
          data: {
            orderId,
            status,
            timestamp: Date.now()
          }
        });

        // Auto-fermeture après délai selon urgence
        const autoCloseDelay = config.urgency === 'high' ? 10000 : 5000;
        setTimeout(() => notification.close(), autoCloseDelay);

        notification.onclick = () => {
          window.focus();
          // Rediriger vers la page de suivi si nécessaire
          if (orderId && ['in_transit', 'in_delivery'].includes(status)) {
            window.location.href = '/delivery-tracking';
          } else {
            window.location.href = '/dashboard';
          }
          notification.close();
        };
      }
    } catch (error) {
      console.log('Notification système non disponible:', error);
    }
  };

  // Fonction principale pour notifier un changement de statut
  const notifyOrderStatusChange = async (orderId: string, newStatus: OrderStatus, playSound: boolean = true) => {
    const previousStatus = lastOrderStatusRef.current[orderId];
    
    // Ne notifier que si le statut a vraiment changé
    if (previousStatus === newStatus) return;

    lastOrderStatusRef.current[orderId] = newStatus;

    // Jouer le son si demandé (désactivé car maintenant géré dans l'app)
    // if (playSound && isNotificationsEnabled) {
    //   await playNotificationSound(newStatus);
    // }

    // Afficher notification système (utilise le son par défaut du navigateur)
    await showSystemNotification(newStatus, orderId);

    // Log pour debug
    console.log(`🔔 Notification: Commande ${orderId.slice(0, 8)} → ${newStatus}`);
  };

  // Fonction pour tester les notifications
  const testNotification = async (status: OrderStatus = 'confirmed') => {
    await playNotificationSound(status);
    await showSystemNotification(status, 'test-order');
  };

  // Vérifier le statut des permissions au chargement
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
      setIsNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  return {
    isNotificationsEnabled,
    permissionStatus,
    requestNotificationPermission,
    notifyOrderStatusChange,
    testNotification,
    playNotificationSound,
    showSystemNotification
  };
}