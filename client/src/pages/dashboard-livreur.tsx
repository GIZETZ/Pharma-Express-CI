import { useState } from "react";
import { Link } from "wouter";
import { MapPin, Package, Clock, Navigation, User, CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLivreur() {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [currentDelivery] = useState({
    id: "DEL-001",
    orderNumber: "ORD-003",
    customer: "Marie Kone",
    customerPhone: "+225 05 66 77 88",
    pickup: "Pharmacie de la Paix",
    pickupAddress: "Avenue Félix Houphouët-Boigny",
    delivery: "Cocody Riviera",
    deliveryAddress: "Résidence Les Palmiers, Villa 12",
    estimatedTime: "20 min",
    amount: "12,500 FCFA",
    commission: "500 FCFA",
    status: "pickup_ready"
  });

  const [availableDeliveries] = useState([
    {
      id: "DEL-002",
      orderNumber: "ORD-004",
      pharmacy: "Pharmacie du Plateau", 
      customer: "Kofi Asante",
      distance: "2.5 km",
      deliveryAddress: "Marcory Zone 4",
      amount: "8,750 FCFA",
      commission: "500 FCFA",
      priority: "normal"
    },
    {
      id: "DEL-003",
      orderNumber: "ORD-005",
      pharmacy: "Pharmacie Moderne",
      customer: "Aya Diallo",
      distance: "1.8 km", 
      deliveryAddress: "Treichville",
      amount: "15,200 FCFA",
      commission: "500 FCFA",
      priority: "urgent"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pickup_ready": return "bg-blue-100 text-blue-800";
      case "in_transit": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pickup_ready": return "Prêt à récupérer";
      case "in_transit": return "En livraison";
      case "delivered": return "Livré";
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "normal": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">YahoPharma+ Livreur</h1>
            <p className="text-purple-100">{user?.firstName} {user?.lastName}</p>
          </div>
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="text-white" data-testid="button-profile">
              <User className="h-6 w-6" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Statut de disponibilité */}
        <Card data-testid="card-availability">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">
                  {isAvailable ? 'Disponible pour livraisons' : 'Non disponible'}
                </span>
              </div>
              <Switch 
                checked={isAvailable} 
                onCheckedChange={setIsAvailable}
                data-testid="switch-availability"
              />
            </div>
          </CardContent>
        </Card>

        {/* Statistiques du jour */}
        <div className="grid grid-cols-3 gap-4">
          <Card data-testid="card-stats-deliveries">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">8</div>
              <div className="text-sm text-gray-600">Livraisons</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stats-earnings">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">4,000</div>
              <div className="text-sm text-gray-600">FCFA gagnés</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stats-rating">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                4.9 <Star className="h-4 w-4 fill-current" />
              </div>
              <div className="text-sm text-gray-600">Note moyenne</div>
            </CardContent>
          </Card>
        </div>

        {/* Livraison en cours */}
        {currentDelivery && (
          <Card className="border-l-4 border-l-purple-500" data-testid="card-current-delivery">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Livraison en cours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{currentDelivery.customer}</span>
                <Badge className={getStatusColor(currentDelivery.status)}>
                  {getStatusText(currentDelivery.status)}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Récupération:</p>
                    <p className="text-gray-600">{currentDelivery.pickup}</p>
                    <p className="text-gray-500">{currentDelivery.pickupAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Livraison:</p>
                    <p className="text-gray-600">{currentDelivery.deliveryAddress}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-sm">
                  <p className="text-gray-600">Montant: {currentDelivery.amount}</p>
                  <p className="font-medium text-green-600">Votre gain: {currentDelivery.commission}</p>
                </div>
                <div className="text-sm text-gray-600">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {currentDelivery.estimatedTime}
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" data-testid="button-navigate">
                  <Navigation className="h-4 w-4 mr-2" />
                  Naviguer
                </Button>
                <Button variant="outline" data-testid="button-contact-customer">
                  Contacter
                </Button>
              </div>

              {currentDelivery.status === "pickup_ready" && (
                <Button className="w-full" variant="secondary" data-testid="button-confirm-pickup">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmer récupération
                </Button>
              )}

              {currentDelivery.status === "in_transit" && (
                <Button className="w-full" data-testid="button-confirm-delivery">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmer livraison
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Livraisons disponibles */}
        {isAvailable && availableDeliveries.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Livraisons disponibles</h2>
            <div className="space-y-4">
              {availableDeliveries.map((delivery) => (
                <Card key={delivery.id} className="border-l-4 border-l-blue-500" data-testid={`card-available-${delivery.id}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium">{delivery.customer}</h3>
                        <p className="text-sm text-gray-600">{delivery.pharmacy}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(delivery.priority)}>
                          {delivery.priority === "urgent" ? "Urgent" : "Normal"}
                        </Badge>
                        <Badge variant="outline">{delivery.distance}</Badge>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      <p className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {delivery.deliveryAddress}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <p className="text-gray-600">Montant: {delivery.amount}</p>
                        <p className="font-medium text-green-600">Gain: {delivery.commission}</p>
                      </div>
                      <Button size="sm" data-testid={`button-accept-${delivery.id}`}>
                        Accepter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Information tarification */}
        <Card className="bg-purple-50 border-purple-200" data-testid="card-pricing-info">
          <CardContent className="p-4">
            <h3 className="font-semibold text-purple-900 mb-2">Tarification fixe</h3>
            <p className="text-purple-800 text-sm">
              500 FCFA par livraison effectuée. Paiement quotidien automatique. 
              Bonus de performance disponibles selon vos évaluations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}