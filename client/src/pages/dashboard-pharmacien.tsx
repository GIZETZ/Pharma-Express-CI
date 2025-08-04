import { useState } from "react";
import { Link } from "wouter";
import { Package, FileText, Clock, CheckCircle, User, Bell, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPharmacien() {
  const { user } = useAuth();
  const [pendingOrders] = useState([
    {
      id: "ORD-001",
      patient: "Aya Diallo",
      phone: "+225 05 77 88 99",
      medications: ["Paracétamol 500mg", "Amoxicilline"],
      status: "pending",
      time: "Il y a 10 min",
      priority: "normal"
    },
    {
      id: "ORD-002", 
      patient: "Kofi Asante",
      phone: "+225 07 22 33 44",
      medications: ["Insuline", "Metformine"],
      status: "pending",
      time: "Il y a 25 min",
      priority: "urgent"
    }
  ]);

  const [preparingOrders] = useState([
    {
      id: "ORD-003",
      patient: "Marie Kone",
      medications: ["Doliprane", "Sirop toux"],
      estimatedTime: "15 min",
      status: "preparing"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "preparing": return "bg-orange-100 text-orange-800";
      case "ready": return "bg-green-100 text-green-800";
      case "urgent": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
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
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">YahoPharma+ Pharmacien</h1>
            <p className="text-green-100">Dr. {user?.firstName} {user?.lastName}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-white relative" data-testid="button-notifications">
              <Bell className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                2
              </span>
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
        {/* Statistiques du jour */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card data-testid="card-stats-pending">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</div>
              <div className="text-sm text-gray-600">En attente</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stats-preparing">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{preparingOrders.length}</div>
              <div className="text-sm text-gray-600">En préparation</div>
            </CardContent>
          </Card>
          <Card data-testid="card-stats-completed">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-sm text-gray-600">Complétées</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" data-testid="tab-pending">
              Nouvelles ordonnances
            </TabsTrigger>
            <TabsTrigger value="preparing" data-testid="tab-preparing">
              En préparation
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              Statistiques
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingOrders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-yellow-500" data-testid={`card-order-${order.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{order.patient}</CardTitle>
                      <CardDescription>{order.phone}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority === "urgent" ? "Urgent" : "Normal"}
                      </Badge>
                      <Badge variant="outline">{order.time}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Médicaments demandés:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {order.medications.map((med, index) => (
                          <li key={index}>{med}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button className="flex-1" data-testid={`button-verify-${order.id}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        Vérifier & valider
                      </Button>
                      <Button variant="outline" data-testid={`button-contact-${order.id}`}>
                        Contacter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="preparing" className="space-y-4">
            {preparingOrders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-orange-500" data-testid={`card-preparing-${order.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{order.patient}</CardTitle>
                    <Badge className="bg-orange-100 text-orange-800">En préparation</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Médicaments:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {order.medications.map((med, index) => (
                          <li key={index}>{med}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Temps estimé: {order.estimatedTime}
                      </span>
                    </div>
                    <Button className="w-full" data-testid={`button-complete-${order.id}`}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marquer comme prêt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card data-testid="card-daily-stats">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Statistiques du jour
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">15</div>
                    <div className="text-sm text-gray-600">Commandes totales</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">142,500</div>
                    <div className="text-sm text-gray-600">FCFA vendus</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Temps moyen de préparation</span>
                    <span className="font-medium">22 min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taux de satisfaction</span>
                    <span className="font-medium text-green-600">98%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}