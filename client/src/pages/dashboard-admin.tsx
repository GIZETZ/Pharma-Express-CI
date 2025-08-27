import { useState } from "react";
import { Link } from "wouter";
import { BarChart3, Users, Package, MapPin, Settings, User, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export default function DashboardAdmin() {
  const { user } = useAuth();

  // Utiliser les vraies données depuis l'API
  const { data: appStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: allOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/admin/orders"],
  });

  const { data: allPharmacies, isLoading: pharmaciesLoading } = useQuery({
    queryKey: ["/api/admin/pharmacies"],
  });

  const { data: weeklyStats } = useQuery({
    queryKey: ["/api/admin/weekly-stats", new Date()],
  });

  const [recentActivity] = useState([
    {
      id: 1,
      type: "new_user",
      message: "Nouveau patient inscrit",
      time: "Il y a 5 min",
      severity: "info"
    },
    {
      id: 2,
      type: "order_issue",
      message: "Problème de livraison signalé",
      time: "Il y a 12 min",
      severity: "warning"
    },
    {
      id: 3,
      type: "pharmacy_join",
      message: "Nouvelle pharmacie ajoutée",
      time: "Il y a 1h",
      severity: "success"
    },
    {
      id: 4,
      type: "delivery_issue",
      message: "Livreur non disponible",
      time: "Il y a 2h",
      severity: "error"
    }
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

  // Calculer les statistiques réelles
  const validatedOrders = allOrders?.filter((order: any) => 
    order.status === 'confirmed' || order.status === 'ready_for_delivery' || 
    order.status === 'in_delivery' || order.status === 'delivered'
  ) || [];

  const activeOrders = allOrders?.filter((order: any) => 
    order.status === 'confirmed' || order.status === 'ready_for_delivery' || order.status === 'in_delivery'
  ) || [];

  const totalWeeklyRevenue = weeklyStats?.totalRevenue || 0;
  const activePharmacies = allPharmacies?.filter((pharmacy: any) => pharmacy.isOpen) || [];

  if (statsLoading || ordersLoading || pharmaciesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement des données administrateur...</p>
        </div>
      </div>
    );
  }

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
        {/* Statistiques générales avec vraies données */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card data-testid="card-stats-users">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {(appStats?.patients + appStats?.pharmaciens + appStats?.livreurs) || 0}
              </div>
              <div className="text-sm text-gray-600">Utilisateurs</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stats-orders">
            <CardContent className="p-4 text-center">
              <Package className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{activeOrders.length}</div>
              <div className="text-sm text-gray-600">Commandes actives</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stats-pharmacies">
            <CardContent className="p-4 text-center">
              <MapPin className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{activePharmacies.length}</div>
              <div className="text-sm text-gray-600">Pharmacies actives</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stats-deliverers">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{appStats?.livreurs || 0}</div>
              <div className="text-sm text-gray-600">Livreurs</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stats-revenue">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-indigo-600">{totalWeeklyRevenue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">FCFA cette semaine</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stats-growth">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-green-600">{validatedOrders.length}</div>
              <div className="text-sm text-gray-600">Commandes validées</div>
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
                    <span className="font-semibold">{appStats?.pendingOrders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commandes livrées</span>
                    <span className="font-semibold text-green-600">{appStats?.completedDeliveries || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Livraisons en cours</span>
                    <span className="font-semibold text-blue-600">{appStats?.activeDeliveries || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total commandes</span>
                    <span className="font-semibold">{appStats?.orders || 0}</span>
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
                  {appStats?.pendingOrders > 0 && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      {appStats.pendingOrders} commandes en attente de validation
                    </div>
                  )}
                  {allPharmacies?.filter((p: any) => !p.isOpen).length > 0 && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                      {allPharmacies.filter((p: any) => !p.isOpen).length} pharmacies fermées
                    </div>
                  )}
                  {appStats?.livreurs === 0 && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                      Aucun livreur disponible
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pharmacies" className="space-y-4">
            <Card data-testid="card-top-pharmacies">
              <CardHeader>
                <CardTitle>Pharmacies ({allPharmacies?.length || 0})</CardTitle>
                <CardDescription>État des pharmacies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allPharmacies?.slice(0, 5).map((pharmacy: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <h4 className="font-medium">{pharmacy.name}</h4>
                        <p className="text-sm text-gray-600">{pharmacy.address}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={pharmacy.isOpen ? "default" : "secondary"}>
                          {pharmacy.isOpen ? "Ouverte" : "Fermée"}
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">Aucune pharmacie enregistrée</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliverers" className="space-y-4">
            <Card data-testid="card-top-deliverers">
              <CardHeader>
                <CardTitle>Livreurs ({appStats?.livreurs || 0})</CardTitle>
                <CardDescription>État des livreurs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{appStats?.livreurs || 0}</div>
                      <div className="text-sm text-gray-600">Total livreurs</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{appStats?.activeDeliveries || 0}</div>
                      <div className="text-sm text-gray-600">En livraison</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-gray-600">
                        {Math.max(0, (appStats?.livreurs || 0) - (appStats?.activeDeliveries || 0))}
                      </div>
                      <div className="text-sm text-gray-600">Disponibles</div>
                    </div>
                  </div>
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