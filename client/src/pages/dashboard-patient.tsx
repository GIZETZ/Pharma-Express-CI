import { useState } from "react";
import { Link } from "wouter";
import { Plus, MapPin, Clock, Package, User, Camera, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPatient() {
  const { user } = useAuth();
  const [currentOrder] = useState({
    id: "ORD-001",
    pharmacy: "Pharmacie de la Paix",
    status: "en_transit",
    estimatedTime: "15 min",
    total: "12,500 FCFA"
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "preparing": return "bg-orange-100 text-orange-800";
      case "en_transit": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "En attente";
      case "confirmed": return "Confirmée";
      case "preparing": return "En préparation";
      case "en_transit": return "En livraison";
      case "delivered": return "Livrée";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">YahoPharma+</h1>
            <p className="text-blue-100">Bonjour {user?.firstName}</p>
          </div>
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="text-white" data-testid="button-profile">
              <User className="h-6 w-6" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Actions rapides */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/camera">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="card-upload-prescription">
              <CardContent className="p-6 text-center">
                <Camera className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold">Envoyer ordonnance</h3>
                <p className="text-sm text-gray-600 mt-1">Photographier votre prescription</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pharmacies">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="card-find-pharmacy">
              <CardContent className="p-6 text-center">
                <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold">Localiser pharmacie</h3>
                <p className="text-sm text-gray-600 mt-1">Trouver près de vous</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Commande en cours */}
        {currentOrder && (
          <Card data-testid="card-current-order">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Commande en cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{currentOrder.pharmacy}</span>
                  <Badge className={getStatusColor(currentOrder.status)}>
                    {getStatusText(currentOrder.status)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {currentOrder.estimatedTime}
                  </span>
                  <span className="font-semibold text-gray-900">{currentOrder.total}</span>
                </div>
                <Link href="/delivery">
                  <Button className="w-full" data-testid="button-track-delivery">
                    Suivre la livraison
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historique récent */}
        <Card data-testid="card-recent-orders">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Commandes récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium">Pharmacie du Plateau</p>
                  <p className="text-sm text-gray-600">Hier, 14:30</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-800">Livrée</Badge>
                  <p className="text-sm font-semibold mt-1">8,750 FCFA</p>
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <div>
                  <p className="font-medium">Pharmacie Moderne</p>
                  <p className="text-sm text-gray-600">3 jours</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-800">Livrée</Badge>
                  <p className="text-sm font-semibold mt-1">15,200 FCFA</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations utiles */}
        <Card className="bg-blue-50 border-blue-200" data-testid="card-info">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Information importante</h3>
            <p className="text-blue-800 text-sm">
              Les livraisons sont effectuées de 8h à 20h du lundi au samedi. 
              Frais de livraison: 500 FCFA pour toute commande.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}