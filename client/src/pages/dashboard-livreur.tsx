import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export default function DashboardLivreur() {
  const [isAvailable, setIsAvailable] = useState(true);
  const { data: user } = useQuery({ queryKey: ["/api/auth/user"] });
  const { data: deliveries } = useQuery({ queryKey: ["/api/livreur/deliveries"] });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-600 mb-2">
            🚴 Tableau de bord Livreur
          </h1>
          <p className="text-gray-600">
            Bienvenue {user?.firstName} ! Gérez vos livraisons (500 FCFA fixe par mission)
          </p>
        </div>

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
                data-testid="switch-availability"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="missions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="missions">
              Nouvelles Missions
              {deliveries?.filter((d: any) => d.status === 'available')?.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {deliveries.filter((d: any) => d.status === 'available').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Livraisons Actives</TabsTrigger>
            <TabsTrigger value="earnings">Mes Gains</TabsTrigger>
          </TabsList>

          {/* Nouvelles Missions */}
          <TabsContent value="missions">
            <div className="space-y-4">
              {/* Statistiques du jour */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Missions Disponibles</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {deliveries?.filter((d: any) => d.status === 'available')?.length || 0}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        📦
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">En Cours</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {deliveries?.filter((d: any) => d.status === 'in_transit')?.length || 0}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        🚴
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Livrées Aujourd'hui</p>
                        <p className="text-2xl font-bold text-green-600">
                          {deliveries?.filter((d: any) => 
                            d.status === 'delivered' && 
                            new Date(d.deliveredAt).toDateString() === new Date().toDateString()
                          )?.length || 0}
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
                        <p className="text-sm font-medium text-gray-600">Gains du Jour</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {(deliveries?.filter((d: any) => 
                            d.status === 'delivered' && 
                            new Date(d.deliveredAt).toDateString() === new Date().toDateString()
                          )?.length || 0) * 500} FCFA
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        💰
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Missions disponibles */}
              {isAvailable ? (
                <div className="space-y-4">
                  {deliveries?.filter((delivery: any) => delivery.status === 'available').map((delivery: any) => (
                    <Card key={delivery.id} className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Mission #{delivery.id.slice(0, 8)}
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">500 FCFA</Badge>
                            <Badge>Disponible</Badge>
                          </div>
                        </div>
                        <CardDescription>
                          Distance estimée: {delivery.distance || '2.5'} km • Temps: {delivery.estimatedTime || '15'} min
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">📍 Récupération</p>
                            <p className="text-sm text-gray-600">{delivery.pharmacy?.name}</p>
                            <p className="text-xs text-gray-500">{delivery.pharmacy?.address}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">🏠 Livraison</p>
                            <p className="text-sm text-gray-600">{delivery.customer?.name}</p>
                            <p className="text-xs text-gray-500">{delivery.deliveryAddress}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Contact client:</span> {delivery.customer?.phone}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`button-accept-delivery-${delivery.id}`}
                            >
                              ✅ Accepter Mission
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              data-testid={`button-view-route-${delivery.id}`}
                            >
                              🗺️ Voir Itinéraire
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {(!deliveries || deliveries.filter((d: any) => d.status === 'available').length === 0) && (
                    <Card>
                      <CardContent className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          📦
                        </div>
                        <h3 className="font-semibold mb-2">Aucune mission disponible</h3>
                        <p className="text-sm text-gray-600">
                          Restez connecté, de nouvelles missions apparaîtront bientôt
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      🔴
                    </div>
                    <h3 className="font-semibold mb-2">Statut: Indisponible</h3>
                    <p className="text-sm text-gray-600">
                      Activez votre disponibilité pour recevoir des missions de livraison
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Livraisons Actives */}
          <TabsContent value="active">
            <div className="space-y-4">
              {deliveries?.filter((delivery: any) => delivery.status === 'in_transit').map((delivery: any) => (
                <Card key={delivery.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Livraison en Cours #{delivery.id.slice(0, 8)}
                      </CardTitle>
                      <Badge className="bg-blue-600">En Transit</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progression</span>
                        <span className="text-sm text-gray-600">75%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Client</p>
                        <p className="text-sm text-gray-600">{delivery.customer?.name}</p>
                        <p className="text-xs text-gray-500">{delivery.customer?.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Adresse</p>
                        <p className="text-sm text-gray-600">{delivery.deliveryAddress}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        ✅ Livraison Effectuée
                      </Button>
                      <Button size="sm" variant="outline">
                        📞 Appeler Client
                      </Button>
                      <Button size="sm" variant="outline">
                        🗺️ Navigation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Mes Gains */}
          <TabsContent value="earnings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>💰 Tarification Fixe</CardTitle>
                  <CardDescription>500 FCFA pour chaque livraison</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium">Tarif par livraison</span>
                      <span className="text-xl font-bold text-purple-600">500 FCFA</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>• Tarif fixe garanti par livraison</p>
                      <p>• Pas de frais cachés</p>
                      <p>• Paiement sécurisé</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📊 Historique des Gains</CardTitle>
                  <CardDescription>Vos performances cette semaine</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Aujourd'hui</span>
                      <span className="font-semibold">
                        {(deliveries?.filter((d: any) => 
                          d.status === 'delivered' && 
                          new Date(d.deliveredAt).toDateString() === new Date().toDateString()
                        )?.length || 0) * 500} FCFA
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cette semaine</span>
                      <span className="font-semibold">
                        {(deliveries?.filter((d: any) => d.status === 'delivered')?.length || 0) * 500} FCFA
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Ce mois</span>
                      <span className="font-semibold">
                        {(deliveries?.filter((d: any) => d.status === 'delivered')?.length || 0) * 500} FCFA
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}