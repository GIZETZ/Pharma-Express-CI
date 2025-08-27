import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

// Component pour la gestion des commandes
const OrdersManagementModule = () => {
  const { toast } = useToast();
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  const { data: allOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/admin/orders"],
  });

  const { data: weeklyStats } = useQuery({
    queryKey: ["/api/admin/weekly-stats", selectedWeek],
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: (data: { orderId: string; status: string }) =>
      apiRequest(`/api/admin/orders/${data.orderId}/status`, "POST", {
        method: "PATCH",
        body: JSON.stringify({ status: data.status }),
      }),
    onSuccess: () => {
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la commande a été modifié avec succès",
      });
    },
  });

  if (ordersLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const validatedOrders = allOrders?.filter((order: any) => order.status === 'confirmed' || order.status === 'ready_for_delivery' || order.status === 'in_delivery' || order.status === 'delivered') || [];
  const totalWeeklyRevenue = weeklyStats?.totalRevenue || 0;

  return (
    <div className="space-y-6">
      {/* Statistiques hebdomadaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-600">Revenus cette semaine</h3>
              <p className="text-2xl font-bold">{totalWeeklyRevenue.toLocaleString()} FCFA</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-600">Commandes validées</h3>
              <p className="text-2xl font-bold">{validatedOrders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-orange-600">Commandes totales</h3>
              <p className="text-2xl font-bold">{allOrders?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>📦 Toutes les Commandes</CardTitle>
          <CardDescription>
            Gestion centralisée de toutes les commandes de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allOrders?.map((order: any) => (
              <div key={order.id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold">#{order.id.slice(-8)}</h3>
                      <Badge variant={
                        order.status === 'delivered' ? 'default' :
                        order.status === 'confirmed' ? 'secondary' :
                        order.status === 'pending' ? 'destructive' : 'outline'
                      }>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Patient:</strong> {order.patient?.firstName} {order.patient?.lastName}</p>
                        <p><strong>Pharmacie:</strong> {order.pharmacy?.name}</p>
                      </div>
                      <div>
                        <p><strong>Montant:</strong> {order.totalAmount} FCFA</p>
                        <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatusMutation.mutate({
                        orderId: order.id,
                        status: e.target.value
                      })}
                      className="px-3 py-1 border rounded text-sm"
                    >
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmée</option>
                      <option value="ready_for_delivery">Prête livraison</option>
                      <option value="in_delivery">En livraison</option>
                      <option value="delivered">Livrée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Component pour la gestion des pharmacies
const PharmaciesManagementModule = () => {
  const { toast } = useToast();

  const { data: pharmacies, isLoading: pharmaciesLoading } = useQuery({
    queryKey: ["/api/admin/pharmacies"],
  });

  const updatePharmacyStatusMutation = useMutation({
    mutationFn: (data: { pharmacyId: string; isActive: boolean }) =>
      apiRequest(`/api/admin/pharmacies/${data.pharmacyId}/status`, "POST", {
        method: "PATCH",
        body: JSON.stringify({ isActive: data.isActive }),
      }),
    onSuccess: () => {
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la pharmacie a été modifié avec succès",
      });
    },
  });

  if (pharmaciesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🏥 Gestion des Pharmacies</CardTitle>
        <CardDescription>
          Superviser et gérer toutes les pharmacies partenaires
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pharmacies?.map((pharmacy: any) => (
            <div key={pharmacy.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold">{pharmacy.name}</h3>
                    <Badge variant={pharmacy.isOpen ? 'default' : 'secondary'}>
                      {pharmacy.isOpen ? 'Ouverte' : 'Fermée'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Adresse:</strong> {pharmacy.address}</p>
                      <p><strong>Téléphone:</strong> {pharmacy.phone}</p>
                    </div>
                    <div>
                      <p><strong>Note:</strong> ⭐ {pharmacy.rating}/5</p>
                      <p><strong>Livraison:</strong> {pharmacy.deliveryTime} min</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button
                    size="sm"
                    variant={pharmacy.isOpen ? "destructive" : "default"}
                    onClick={() => updatePharmacyStatusMutation.mutate({
                      pharmacyId: pharmacy.id,
                      isActive: !pharmacy.isOpen
                    })}
                  >
                    {pharmacy.isOpen ? 'Suspendre' : 'Activer'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Component pour la gestion des utilisateurs
const UsersManagementModule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: (data: { userId: string; isActive: boolean }) =>
      apiRequest(`/api/admin/users/${data.userId}/status`, "PATCH", {
        isActive: data.isActive
      }),
    onSuccess: (data, variables) => {
      toast({
        title: "Statut mis à jour",
        description: `L'utilisateur a été ${variables.isActive ? 'réactivé' : 'suspendu'} avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de l'utilisateur",
        variant: "destructive",
      });
    },
  });

  if (usersLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group users by role for better organization
  const usersByRole = users?.reduce((acc: any, user: any) => {
    if (!acc[user.role]) acc[user.role] = [];
    acc[user.role].push(user);
    return acc;
  }, {}) || {};

  const roleColors = {
    patient: 'bg-blue-100 text-blue-800',
    pharmacien: 'bg-green-100 text-green-800',
    livreur: 'bg-purple-100 text-purple-800'
  };

  const roleEmojis = {
    patient: '👤',
    pharmacien: '💊',
    livreur: '🚴'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>👥 Gestion des Utilisateurs</CardTitle>
        <CardDescription>
          Superviser tous les utilisateurs et gérer leurs statuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(usersByRole).map(([role, roleUsers]: [string, any]) => (
            <div key={role} className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${roleColors[role as keyof typeof roleColors]}`}>
                  {roleEmojis[role as keyof typeof roleEmojis]} {role.charAt(0).toUpperCase() + role.slice(1)}s ({roleUsers.length})
                </div>
              </div>
              <div className="grid gap-4">
                {roleUsers.map((user: any) => (
                  <div key={user.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                          <Badge variant={user.isActive ? 'default' : 'destructive'}>
                            {user.isActive ? 'Actif' : 'Suspendu'}
                          </Badge>
                          {user.verificationStatus === 'pending' && (
                            <Badge variant="secondary">En attente</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><strong>Téléphone:</strong> {user.phone}</p>
                            <p><strong>Adresse:</strong> {user.address}</p>
                          </div>
                          <div>
                            <p><strong>Membre depuis:</strong> {new Date(user.createdAt).toLocaleDateString('fr-FR')}</p>
                            <p><strong>Vérification:</strong> {user.verificationStatus}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button
                          size="sm"
                          variant={user.isActive ? "destructive" : "default"}
                          onClick={() => updateUserStatusMutation.mutate({
                            userId: user.id,
                            isActive: !user.isActive
                          })}
                          disabled={updateUserStatusMutation.isPending}
                        >
                          {user.isActive ? 'Suspendre' : 'Réactiver'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {!users || users.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                👥
              </div>
              <p className="text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Component pour la gestion des livreurs
const DeliveryPersonnelManagementModule = () => {
  const { toast } = useToast();

  const { data: deliveryPersonnel, isLoading: personnelLoading } = useQuery({
    queryKey: ["/api/admin/delivery-personnel"],
  });

  const updateDeliveryPersonStatusMutation = useMutation({
    mutationFn: (data: { deliveryPersonId: string; isActive: boolean }) =>
      apiRequest(`/api/admin/delivery-personnel/${data.deliveryPersonId}/status`, "PATCH", {
        isActive: data.isActive
      }),
    onSuccess: () => {
      toast({
        title: "Statut mis à jour",
        description: "Le statut du livreur a été modifié avec succès",
      });
    },
  });

  if (personnelLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🚴 Gestion des Livreurs</CardTitle>
        <CardDescription>
          Superviser les livreurs et leurs performances
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deliveryPersonnel?.map((person: any) => (
            <div key={person.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold">{person.firstName} {person.lastName}</h3>
                    <Badge variant={person.isActive ? 'default' : 'secondary'}>
                      {person.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                    <Badge variant="outline">
                      {person.pharmacyName || 'Non assigné'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Téléphone:</strong> {person.phone}</p>
                      <p><strong>Adresse:</strong> {person.address}</p>
                    </div>
                    <div>
                      <p><strong>Livraisons:</strong> {person.totalDeliveries || 0}</p>
                      <p><strong>Note:</strong> ⭐ {person.rating || 5.0}/5</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button
                    size="sm"
                    variant={person.isActive ? "destructive" : "default"}
                    onClick={() => updateDeliveryPersonStatusMutation.mutate({
                      deliveryPersonId: person.id,
                      isActive: !person.isActive
                    })}
                  >
                    {person.isActive ? 'Suspendre' : 'Activer'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

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
      apiRequest(`/api/admin/validate-user`, "POST", data),
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

  const handleValidation = async (userId: string, action: 'approve' | 'reject') => {
    // Check if this is a delivery person with pharmacy application
    const user = pendingUsers?.find(u => u.id === userId);
    if (user?.role === 'livreur' && user.appliedPharmacyId) {
      // Use the admin delivery application response endpoint
      try {
        const response = await apiRequest(`/api/admin/delivery-applications/${userId}/respond`, 'POST', {
          action
        });
        if (!response.ok) {
          throw new Error('Failed to respond to delivery application');
        }
        toast({
          title: action === 'approve' ? 'Livreur approuvé' : 'Candidature rejetée',
          description: `La candidature a été ${action === 'approve' ? 'acceptée' : 'rejetée'} avec succès`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-users'] });
      } catch (error: any) {
        toast({
          title: 'Erreur',
          description: error.message || 'Impossible de traiter la candidature',
          variant: 'destructive'
        });
      }
    } else {
      // Use the regular user validation for other roles
      validateUserMutation.mutate({ userId, action });
    }
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="validation" data-testid="tab-validation">
              Validation
              {pendingUsers?.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingUsers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">Commandes</TabsTrigger>
            <TabsTrigger value="pharmacies" data-testid="tab-pharmacies">Pharmacies</TabsTrigger>
            <TabsTrigger value="deliveries" data-testid="tab-deliveries">Livreurs</TabsTrigger>
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">Tableau de Bord</TabsTrigger>
          </TabsList>

          {/* Gestion des commandes */}
          <TabsContent value="orders">
            <OrdersManagementModule />
          </TabsContent>

          {/* Gestion des utilisateurs */}
          <TabsContent value="users">
            <UsersManagementModule />
          </TabsContent>

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
                              <div className="text-sm text-yellow-700 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span>• Carte d'identité nationale</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                    onClick={() => {
                                      // Afficher le vrai document uploadé
                                      const modal = document.createElement('div');
                                      modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
                                      modal.style.cursor = 'pointer';
                                      modal.innerHTML = `
                                        <div class="relative max-w-4xl max-h-full p-4">
                                          <div class="bg-white rounded-lg p-6 text-center max-h-[90vh] overflow-y-auto">
                                            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                              📄
                                            </div>
                                            <h3 class="text-lg font-semibold text-gray-900 mb-2">
                                              Carte d'identité - ${user.firstName} ${user.lastName}
                                            </h3>
                                            <p class="text-gray-600 mb-4">
                                              Document d'identité fourni lors de l'inscription
                                            </p>
                                            <div class="bg-gray-50 border rounded-lg p-4 mb-4">
                                              ${user.idDocumentUrl ?
                                                `<img src="${user.idDocumentUrl}" alt="Document d'identité" class="max-w-full h-auto rounded border"/>` :
                                                '<p class="text-gray-500">Aucun document d\'identité fourni</p>'
                                              }
                                            </div>
                                            <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                              Fermer
                                            </button>
                                          </div>
                                        </div>
                                      `;

                                      modal.addEventListener('click', () => {
                                        document.body.removeChild(modal);
                                      });

                                      document.body.appendChild(modal);
                                    }}
                                  >
                                    Voir document
                                  </Button>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>• {user.role === 'pharmacien' ? 'Diplôme de pharmacien' : 'Permis de conduire'}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs ml-2"
                                    onClick={() => {
                                      // Afficher le document professionnel/permis
                                      const modal = document.createElement('div');
                                      modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
                                      modal.style.cursor = 'pointer';
                                      const documentUrl = user.role === 'pharmacien' ? user.professionalDocumentUrl : user.drivingLicenseUrl;
                                      const documentTitle = user.role === 'pharmacien' ? 'Diplôme de pharmacien' : 'Permis de conduire';

                                      modal.innerHTML = `
                                        <div class="relative max-w-4xl max-h-full p-4">
                                          <div class="bg-white rounded-lg p-6 text-center max-h-[90vh] overflow-y-auto">
                                            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                              ${user.role === 'pharmacien' ? '🎓' : '🚗'}
                                            </div>
                                            <h3 class="text-lg font-semibold text-gray-900 mb-2">
                                              ${documentTitle} - ${user.firstName} ${user.lastName}
                                            </h3>
                                            <p class="text-gray-600 mb-4">
                                              Document professionnel fourni lors de l'inscription
                                            </p>
                                            <div class="bg-gray-50 border rounded-lg p-4 mb-4">
                                              ${documentUrl ?
                                                `<img src="${documentUrl}" alt="${documentTitle}" class="max-w-full h-auto rounded border"/>` :
                                                `<p class="text-gray-500">Aucun ${documentTitle.toLowerCase()} fourni</p>`
                                              }
                                            </div>
                                            <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                              Fermer
                                            </button>
                                          </div>
                                        </div>
                                      `;

                                      modal.addEventListener('click', () => {
                                        document.body.removeChild(modal);
                                      });

                                      document.body.appendChild(modal);
                                    }}
                                  >
                                    Voir
                                  </Button>
                                </div>
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
            <PharmaciesManagementModule />
          </TabsContent>

          {/* Gestion des livreurs */}
          <TabsContent value="deliveries">
            <DeliveryPersonnelManagementModule />
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