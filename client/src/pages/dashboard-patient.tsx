import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";

export default function DashboardPatient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pharmacies");
  const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);
  const [orderData, setOrderData] = useState({
    deliveryAddress: '',
    notes: '',
    totalAmount: 0
  });

  // Mutation pour créer une commande
  const createOrderMutation = useMutation({
    mutationFn: (orderDetails: any) =>
      apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify(orderDetails),
      }),
    onSuccess: () => {
      toast({
        title: "Commande créée",
        description: "Votre commande a été envoyée à la pharmacie",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setActiveTab("orders");
      setSelectedPharmacy(null);
      setOrderData({ deliveryAddress: '', notes: '', totalAmount: 0 });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande",
        variant: "destructive",
      });
    },
  });

  const { data: orders } = useQuery({ queryKey: ["/api/orders"] });
  const { data: pharmacies } = useQuery({ queryKey: ["/api/pharmacies"] });

  const handleCreateOrder = () => {
    if (selectedPharmacy && orderData.deliveryAddress && orderData.totalAmount > 0) {
      createOrderMutation.mutate({
        pharmacyId: selectedPharmacy.id,
        deliveryAddress: orderData.deliveryAddress,
        notes: orderData.notes,
        totalAmount: orderData.totalAmount,
        status: 'pending'
      });
    } else {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            👥 Tableau de bord Patient
          </h1>
          <p className="text-gray-600">
            Bienvenue {user?.firstName} ! Gérez vos commandes et ordonnances
          </p>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Mes Commandes</TabsTrigger>
            <TabsTrigger value="prescriptions">Ordonnances</TabsTrigger>
            <TabsTrigger value="pharmacies">Pharmacies</TabsTrigger>
            <TabsTrigger value="tracking">Suivi Livraison</TabsTrigger>
          </TabsList>

          {/* Mes Commandes */}
          <TabsContent value="orders">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Créer une Commande</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Envoyez votre ordonnance et passez commande
                  </p>
                  <Button data-testid="button-new-order" onClick={() => setActiveTab("pharmacies")}>
                    Nouvelle Commande
                  </Button>
                </CardContent>
              </Card>

              {orders?.map((order: any) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Commande #{order.id.slice(0, 8)}</CardTitle>
                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Pharmacie:</strong> {order.pharmacy?.name}</p>
                      <p className="text-sm"><strong>Montant:</strong> {order.totalAmount} FCFA</p>
                      <p className="text-sm"><strong>Statut:</strong> {order.status}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Ordonnances */}
          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle>📋 Envoyer une Ordonnance</CardTitle>
                <CardDescription>
                  Téléchargez une photo de votre ordonnance médicale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    📷
                  </div>
                  <h3 className="font-semibold mb-2">Prendre une Photo</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Photographiez votre ordonnance ou sélectionnez une image
                  </p>
                  <div className="space-y-2">
                    <Button data-testid="button-camera">📷 Utiliser la Caméra</Button>
                    <Button variant="outline" data-testid="button-upload">📁 Choisir un Fichier</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Localiser Pharmacie */}
          <TabsContent value="pharmacies">
            <Card>
              <CardHeader>
                <CardTitle>🏥 Localiser une Pharmacie</CardTitle>
                <CardDescription>
                  Trouvez les pharmacies les plus proches de vous
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pharmacies?.map((pharmacy: any) => (
                    <Card key={pharmacy.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{pharmacy.name}</h4>
                            <p className="text-sm text-gray-600">{pharmacy.address}</p>
                          </div>
                          <Badge variant={pharmacy.isOpen ? 'default' : 'secondary'}>
                            {pharmacy.isOpen ? 'Ouvert' : 'Fermé'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>⭐ {pharmacy.rating}/5</span>
                          <span>🚚 {pharmacy.deliveryTime} min</span>
                        </div>
                        <Button className="w-full mt-3" size="sm" onClick={() => setSelectedPharmacy(pharmacy)}>
                          Sélectionner
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {selectedPharmacy && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold">Commande à la pharmacie: {selectedPharmacy.name}</h3>
                    <Input
                      type="text"
                      placeholder="Adresse de livraison"
                      value={orderData.deliveryAddress}
                      onChange={(e) => setOrderData({ ...orderData, deliveryAddress: e.target.value })}
                      className="mb-2"
                    />
                    <Textarea
                      placeholder="Notes supplémentaires"
                      value={orderData.notes}
                      onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                      className="mb-2"
                    />
                    <Input
                      type="number"
                      placeholder="Montant total"
                      value={orderData.totalAmount}
                      onChange={(e) => setOrderData({ ...orderData, totalAmount: parseFloat(e.target.value) })}
                      className="mb-2"
                    />
                    <Button onClick={handleCreateOrder} disabled={createOrderMutation.isPending}>
                      {createOrderMutation.isPending ? "En cours..." : "Confirmer la commande"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suivi Livraison */}
          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle>🚚 Suivre ma Livraison</CardTitle>
                <CardDescription>
                  Suivez en temps réel vos livraisons en cours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    📦
                  </div>
                  <h3 className="font-semibold mb-2">Aucune livraison en cours</h3>
                  <p className="text-sm text-gray-600">
                    Vos livraisons actives apparaîtront ici avec suivi en temps réel
                  </p>
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