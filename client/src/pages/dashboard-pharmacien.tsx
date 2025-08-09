import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";

export default function DashboardPharmacien() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("new-orders");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [medicationStatuses, setMedicationStatuses] = useState<Record<string, {available: boolean, surBon: boolean}>>({});

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

  // Mutation pour mettre à jour les médicaments
  const updateMedicationsMutation = useMutation({
    mutationFn: ({ orderId, medications }: { orderId: string; medications: any[] }) =>
      apiRequest(`/api/pharmacien/orders/${orderId}/medications`, {
        method: "POST",
        body: JSON.stringify({ medications }),
      }),
    onSuccess: () => {
      toast({
        title: "Médicaments mis à jour",
        description: "Les informations des médicaments ont été sauvegardées",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacien/orders"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les médicaments",
        variant: "destructive",
      });
    },
  });
  const { data: orders, isLoading: ordersLoading } = useQuery({ 
    queryKey: ["/api/pharmacien/orders"],
    refetchInterval: 5000 // Refresh every 5 seconds
  });
  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({ 
    queryKey: ["/api/pharmacien/prescriptions"],
    refetchInterval: 5000
  });

  const handleOrderUpdate = (orderId: string, status: string) => {
    updateOrderMutation.mutate({ orderId, status });
  };

  const handleMedicationUpdate = (orderId: string, medications: any[]) => {
    updateMedicationsMutation.mutate({ orderId, medications });
  };

  const toggleMedicationStatus = (orderId: string, medIndex: number, field: 'available' | 'surBon', value: boolean) => {
    const key = `${orderId}-${medIndex}`;
    setMedicationStatuses(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
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
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow" 
                  onClick={() => setActiveTab("orders")}
                  data-testid="card-nouvelles-commandes"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Nouvelles Commandes</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {ordersLoading ? "..." : (orders?.filter((o: any) => o.status === 'pending')?.length || 0)}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        🔔
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow" 
                  onClick={() => setActiveTab("preparation")}
                  data-testid="card-en-preparation"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">En Préparation</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {ordersLoading ? "..." : (orders?.filter((o: any) => o.status === 'confirmed' || o.status === 'preparing')?.length || 0)}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        ⚗️
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow" 
                  onClick={() => setActiveTab("preparation")}
                  data-testid="card-pretes"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Prêtes</p>
                        <p className="text-2xl font-bold text-green-600">
                          {ordersLoading ? "..." : (orders?.filter((o: any) => o.status === 'ready_for_delivery')?.length || 0)}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        ✅
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow" 
                  data-testid="card-livrees"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Livrées</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {ordersLoading ? "..." : (orders?.filter((o: any) => o.status === 'delivered')?.length || 0)}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        🚚
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {ordersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Chargement des commandes...</p>
                </div>
              ) : !orders || orders?.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      📋
                    </div>
                    <h3 className="font-semibold mb-2">Aucune commande</h3>
                    <p className="text-sm text-gray-600">Les commandes apparaîtront ici</p>
                  </CardContent>
                </Card>
              ) : orders?.map((order: any) => (
                <Card key={order.id} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Commande #{order.id.slice(0, 8)}
                      </CardTitle>
                      <Badge variant={order.status === 'pending' ? "secondary" : "outline"}>
                        {order.status === 'pending' ? 'Nouvelle' : 
                         order.status === 'confirmed' ? 'Confirmée' :
                         order.status === 'preparing' ? 'En préparation' :
                         order.status}
                      </Badge>
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
                    
                    {/* Médicaments demandés */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Médicaments demandés</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        {order.medications && typeof order.medications === 'string' ? (
                          JSON.parse(order.medications).map((med: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm py-1">
                              <span>{med.name}</span>
                              {med.surBon && <Badge variant="outline" className="text-xs">Sur BON</Badge>}
                            </div>
                          ))
                        ) : order.medications && Array.isArray(order.medications) ? (
                          order.medications.map((med: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm py-1">
                              <span>{med.name}</span>
                              {med.surBon && <Badge variant="outline" className="text-xs">Sur BON</Badge>}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">Aucun médicament spécifié</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 flex-wrap gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" data-testid={`button-view-prescription-${order.id}`}>
                            👁️ Voir Ordonnance
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Ordonnance - Commande #{order.id.slice(0, 8)}</DialogTitle>
                            <DialogDescription>
                              Patient: {order.user?.firstName} {order.user?.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Affichage de l'image d'ordonnance si disponible */}
                            {order.prescriptionId || (order.medications && JSON.stringify(order.medications).includes('prescriptionPhoto')) ? (
                              <div>
                                <h4 className="font-medium mb-2">Photo de l'ordonnance</h4>
                                <div className="border rounded-lg p-4 bg-gray-50">
                                  {order.prescriptionId && (
                                    <p className="text-sm text-gray-600 mb-2">Ordonnance ID: {order.prescriptionId}</p>
                                  )}
                                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <span className="text-4xl mb-2 block">📄</span>
                                    <p className="text-sm text-gray-500">Photo de l'ordonnance uploadée</p>
                                    <p className="text-xs text-gray-400 mt-1">Cliquez pour agrandir l'image</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <h4 className="font-medium mb-2">Commande sans ordonnance</h4>
                                <div className="border rounded-lg p-4 bg-yellow-50">
                                  <p className="text-sm text-yellow-700">Cette commande a été passée sans ordonnance photographiée.</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Gestion des médicaments */}
                            <div>
                              <h4 className="font-medium mb-3">Gestion des médicaments</h4>
                              <div className="space-y-3">
                                {order.medications && typeof order.medications === 'string' ? (
                                  JSON.parse(order.medications).map((med: any, index: number) => {
                                    const statusKey = `${order.id}-${index}`;
                                    const currentStatus = medicationStatuses[statusKey] || { available: true, surBon: med.surBon || false };
                                    
                                    return (
                                      <div key={index} className="border rounded-lg p-4 bg-white">
                                        <div className="flex items-center justify-between mb-3">
                                          <h5 className="font-medium">{med.name}</h5>
                                          <Badge variant={currentStatus.available ? "default" : "destructive"}>
                                            {currentStatus.available ? "Disponible" : "Indisponible"}
                                          </Badge>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="flex items-center space-x-2">
                                            <Switch
                                              id={`available-${statusKey}`}
                                              checked={currentStatus.available}
                                              onCheckedChange={(checked) => 
                                                toggleMedicationStatus(order.id, index, 'available', checked)
                                              }
                                            />
                                            <Label htmlFor={`available-${statusKey}`} className="text-sm">
                                              Disponible en stock
                                            </Label>
                                          </div>
                                          
                                          <div className="flex items-center space-x-2">
                                            <Switch
                                              id={`surbon-${statusKey}`}
                                              checked={currentStatus.surBon}
                                              onCheckedChange={(checked) => 
                                                toggleMedicationStatus(order.id, index, 'surBon', checked)
                                              }
                                            />
                                            <Label htmlFor={`surbon-${statusKey}`} className="text-sm">
                                              Sur BON (remboursable)
                                            </Label>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : order.medications && Array.isArray(order.medications) ? (
                                  order.medications.map((med: any, index: number) => {
                                    const statusKey = `${order.id}-${index}`;
                                    const currentStatus = medicationStatuses[statusKey] || { available: true, surBon: med.surBon || false };
                                    
                                    return (
                                      <div key={index} className="border rounded-lg p-4 bg-white">
                                        <div className="flex items-center justify-between mb-3">
                                          <h5 className="font-medium">{med.name}</h5>
                                          <Badge variant={currentStatus.available ? "default" : "destructive"}>
                                            {currentStatus.available ? "Disponible" : "Indisponible"}
                                          </Badge>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="flex items-center space-x-2">
                                            <Switch
                                              id={`available-${statusKey}`}
                                              checked={currentStatus.available}
                                              onCheckedChange={(checked) => 
                                                toggleMedicationStatus(order.id, index, 'available', checked)
                                              }
                                            />
                                            <Label htmlFor={`available-${statusKey}`} className="text-sm">
                                              Disponible en stock
                                            </Label>
                                          </div>
                                          
                                          <div className="flex items-center space-x-2">
                                            <Switch
                                              id={`surbon-${statusKey}`}
                                              checked={currentStatus.surBon}
                                              onCheckedChange={(checked) => 
                                                toggleMedicationStatus(order.id, index, 'surBon', checked)
                                              }
                                            />
                                            <Label htmlFor={`surbon-${statusKey}`} className="text-sm">
                                              Sur BON (remboursable)
                                            </Label>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <p className="text-sm text-gray-500">Aucun médicament spécifié</p>
                                )}
                              </div>
                              
                              <div className="flex space-x-2 mt-4 pt-4 border-t">
                                <Button
                                  onClick={() => {
                                    const medications = order.medications && typeof order.medications === 'string' 
                                      ? JSON.parse(order.medications) 
                                      : order.medications || [];
                                    
                                    const updatedMeds = medications.map((med: any, index: number) => {
                                      const statusKey = `${order.id}-${index}`;
                                      const status = medicationStatuses[statusKey] || { available: true, surBon: med.surBon || false };
                                      return { ...med, ...status };
                                    });
                                    
                                    handleMedicationUpdate(order.id, updatedMeds);
                                  }}
                                  disabled={updateMedicationsMutation.isPending}
                                >
                                  💾 Sauvegarder les modifications
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
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
                  {prescriptionsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Chargement des prescriptions...</p>
                    </div>
                  ) : prescriptions?.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        🔍
                      </div>
                      <h3 className="font-semibold mb-2">Aucune prescription à vérifier</h3>
                      <p className="text-sm text-gray-600">Les prescriptions à vérifier apparaîtront ici</p>
                    </div>
                  ) : prescriptions?.map((prescription: any) => (
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