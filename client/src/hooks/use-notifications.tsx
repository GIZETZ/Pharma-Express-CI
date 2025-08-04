import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [hasUnread, setHasUnread] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications non supportées",
        description: "Votre navigateur ne supporte pas les notifications",
        variant: "destructive",
      });
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      toast({
        title: "Notifications activées",
        description: "Vous recevrez des mises à jour sur vos commandes",
      });
      return true;
    } else {
      toast({
        title: "Notifications refusées",
        description: "Activez les notifications dans les paramètres de votre navigateur",
        variant: "destructive",
      });
      return false;
    }
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setHasUnread(true);
    }
  };

  const markAsRead = () => {
    setHasUnread(false);
  };

  // Subscribe to push notifications (would integrate with backend)
  const subscribeToPush = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'your-vapid-public-key', // Replace with actual VAPID key
        });
        
        // Send subscription to backend
        console.log('Push subscription:', subscription);
        return subscription;
      } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
        return null;
      }
    }
    return null;
  };

  return {
    permission,
    hasUnread,
    requestPermission,
    showNotification,
    markAsRead,
    subscribeToPush,
  };
}
