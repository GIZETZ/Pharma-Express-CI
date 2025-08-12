import { useState } from "react";
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
import BottomNavigation from "@/components/bottom-navigation";

export default function DashboardLivreur() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("my-deliveries");
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Récupérer les commandes assignées à ce livreur
  const { data: myDeliveries, isLoading: loadingMyDeliveries } = useQuery({
    queryKey: ["/api/livreur/deliveries"],
    enabled: true,
    select: (data) => {
      // Filter deliveries that are assigned to this user
      return data?.filter((delivery: any) => 
        delivery.deliveryPersonId === user?.id && 
        (delivery.status === 'ready_for_delivery' || 
         delivery.status === 'in_delivery' || 
         delivery.status === 'delivered')
      ) || [];
    }
  });

  // Récupérer les livraisons disponibles
  const { data: availableDeliveries, isLoading: loadingAvailable } = useQuery({
    queryKey: ["/api/livreur/available-deliveries"],
    enabled: isAvailable
  });

  // Récupérer les notifications
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: true
  });

  // Mutation pour accepter une livraison
  const acceptDeliveryMutation = useMutation({
    mutationFn: (orderId: string) =>
      apiRequest("POST", `/api/livreur/deliveries/${orderId}/accept`),
    onSuccess: () => {
      toast({
        title: "Livraison acceptée",
        description: "Vous pouvez maintenant effectuer cette livraison",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/livreur/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/livreur/available-deliveries"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'accepter cette livraison",
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

  if (loadingMyDeliveries && loadingAvailable) {
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
              {/* Section Debug temporaire */}
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <p><strong>Debug Info:</strong></p>
                <p>User ID: {user?.id}</p>
                <p>Total deliveries: {myDeliveries?.length || 0}</p>
                <p>Loading: {loadingMyDeliveries ? 'Oui' : 'Non'}</p>
                <p>Error: {error ? 'Oui' : 'Non'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Résumé des notifications */}
        {notifications && notifications.length > 0 && (
          <Card className="mb-6 bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  🔔
                </div>
                <div>
                  <h3 className="font-semibold text-purple-800">Nouvelles notifications</h3>
                  <p className="text-sm text-purple-600">
                    {notifications.filter((n: any) => !n.isRead).length} nouvelles notifications
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-deliveries">
              Mes Livraisons
              {myDeliveries && myDeliveries.length > 0 && (
                <Badge variant="default" className="ml-2 bg-purple-600">
                  {myDeliveries.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="available">
              Missions Disponibles
              {availableDeliveries && availableDeliveries.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {availableDeliveries.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="earnings">Mes Gains</TabsTrigger>
          </TabsList>

          {/* Mes Livraisons Assignées */}
          <TabsContent value="my-deliveries" className="space-y-4">
            {!myDeliveries || myDeliveries.length === 0 ? (
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
              myDeliveries.map((delivery: any) => (
                <Card key={delivery.id} className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Commande #{delivery.id.slice(0, 8)}
                      </CardTitle>
                      <Badge variant={
                        delivery.status === 'in_delivery' ? 'default' : 
                        delivery.status === 'delivered' ? 'secondary' : 
                        delivery.status === 'ready_for_delivery' && delivery.deliveryPersonId === user?.id ? 'outline' : 'destructive'
                      }>
                        {delivery.status === 'in_delivery' ? 'En livraison' : 
                         delivery.status === 'delivered' ? 'Livrée' : 
                         delivery.status === 'ready_for_delivery' && delivery.deliveryPersonId === user?.id ? 'Assignée' : 'En attente'}
                      </Badge>
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

                    {/* Médicaments */}
                    {delivery.medications && delivery.medications.length > 0 && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                          💊 Médicaments à Livrer
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {delivery.medications.map((med: any, index: number) => (
                            <li key={index} className="flex justify-between">
                              <span>{med.name} (Qté: {med.quantity})</span>
                              <span className="font-semibold">{med.price} FCFA</span>
                            </li>
                          ))}
                        </ul>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span>{delivery.totalAmount || 0} FCFA</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {delivery.status === 'ready_for_delivery' && delivery.deliveryPersonId === user?.id && (
                        <Button
                          onClick={() => handleUpdateDeliveryStatus(delivery.id, 'in_delivery')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          disabled={updateDeliveryMutation.isPending}
                        >
                          Commencer la Livraison 🚀
                        </Button>
                      )}
                      {delivery.status === 'in_delivery' && (
                        <Button
                          onClick={() => handleUpdateDeliveryStatus(delivery.id, 'delivered')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          disabled={updateDeliveryMutation.isPending}
                        >
                          Marquer comme Livrée ✅
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
                                 delivery.status === 'ready_for_delivery' && delivery.deliveryPersonId === user?.id ? 'Assignée' : 'En attente'}
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
              ))
            )}
          </TabsContent>

          {/* Missions Disponibles */}
          <TabsContent value="available" className="space-y-4">
            {!availableDeliveries || availableDeliveries.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    🚴
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Aucune mission disponible
                  </h3>
                  <p className="text-gray-500">
                    Les nouvelles missions apparaîtront ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              availableDeliveries.map((delivery: any) => (
                <Card key={delivery.id} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Mission #{delivery.id.slice(0, 8)}
                      </CardTitle>
                      <Badge variant="destructive">
                        Disponible
                      </Badge>
                    </div>
                    <CardDescription>
                      {delivery.pharmacy?.name} • +500 FCFA
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Distance</Label>
                        <p className="text-sm">≈ 2-5 km</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Montant</Label>
                        <p className="text-sm font-semibold">{delivery.totalAmount || 0} FCFA</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Adresse de livraison</Label>
                      <p className="text-sm">{delivery.deliveryAddress}</p>
                    </div>
                    <Button
                      onClick={() => handleAcceptDelivery(delivery.id)}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      disabled={acceptDeliveryMutation.isPending}
                    >
                      Accepter cette Mission 🚴
                    </Button>
                  </CardContent>
                </Card>
              ))
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
                      {myDeliveries ? myDeliveries.filter((d: any) => 
                        d.status === 'delivered' && 
                        new Date(d.deliveredAt || d.updatedAt).toDateString() === new Date().toDateString()
                      ).length * 500 : 0} FCFA
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800">Total Livraisons</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {myDeliveries ? myDeliveries.filter((d: any) => d.status === 'delivered').length : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}