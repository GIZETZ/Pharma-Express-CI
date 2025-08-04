import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPatient() {
  const { data: user } = useQuery({ queryKey: ["/api/auth/user"] });
  const { data: orders } = useQuery({ queryKey: ["/api/orders"] });
  const { data: pharmacies } = useQuery({ queryKey: ["/api/pharmacies"] });

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
                  <Button data-testid="button-new-order">
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
                        <Button className="w-full mt-3" size="sm">
                          Sélectionner
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
    </div>
  );
}