import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

export default function SupervisorLock() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les utilisateurs en attente de validation
  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ["/api/admin/pending-users"],
  });

  // Récupérer toutes les statistiques de l'application
  const { data: appStats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const validateUserMutation = useMutation({
    mutationFn: (data: { userId: string; action: 'approve' | 'reject' }) =>
      apiRequest(`/api/admin/validate-user`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      toast({
        title: variables.action === 'approve' ? "Utilisateur approuvé" : "Utilisateur rejeté",
        description: variables.action === 'approve' 
          ? "L'utilisateur peut maintenant accéder à la plateforme"
          : "L'utilisateur a été rejeté et en sera informé",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de traiter cette demande",
        variant: "destructive",
      });
    },
  });

  const handleValidation = (userId: string, action: 'approve' | 'reject') => {
    validateUserMutation.mutate({ userId, action });
  };

  if (isLoading) {
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔐 SupervisorLock - Administration</h1>
          <p className="text-gray-600">Gestion et supervision de la plateforme YahoPharma+</p>
        </div>

        <Tabs defaultValue="validation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="validation" data-testid="tab-validation">
              Validation Comptes
              {pendingUsers?.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingUsers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pharmacies" data-testid="tab-pharmacies">Pharmacies</TabsTrigger>
            <TabsTrigger value="deliveries" data-testid="tab-deliveries">Livreurs</TabsTrigger>
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">Tableau de Bord</TabsTrigger>
          </TabsList>

          {/* Validation des comptes en attente */}
          <TabsContent value="validation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>👤</span>
                  <span>Comptes en attente de validation</span>
                </CardTitle>
                <CardDescription>
                  Validez les pièces d'identité des Pharmaciens et Livreurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!pendingUsers || pendingUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      ✅
                    </div>
                    <p className="text-gray-500">Aucun compte en attente de validation</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((user: User) => (
                      <div
                        key={user.id}
                        className="border rounded-lg p-4 bg-white"
                        data-testid={`user-pending-${user.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                user.role === "pharmacien" ? "bg-green-100" : "bg-purple-100"
                              }`}>
                                {user.role === "pharmacien" ? "💊" : "🚴"}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {user.firstName} {user.lastName}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {user.role === "pharmacien" ? "Pharmacien" : "Livreur"} • {user.phone}
                                </p>
                              </div>
                              <Badge variant="secondary">En attente</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Adresse</p>
                                <p className="text-sm text-gray-600">{user.address}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">Date d'inscription</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(user.createdAt!).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                              <p className="text-sm font-medium text-yellow-800 mb-2">
                                📋 Documents à vérifier :
                              </p>
                              <div className="text-sm text-yellow-700 space-y-1">
                                <div>• Carte d'identité nationale</div>
                                {user.role === "pharmacien" && <div>• Diplôme de pharmacien</div>}
                                {user.role === "livreur" && <div>• Permis de conduire</div>}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            <Button
                              onClick={() => handleValidation(user.id, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                              disabled={validateUserMutation.isPending}
                              data-testid={`button-approve-${user.id}`}
                            >
                              ✅ Approuver
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleValidation(user.id, 'reject')}
                              disabled={validateUserMutation.isPending}
                              data-testid={`button-reject-${user.id}`}
                            >
                              ❌ Rejeter
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gestion des pharmacies */}
          <TabsContent value="pharmacies">
            <Card>
              <CardHeader>
                <CardTitle>🏥 Gestion des Pharmacies</CardTitle>
                <CardDescription>
                  Superviser et gérer toutes les pharmacies partenaires
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">Module de gestion des pharmacies en développement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gestion des livreurs */}
          <TabsContent value="deliveries">
            <Card>
              <CardHeader>
                <CardTitle>🚴 Gestion des Livreurs</CardTitle>
                <CardDescription>
                  Superviser les livreurs et leurs performances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">Module de gestion des livreurs en développement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tableau de bord global */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Patients</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {appStats?.patients || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      👥
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pharmaciens</p>
                      <p className="text-2xl font-bold text-green-600">
                        {appStats?.pharmaciens || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      💊
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Livreurs</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {appStats?.livreurs || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      🚴
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Commandes</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {appStats?.orders || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      📦
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>📊 Tableau de Bord Complet</CardTitle>
                <CardDescription>
                  Vue d'ensemble de toutes les activités de la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Sécurité & RGPD</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>✅ Données cryptées</li>
                        <li>✅ Ordonnances sécurisées</li>
                        <li>✅ Conformité RGPD Médical CI</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Supervision Commandes</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>📋 Ordonnances en attente: {appStats?.pendingOrders || 0}</li>
                        <li>🚚 Livraisons en cours: {appStats?.activeDeliveries || 0}</li>
                        <li>✅ Livraisons terminées: {appStats?.completedDeliveries || 0}</li>
                      </ul>
                    </div>
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