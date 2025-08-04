import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";

export default function DashboardPharmacien() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("new-orders");

  // Mutation pour mettre à jour le statut des commandes
  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      apiRequest(`/api/pharmacien/orders/${orderId}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (data, variables) => {
      toast({
        title: "Commande mise à jour",
        description: `Commande ${variables.status === 'confirmed' ? 'validée' : variables.status === 'rejected' ? 'rejetée' : 'mise à jour'} avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacien/orders"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la commande",
        variant: "destructive",
      });
    },
  });
  const { data: orders } = useQuery({ queryKey: ["/api/pharmacien/orders"] });
  const { data: prescriptions } = useQuery({ queryKey: ["/api/pharmacien/prescriptions"] });
  const { data: user } = useQuery({ queryKey: ["/api/auth/user"] });

  const handleOrderUpdate = (orderId: string, status: string) => {
    updateOrderMutation.mutate({ orderId, status });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            💊 Tableau de bord Pharmacien
          </h1>
          <p className="text-gray-600">
            Bienvenue Dr. {user?.firstName} ! Gérez votre pharmacie et les commandes
          </p>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">
              Réception Commandes
              {orders?.filter((o: any) => o.status === 'pending')?.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {orders.filter((o: any) => o.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="prescriptions">Vérification</TabsTrigger>
            <TabsTrigger value="pricing">Prix & Alternatives</TabsTrigger>
            <TabsTrigger value="preparation">Validation & Préparation</TabsTrigger>
          </TabsList>

          {/* Réception des Commandes */}
          <TabsContent value="orders">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Nouvelles Commandes</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {orders?.filter((o: any) => o.status === 'pending')?.length || 0}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        🔔
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">En Préparation</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {orders?.filter((o: any) => o.status === 'preparing')?.length || 0}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        ⚗️
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Prêtes</p>
                        <p className="text-2xl font-bold text-green-600">
                          {orders?.filter((o: any) => o.status === 'ready')?.length || 0}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        ✅
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Livrées</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {orders?.filter((o: any) => o.status === 'delivered')?.length || 0}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        🚚
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {orders?.filter((order: any) => order.status === 'pending').map((order: any) => (
                <Card key={order.id} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Commande #{order.id.slice(0, 8)}
                      </CardTitle>
                      <Badge variant="secondary">Nouvelle</Badge>
                    </div>
                    <CardDescription>
                      Patient: {order.user?.firstName} {order.user?.lastName} • {order.user?.phone}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Adresse de livraison</p>
                        <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Date de commande</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" data-testid={`button-view-prescription-${order.id}`}>
                        👁️ Voir Ordonnance
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-accept-order-${order.id}`}
                        onClick={() => handleOrderUpdate(order.id, 'confirmed')}
                        disabled={updateOrderMutation.isPending}
                      >
                        ✅ Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        data-testid={`button-reject-order-${order.id}`}
                        onClick={() => handleOrderUpdate(order.id, 'rejected')}
                        disabled={updateOrderMutation.isPending}
                      >
                        ❌ Refuser
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Vérification des Médicaments */}
          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle>🔍 Vérification des Médicaments</CardTitle>
                <CardDescription>
                  Vérifiez la disponibilité et conformité des médicaments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prescriptions?.map((prescription: any) => (
                    <div key={prescription.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">Ordonnance #{prescription.id.slice(0, 8)}</h4>
                          <p className="text-sm text-gray-600">
                            Patient: {prescription.user?.firstName} {prescription.user?.lastName}
                          </p>
                        </div>
                        <Badge variant="outline">À vérifier</Badge>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium mb-2">Médicaments prescrits:</p>
                        <div className="space-y-1">
                          {prescription.medications?.map((med: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{med.name} - {med.dosage}</span>
                              <Badge variant={med.available ? "default" : "destructive"}>
                                {med.available ? "Disponible" : "Indisponible"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleOrderUpdate(prescription.id, 'confirmed')}
                          disabled={updateOrderMutation.isPending}
                        >
                          ✅ Valider
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleOrderUpdate(prescription.id, 'rejected')}
                          disabled={updateOrderMutation.isPending}
                        >
                          ❌ Rejeter
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Proposition de Prix et Alternatives */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>💰 Proposition de Prix & Alternatives</CardTitle>
                <CardDescription>
                  Définissez les prix et proposez des alternatives si nécessaire
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    💰
                  </div>
                  <h3 className="font-semibold mb-2">Module de Tarification</h3>
                  <p className="text-sm text-gray-600">
                    Fonctionnalité de gestion des prix en développement
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validation et Préparation */}
          <TabsContent value="preparation">
            <Card>
              <CardHeader>
                <CardTitle>⚗️ Validation & Préparation</CardTitle>
                <CardDescription>
                  Finalisez la préparation des commandes validées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders?.filter((order: any) => order.status === 'confirmed').map((order: any) => (
                    <div key={order.id} className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">Commande #{order.id.slice(0, 8)}</h4>
                          <p className="text-sm text-gray-600">
                            Patient: {order.user?.firstName} {order.user?.lastName}
                          </p>
                        </div>
                        <Badge>En préparation</Badge>
                      </div>

                      <div className="flex items-center space-x-4 mb-3">
                        <div className="text-sm">
                          <span className="font-medium">Montant total:</span> {order.totalAmount} FCFA
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Adresse:</span> {order.deliveryAddress}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleOrderUpdate(order.id, 'ready_for_delivery')}
                          disabled={updateOrderMutation.isPending}
                        >
                          📦 Prêt pour livraison
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}