import { useState } from "react";
import { Link } from "wouter";
import { BarChart3, Users, Package, MapPin, Settings, User, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardAdmin() {
  const { user } = useAuth();

  const [systemStats] = useState({
    totalUsers: 1247,
    activeOrders: 23,
    totalPharmacies: 45,
    activeDeliverers: 12,
    dailyRevenue: "2,450,000",
    monthlyGrowth: "+15.2%"
  });

  const [recentActivity] = useState([
    {
      id: 1,
      type: "new_user",
      message: "Nouveau patient inscrit: Kouame Jean",
      time: "Il y a 5 min",
      severity: "info"
    },
    {
      id: 2,
      type: "order_issue",
      message: "Problème de livraison signalé - ORD-456",
      time: "Il y a 12 min",
      severity: "warning"
    },
    {
      id: 3,
      type: "pharmacy_join",
      message: "Nouvelle pharmacie: Pharmacie Saint-Joseph",
      time: "Il y a 1h",
      severity: "success"
    },
    {
      id: 4,
      type: "delivery_issue",
      message: "Livreur Jean-Claude signale une panne",
      time: "Il y a 2h",
      severity: "error"
    }
  ]);

  const [topPharmacies] = useState([
    { name: "Pharmacie de la Paix", orders: 156, revenue: "1,250,000 FCFA", rating: 4.8 },
    { name: "Pharmacie du Plateau", orders: 142, revenue: "1,180,000 FCFA", rating: 4.6 },
    { name: "Pharmacie Moderne", orders: 98, revenue: "890,000 FCFA", rating: 4.4 }
  ]);

  const [topDeliverers] = useState([
    { name: "Jean-Claude K.", deliveries: 89, rating: 4.9, earnings: "44,500 FCFA" },
    { name: "Ama Sika", deliveries: 76, rating: 4.8, earnings: "38,000 FCFA" },
    { name: "Kofi Asante", deliveries: 65, rating: 4.7, earnings: "32,500 FCFA" }
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error": return "bg-red-100 text-red-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      case "success": return "bg-green-100 text-green-800";
      case "info": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case "order_issue":
      case "delivery_issue":
        return <AlertTriangle className="h-4 w-4" />;
      case "new_user":
      case "pharmacy_join":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">YahoPharma+ Administration</h1>
            <p className="text-indigo-100">Tableau de bord - {user?.firstName}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-white" data-testid="button-settings">
              <Settings className="h-6 w-6" />
            </Button>
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="text-white" data-testid="button-profile">
                <User className="h-6 w-6" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Statistiques générales */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card data-testid="card-stats-users">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{systemStats.totalUsers.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Utilisateurs</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stats-orders">
            <CardContent className="p-4 text-center">
              <Package className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{systemStats.activeOrders}</div>
              <div className="text-sm text-gray-600">Commandes actives</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stats-pharmacies">
            <CardContent className="p-4 text-center">
              <MapPin className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{systemStats.totalPharmacies}</div>
              <div className="text-sm text-gray-600">Pharmacies</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stats-deliverers">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{systemStats.activeDeliverers}</div>
              <div className="text-sm text-gray-600">Livreurs actifs</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stats-revenue">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-indigo-600">{systemStats.dailyRevenue}</div>
              <div className="text-sm text-gray-600">FCFA aujourd'hui</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stats-growth">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-green-600">{systemStats.monthlyGrowth}</div>
              <div className="text-sm text-gray-600">Croissance mensuelle</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="pharmacies" data-testid="tab-pharmacies">
              Pharmacies
            </TabsTrigger>
            <TabsTrigger value="deliverers" data-testid="tab-deliverers">
              Livreurs
            </TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">
              Activité
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card data-testid="card-daily-overview">
                <CardHeader>
                  <CardTitle>Résumé du jour</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Nouvelles commandes</span>
                    <span className="font-semibold">47</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commandes livrées</span>
                    <span className="font-semibold text-green-600">42</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux de réussite</span>
                    <span className="font-semibold text-green-600">89%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temps moyen de livraison</span>
                    <span className="font-semibold">28 min</span>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-alerts">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Alertes système
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    Stock faible signalé par 3 pharmacies
                  </div>
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                    2 livreurs non disponibles depuis 2h
                  </div>
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    Nouvelle demande d'inscription pharmacie
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pharmacies" className="space-y-4">
            <Card data-testid="card-top-pharmacies">
              <CardHeader>
                <CardTitle>Top Pharmacies</CardTitle>
                <CardDescription>Performances du mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPharmacies.map((pharmacy, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <h4 className="font-medium">{pharmacy.name}</h4>
                        <p className="text-sm text-gray-600">{pharmacy.orders} commandes</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{pharmacy.revenue}</p>
                        <p className="text-sm text-yellow-600">★ {pharmacy.rating}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliverers" className="space-y-4">
            <Card data-testid="card-top-deliverers">
              <CardHeader>
                <CardTitle>Top Livreurs</CardTitle>
                <CardDescription>Performances du mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topDeliverers.map((deliverer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <h4 className="font-medium">{deliverer.name}</h4>
                        <p className="text-sm text-gray-600">{deliverer.deliveries} livraisons</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{deliverer.earnings}</p>
                        <p className="text-sm text-yellow-600">★ {deliverer.rating}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card data-testid="card-recent-activity">
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border border-gray-100 rounded">
                      <div className={`p-1 rounded ${getSeverityColor(activity.severity)}`}>
                        {getSeverityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
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