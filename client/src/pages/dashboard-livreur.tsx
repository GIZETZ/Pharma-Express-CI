import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";

// Composant Timer pour les commandes en attente d'acceptation
function AssignmentTimer({ assignedAt, onExpired }: { assignedAt: string, onExpired: () => void }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasExpired, setHasExpired] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const assignedTime = new Date(assignedAt).getTime();
      const now = new Date().getTime();
      const diff = (assignedTime + 3 * 60 * 1000) - now; // 3 minutes en millisecondes
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft <= 0 && !hasExpired) {
        setHasExpired(true);
        onExpired();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [assignedAt, onExpired, hasExpired]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center gap-2 text-orange-600">
      <Clock className="h-4 w-4" />
      <span className="font-mono">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}

export default function DashboardLivreur() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("my-deliveries");
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [expiredAssignments, setExpiredAssignments] = useState<Set<string>>(new Set());

  // Système de notifications sonores pour le livreur
  const {
    isNotificationsEnabled,
    permissionStatus,
    requestNotificationPermission,
    notifyOrderStatusChange,
    playNotificationSound,
    testNotification
  } = useOrderNotifications();

  // Fonction pour tester tous les sons
  const testAllSounds = async () => {
    const sounds = ['pending', 'confirmed', 'preparing', 'ready_for_delivery', 'in_transit', 'in_delivery', 'delivered', 'cancelled'];
    for (const sound of sounds) {
      await playSound(sound as any);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde entre chaque son
    }
  };

  // État pour tracker les statuts précédents des livraisons
  const [previousDeliveryStatuses, setPreviousDeliveryStatuses] = useState<Record<string, string>>({});

  // Rediriger si le livreur n'a pas encore de pharmacie assignée
  if (user?.role === 'livreur' && user?.deliveryApplicationStatus !== 'approved') {
    window.location.href = '/delivery-application';
    return null;
  }

  // Récupérer les commandes assignées à ce livreur (incluant celles en attente d'acceptation)
  const { data: myDeliveries = [], isLoading: loadingMyDeliveries } = useQuery({
    queryKey: ["/api/livreur/deliveries"],
    enabled: true,
    refetchInterval: 5000, // Rafraîchir toutes les 5 secondes pour le timeout
  });

  // Récupérer les notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: true
  });

  // Mutation pour accepter une livraison assignée
  const acceptAssignmentMutation = useMutation({
    mutationFn: (orderId: string) =>
      apiRequest("POST", `/api/livreur/deliveries/${orderId}/accept`),
    onSuccess: () => {
      toast({
        title: "Livraison acceptée",
        description: "Vous pouvez maintenant effectuer cette livraison",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/livreur/deliveries"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible d'accepter cette livraison",
        variant: "destructive",
      });
    },
  });

  // Mutation pour rejeter une livraison assignée
  const rejectAssignmentMutation = useMutation({
    mutationFn: (orderId: string) =>
      apiRequest("POST", `/api/livreur/deliveries/${orderId}/reject`),
    onSuccess: () => {
      toast({
        title: "Livraison refusée",
        description: "La livraison sera réassignée à un autre livreur",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/livreur/deliveries"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de refuser cette livraison",
        variant: "destructive",
      });
    },
  });

  // Mutation pour accepter une livraison disponible
  const acceptDeliveryMutation = useMutation({
    mutationFn: (deliveryId: string) =>
      apiRequest(`/api/deliveries/${deliveryId}/accept`, "POST"),
    onSuccess: () => {
      toast({
        title: "Livraison acceptée",
        description: "Vous pouvez maintenant commencer la livraison",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'accepter la livraison",
        variant: "destructive",
      });
    },
  });

  // Mutation pour confirmer l'arrivée
  const confirmArrivalMutation = useMutation({
    mutationFn: (deliveryId: string) =>
      apiRequest("POST", `/api/livreur/deliveries/${deliveryId}/status`, { status: 'arrived_pending_confirmation' }),
    onSuccess: () => {
      toast({
        title: "Arrivée confirmée",
        description: "Le patient sera notifié de votre arrivée",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/livreur/deliveries"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de confirmer l'arrivée",
        variant: "destructive",
      });
    },
  });


  // Mutation pour mettre à jour le statut d'une livraison
  const updateDeliveryMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      apiRequest("POST", `/api/livreur/deliveries/${orderId}/status`, { status }),
    onSuccess: (data, variables) => {
      toast({
        title: "Statut mis à jour",
        description: variables.status === 'delivered' ? "Livraison terminée avec succès !" : "Le statut de la livraison a été mis à jour",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/livreur/deliveries"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    },
  });

  const handleAcceptDelivery = (orderId: string) => {
    acceptDeliveryMutation.mutate(orderId);
  };

  const handleUpdateDeliveryStatus = (orderId: string, status: string) => {
    updateDeliveryMutation.mutate({ orderId, status });
  };

  // Surveillance des changements de statut pour déclencher les notifications sonores pour livreurs
  useEffect(() => {
    if (myDeliveries && Array.isArray(myDeliveries)) {
      myDeliveries.forEach((delivery: any) => {
        const currentStatus = delivery.status;
        const previousStatus = previousDeliveryStatuses[delivery.id];
        
        // Si le statut a changé et qu'on a les notifications activées
        if (previousStatus && previousStatus !== currentStatus) {
          console.log(`🔄 Changement de statut livraison détecté: ${previousStatus} → ${currentStatus} pour ${delivery.id.slice(0, 8)}`);
          
          // Jouer le son directement dans l'application
          playNotificationSound(currentStatus).catch(error => {
            console.error('Erreur lecture son dans l\'app:', error);
          });
          
          // Déclencher notification système (sans son personnalisé)
          notifyOrderStatusChange(delivery.id, currentStatus, false);
          
          // Notifications toast spécifiques aux livreurs
          const deliveryStatusMessages: Record<string, string> = {
            assigned_pending_acceptance: "📦 Nouvelle livraison assignée - Veuillez accepter",
            in_transit: "🚚 Livraison acceptée - Vous pouvez commencer",
            arrived_pending_confirmation: "📍 Arrivée confirmée - En attente du patient",
            delivered: "✅ Livraison terminée avec succès !",
            cancelled: "❌ Livraison annulée"
          };
          
          if (deliveryStatusMessages[currentStatus]) {
            toast({
              title: "Mise à jour de livraison",
              description: deliveryStatusMessages[currentStatus],
              duration: currentStatus === 'assigned_pending_acceptance' ? 10000 : 5000, // Plus longue pour nouvelles assignations
            });
          }
        }
        
        // Mettre à jour le statut précédent
        setPreviousDeliveryStatuses(prev => ({
          ...prev,
          [delivery.id]: currentStatus
        }));
      });
    }
  }, [myDeliveries, previousDeliveryStatuses, notifyOrderStatusChange, toast, playNotificationSound]);

  // Initialiser les notifications au premier chargement pour les livreurs
  useEffect(() => {
    if (!isNotificationsEnabled && permissionStatus === 'default') {
      const timer = setTimeout(() => {
        toast({
          title: "🔔 Notifications livreur",
          description: "Activez les notifications pour être averti des nouvelles livraisons même quand l'app est fermée",
          action: (
            <Button size="sm" onClick={requestNotificationPermission}>
              Activer
            </Button>
          ),
          duration: 10000,
        });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isNotificationsEnabled, permissionStatus, requestNotificationPermission, toast]);

  if (loadingMyDeliveries) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-600 mb-2">
                🚚 Tableau de bord Livreur
              </h1>
              <p className="text-gray-600">
                Bienvenue {user?.firstName} ! Gérez vos livraisons
              </p>
            </div>
          </div>
        </div>

        {/* Résumé des notifications */}
        {Array.isArray(notifications) && notifications.length > 0 && (
          <Card className="mb-6 bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  🔔
                </div>
                <div>
                  <h3 className="font-semibold text-purple-800">Nouvelles notifications</h3>
                  <p className="text-sm text-purple-600">
                    {Array.isArray(notifications) ? notifications.filter((n: any) => !n.isRead).length : 0} nouvelles notifications
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statut de Disponibilité */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isAvailable ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {isAvailable ? '🟢' : '🔴'}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {isAvailable ? 'Disponible pour Livraisons' : 'Indisponible'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isAvailable
                      ? 'Vous recevrez des missions de livraison'
                      : 'Activez pour recevoir des missions'
                    }
                  </p>
                </div>
              </div>
              <Switch
                checked={isAvailable}
                onCheckedChange={setIsAvailable}
              />
            </div>
          </CardContent>
        </Card>

        {/* Navigation GPS */}
        <Card className="mb-6 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  🗺️
                </div>
                <div>
                  <h3 className="font-semibold text-orange-800">Navigation GPS</h3>
                  <p className="text-sm text-orange-600">
                    Voir vos livraisons sur la carte avec vrais itinéraires
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/delivery-map-livreur")}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                🧭 Ouvrir GPS
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-deliveries">
              Mes Livraisons
              {Array.isArray(myDeliveries) && myDeliveries.length > 0 && (
                <Badge variant="default" className="ml-2 bg-purple-600">
                  {myDeliveries.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="earnings">Mes Gains</TabsTrigger>
          </TabsList>

          {/* Mes Livraisons Assignées */}
          <TabsContent value="my-deliveries" className="space-y-4">
            {!Array.isArray(myDeliveries) || myDeliveries.length === 0 ? (
              <div className="border rounded-lg p-6 bg-gray-50 text-center">
                <div className="text-gray-400 text-4xl mb-2">📦</div>
                <h3 className="font-semibold mb-2">Aucune livraison disponible</h3>
                <p className="text-sm text-gray-600">
                  Les commandes assignées ou disponibles apparaîtront ici
                </p>
                <div className="mt-4 text-xs text-gray-500">
                  <p>Statut de connexion: {user ? 'Connecté' : 'Déconnecté'}</p>
                  <p>ID utilisateur: {user?.id?.slice(0, 8)}...</p>
                </div>
              </div>
            ) : (
              Array.isArray(myDeliveries) ? myDeliveries.map((delivery: any) => (
                <Card key={delivery.id} className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Commande #{delivery.id.slice(0, 8)}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {delivery.status === 'assigned_pending_acceptance' && delivery.assignedAt && (
                          <AssignmentTimer
                            assignedAt={delivery.assignedAt}
                            onExpired={() => {
                              // Vérifier si cette assignation a déjà expiré pour éviter les actions multiples
                              if (!expiredAssignments.has(delivery.id)) {
                                setExpiredAssignments(prev => new Set(prev).add(delivery.id));

                                toast({
                                  title: "Assignation expirée",
                                  description: "Rechargement automatique de la page en cours...",
                                  variant: "destructive",
                                });

                                // Rafraîchir la page après un court délai pour permettre au toast d'apparaître
                                setTimeout(() => {
                                  window.location.reload();
                                }, 2000);
                              }
                            }}
                          />
                        )}
                        <Badge variant={
                          delivery.status === 'assigned_pending_acceptance' ? 'destructive' :
                          delivery.status === 'in_transit' ? 'default' :
                          delivery.status === 'delivered' ? 'secondary' :
                          delivery.status === 'arrived_pending_confirmation' ? 'outline' : 'outline'
                        }>
                          {delivery.status === 'assigned_pending_acceptance' ? 'En attente d\'acceptation' :
                           delivery.status === 'in_transit' ? 'En livraison' :
                           delivery.status === 'delivered' ? 'Livrée' :
                           delivery.status === 'arrived_pending_confirmation' ? 'Arrivée en attente' : 'Assignée'}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      {delivery.pharmacy?.name || 'Pharmacie inconnue'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Informations Patient */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                        👤 Information Patient
                      </h4>
                      <p className="text-sm text-blue-700">
                        <strong>Nom:</strong> {delivery.patient?.firstName} {delivery.patient?.lastName}
                      </p>
                      <p className="text-sm text-blue-700">
                        <strong>Téléphone:</strong> {delivery.patient?.phone}
                      </p>
                    </div>

                    {/* Adresse de Livraison */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                        📍 Adresse de Livraison
                      </h4>
                      <p className="text-sm text-green-700">{delivery.deliveryAddress}</p>
                    </div>

                    {/* Informations de Livraison (sans détails médicaments) */}
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                        💊 Livraison Médicaments
                      </h4>
                      <p className="text-sm text-yellow-700">
                        <strong>Nombre d'articles:</strong> {delivery.medications?.length || 0} médicament(s)
                      </p>
                      <p className="text-sm text-yellow-700">
                        <strong>Type:</strong> Prescription médicale confidentielle
                      </p>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold">
                        <span>Montant à collecter:</span>
                        <span>{delivery.totalAmount || 0} FCFA</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {delivery.status === 'assigned_pending_acceptance' && (
                        <>
                          <Button
                            onClick={() => acceptAssignmentMutation.mutate(delivery.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={acceptAssignmentMutation.isPending || rejectAssignmentMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accepter
                          </Button>
                          <Button
                            onClick={() => rejectAssignmentMutation.mutate(delivery.id)}
                            variant="destructive"
                            className="flex-1"
                            disabled={acceptAssignmentMutation.isPending || rejectAssignmentMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Refuser
                          </Button>
                        </>
                      )}
                      {delivery.status === 'in_transit' && (
                        <>
                          <div className="flex-1">
                            <p className="text-sm text-blue-700 font-medium">
                              🚚 En route vers le client
                            </p>
                            <p className="text-sm text-blue-600 mt-1">
                              Livraison en cours
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => navigate("/delivery-map-livreur")}
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              🗺️ GPS
                            </Button>
                            <Button
                              onClick={() => confirmArrivalMutation.mutate(delivery.id)}
                              disabled={confirmArrivalMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {confirmArrivalMutation.isPending ? 'Confirmation...' : '📍 Confirmer arrivée'}
                            </Button>
                          </div>
                        </>
                      )}

                      {delivery.status === 'arrived_pending_confirmation' && (
                        <>
                          <div className="flex-1">
                            <p className="text-sm text-orange-700 font-medium">
                              ⏳ Arrivé sur place
                            </p>
                            <p className="text-sm text-orange-600 mt-1">
                              En attente de la confirmation du patient
                            </p>
                          </div>
                          <Button
                            onClick={() => navigate("/delivery-map-livreur")}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            🗺️ GPS
                          </Button>
                        </>
                      )}
                      {(delivery.status === 'assigned_pending_acceptance' || delivery.status === 'in_transit') && delivery.status !== 'in_transit' && (
                        <Button
                          onClick={() => navigate("/delivery-map-livreur")}
                          variant="outline"
                          className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          🗺️ Voir sur GPS
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedOrder(delivery)}
                            className="flex-1"
                          >
                            Voir Détails
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Détails de la Commande #{delivery.id.slice(0, 8)}</DialogTitle>
                            <DialogDescription>
                              Informations complètes de la livraison
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Statut</Label>
                              <Badge className="ml-2">
                                {delivery.status === 'in_delivery' ? 'En livraison' :
                                 delivery.status === 'delivered' ? 'Livrée' :
                                 delivery.status === 'ready_for_delivery' && delivery.deliveryPersonId === user?.id ? 'Assignée' :
                                 delivery.status === 'arrived_pending_confirmation' ? 'Arrivée en attente' : 'En attente'}
                              </Badge>
                            </div>
                            <div>
                              <Label>Patient</Label>
                              <p>{delivery.patient?.firstName} {delivery.patient?.lastName}</p>
                              <p className="text-sm text-gray-600">{delivery.patient?.phone}</p>
                            </div>
                            <div>
                              <Label>Adresse</Label>
                              <p>{delivery.deliveryAddress}</p>
                            </div>
                            <div>
                              <Label>Pharmacie</Label>
                              <p>{delivery.pharmacy?.name}</p>
                              <p className="text-sm text-gray-600">{delivery.pharmacy?.phone}</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              )) : []
            )}
          </TabsContent>

          {/* Gains */}
          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <CardTitle>💰 Mes Gains</CardTitle>
                <CardDescription>
                  Historique de vos revenus de livraison
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800">Gains Aujourd'hui</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {Array.isArray(myDeliveries) ? myDeliveries.filter((d: any) =>
                        d.status === 'delivered' &&
                        new Date(d.deliveredAt || d.updatedAt).toDateString() === new Date().toDateString()
                      ).length * 500 : 0} FCFA
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800">Total Livraisons</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {Array.isArray(myDeliveries) ? myDeliveries.filter((d: any) => d.status === 'delivered').length : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          
        </Tabs>
      </div>

      <BottomNavigation currentPage="delivery" />
    </div>
  );
}