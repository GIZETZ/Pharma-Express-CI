// Service Worker pour les notifications Pharma Express CI
const CACHE_NAME = 'pharma-notifications-v1';
const NOTIFICATION_CACHE = 'pharma-sounds-v1';

// Sons et icônes à mettre en cache
const NOTIFICATION_ASSETS = [
  '/sounds/order-pending.mp3',
  '/sounds/order-confirmed.mp3',
  '/sounds/order-preparing.mp3',
  '/sounds/order-ready.mp3',
  '/sounds/delivery-started.mp3',
  '/sounds/delivery-arrival.mp3',
  '/sounds/delivery-complete.mp3',
  '/sounds/order-cancelled.mp3',
  '/icons/pharma-icon-192.png',
  '/icons/pharma-icon-72.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Installation du Service Worker Notifications');
  
  event.waitUntil(
    caches.open(NOTIFICATION_CACHE)
      .then(cache => {
        console.log('📦 Mise en cache des assets de notification');
        return cache.addAll(NOTIFICATION_ASSETS);
      })
      .catch(error => {
        console.log('⚠️ Certains assets de notification non disponibles:', error);
        // Ne pas faire échouer l'installation si certains sons manquent
        return Promise.resolve();
      })
  );
  
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Activation du Service Worker Notifications');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== NOTIFICATION_CACHE) {
            console.log('🗑️ Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Écouter les messages de l'application principale
self.addEventListener('message', (event) => {
  console.log('📨 Message reçu dans SW:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SHOW_NOTIFICATION':
        showNotification(event.data.payload);
        break;
      case 'PLAY_SOUND':
        // Le son sera joué par l'application principale
        break;
      default:
        console.log('Type de message non reconnu:', event.data.type);
    }
  }
});

// Fonction pour afficher une notification
function showNotification(payload) {
  const { title, message, status, orderId, urgency = 'medium' } = payload;
  
  const notificationOptions = {
    body: message,
    icon: '/icons/pharma-icon-192.png',
    badge: '/icons/pharma-icon-72.png',
    tag: `pharma-order-${orderId || 'general'}`,
    requireInteraction: urgency === 'high',
    vibrate: urgency === 'high' ? [200, 100, 200] : [100],
    data: {
      orderId,
      status,
      timestamp: Date.now(),
      url: getNotificationUrl(status, orderId)
    },
    actions: [
      {
        action: 'view',
        title: '👁️ Voir détails',
        icon: '/icons/pharma-icon-72.png'
      },
      {
        action: 'track',
        title: '📍 Suivre livraison',
        icon: '/icons/pharma-icon-72.png'
      }
    ]
  };

  // Personnaliser selon le statut
  switch (status) {
    case 'confirmed':
      notificationOptions.badge = '✅';
      break;
    case 'preparing':
      notificationOptions.badge = '🔄';
      break;
    case 'ready_for_delivery':
      notificationOptions.badge = '📦';
      break;
    case 'in_transit':
      notificationOptions.badge = '🚚';
      notificationOptions.requireInteraction = true;
      break;
    case 'in_delivery':
      notificationOptions.badge = '🎯';
      notificationOptions.requireInteraction = true;
      notificationOptions.vibrate = [300, 100, 300, 100, 300];
      break;
    case 'delivered':
      notificationOptions.badge = '🎉';
      break;
    case 'cancelled':
      notificationOptions.badge = '❌';
      break;
  }

  self.registration.showNotification(title, notificationOptions)
    .then(() => {
      console.log('🔔 Notification affichée:', title);
    })
    .catch(error => {
      console.error('❌ Erreur affichage notification:', error);
    });
}

// Déterminer l'URL de redirection selon le statut
function getNotificationUrl(status, orderId) {
  const baseUrl = self.location.origin;
  
  switch (status) {
    case 'in_transit':
    case 'in_delivery':
      return `${baseUrl}/delivery-tracking?orderId=${orderId}`;
    case 'confirmed':
      return `${baseUrl}/order-validation?orderId=${orderId}`;
    default:
      return `${baseUrl}/dashboard`;
  }
}

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Clic sur notification:', event.action, event.notification.data);
  
  event.notification.close();
  
  const { orderId, status } = event.notification.data || {};
  let targetUrl = getNotificationUrl(status, orderId);
  
  // Actions personnalisées
  switch (event.action) {
    case 'view':
      targetUrl = `${self.location.origin}/dashboard`;
      break;
    case 'track':
      if (orderId && ['in_transit', 'in_delivery'].includes(status)) {
        targetUrl = `${self.location.origin}/delivery-tracking?orderId=${orderId}`;
      }
      break;
    default:
      // Utiliser l'URL par défaut
      break;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Vérifier si l'application est déjà ouverte
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            payload: { orderId, status, action: event.action }
          });
          return client.focus();
        }
      }
      
      // Ouvrir une nouvelle fenêtre si l'app n'est pas ouverte
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Gérer la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Notification fermée:', event.notification.tag);
});

// Synchronisation en arrière-plan pour vérifier les mises à jour de commandes
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-orders') {
    event.waitUntil(checkOrderUpdates());
  }
});

// Fonction pour vérifier les mises à jour de commandes
async function checkOrderUpdates() {
  try {
    console.log('🔄 Vérification des mises à jour de commandes...');
    
    // Cette fonction sera appelée périodiquement pour vérifier les changements
    // même quand l'application est fermée
    
    const response = await fetch('/api/orders/check-updates', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const updates = await response.json();
      
      updates.forEach(update => {
        showNotification({
          title: getStatusTitle(update.status),
          message: getStatusMessage(update.status),
          status: update.status,
          orderId: update.orderId,
          urgency: getStatusUrgency(update.status)
        });
      });
    }
  } catch (error) {
    console.log('Erreur vérification mises à jour:', error);
  }
}

// Fonctions utilitaires pour les messages
function getStatusTitle(status) {
  const titles = {
    confirmed: '✅ Commande confirmée',
    preparing: '🔄 En préparation',
    ready_for_delivery: '📦 Prête pour livraison',
    in_transit: '🚚 Livraison en route',
    in_delivery: '🎯 Livreur en approche',
    delivered: '🎉 Livraison terminée',
    cancelled: '❌ Commande annulée'
  };
  return titles[status] || '🔔 Mise à jour commande';
}

function getStatusMessage(status) {
  const messages = {
    confirmed: 'Votre commande a été confirmée par la pharmacie',
    preparing: 'Votre commande est en cours de préparation',
    ready_for_delivery: 'Votre commande est prête et en attente du livreur',
    in_transit: 'Le livreur est en route vers vous',
    in_delivery: 'Le livreur arrive bientôt à destination',
    delivered: 'Votre commande a été livrée avec succès',
    cancelled: 'Votre commande a été annulée'
  };
  return messages[status] || 'Le statut de votre commande a été mis à jour';
}

function getStatusUrgency(status) {
  const urgencies = {
    confirmed: 'medium',
    preparing: 'medium',
    ready_for_delivery: 'medium',
    in_transit: 'high',
    in_delivery: 'high',
    delivered: 'medium',
    cancelled: 'low'
  };
  return urgencies[status] || 'medium';
}