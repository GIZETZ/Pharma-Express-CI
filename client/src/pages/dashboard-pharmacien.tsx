import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";

// Component to display prescription image
const PrescriptionImage = ({ prescriptionId, className }: { prescriptionId: string, className?: string }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await apiRequest('GET', `/api/prescriptions/${prescriptionId}`);
        const prescription = await response.json();
        setImageUrl(prescription.imageUrl);
      } catch (error) {
        console.error('Error fetching prescription:', error);
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [prescriptionId]);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gray-100 text-gray-500`}>
        <span className="text-2xl mb-2">📄</span>
        <p className="text-sm">Image non disponible</p>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="Photo de l'ordonnance"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        // Ouvrir l'image en plein écran
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4';
        modal.style.zIndex = '9999';
        modal.style.cursor = 'pointer';

        const modalContent = document.createElement('div');
        modalContent.className = 'relative max-w-full max-h-full';
        modalContent.innerHTML = `
          <img src="${imageUrl}"
               class="max-w-full max-h-full object-contain"
               alt="Photo de l'ordonnance" />
          <button class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 text-2xl font-bold">&times;</button>
        `;

        modal.appendChild(modalContent);

        const closeModal = () => {
          if (document.body.contains(modal)) {
            document.body.removeChild(modal);
          }
        };

        // Empêcher la propagation sur le contenu de l'image
        modalContent.addEventListener('click', (e) => {
          e.stopPropagation();
        });

        // Fermer avec le bouton X
        const closeBtn = modalContent.querySelector('button');
        closeBtn?.addEventListener('click', (e) => {
          e.stopPropagation();
          closeModal();
        });

        // Fermer en cliquant sur le fond
        modal.addEventListener('click', closeModal);

        // Fermer avec Escape
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
          }
        };
        document.addEventListener('keydown', handleEscape);

        document.body.appendChild(modal);
      }}
    />
  );
};

// Component for handling ready-for-delivery orders
const ReadyForDeliveryOrders = ({ orders }: { orders: any[] }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch delivery personnel
  const { data: deliveryPersonnel, isLoading: personnelLoading } = useQuery({
    queryKey: ['/api/pharmacien/delivery-personnel'],
    enabled: true
  });

  // Assign delivery person mutation
  const assignDeliveryMutation = useMutation({
    mutationFn: async ({ orderId, deliveryPersonId }: { orderId: string, deliveryPersonId: string }) => {
      const response = await apiRequest('POST', `/api/pharmacien/orders/${orderId}/assign-delivery`, {
        deliveryPersonId
      });
      if (!response.ok) {
        throw new Error('Failed to assign delivery person');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacien/orders'] });
      toast({
        title: "Livreur assigné",
        description: "Le livreur a été assigné avec succès à cette commande",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'assigner le livreur",
        variant: "destructive"
      });
    }
  });

  const readyOrders = orders?.filter((order: any) => order.status === 'ready_for_delivery') || [];

  if (readyOrders.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-gray-50 text-center">
        <div className="text-gray-400 mb-2">📦</div>
        <h4 className="font-medium text-gray-700 mb-2">Aucune commande prête pour livraison</h4>
        <p className="text-sm text-gray-600">
          Les commandes prêtes apparaîtront ici pour que vous puissiez assigner un livreur
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 text-lg">ℹ️</div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Gestion des Livraisons</h4>
            <p className="text-sm text-blue-700">
              Choisissez le livreur que vous souhaitez pour chaque commande.
              Une fois assigné, le livreur recevra une notification et pourra commencer la livraison.
            </p>
          </div>
        </div>
      </div>

      {readyOrders.map((order: any) => (
        <div key={order.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-green-900">Commande #{order.id.slice(0, 8)}</h4>
              <p className="text-sm text-green-700">
                Patient: {order.user?.firstName} {order.user?.lastName} • {order.user?.phone}
              </p>
            </div>
            <Badge className="bg-green-600 text-white">Prête pour livraison</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Montant total</p>
              <p className="text-lg font-bold text-green-600">{order.totalAmount} FCFA</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Date de commande</p>
              <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</p>
            </div>
          </div>

          <div className="mb-4 bg-white rounded-lg p-3 border border-green-200">
            <p className="text-sm font-medium text-gray-700 mb-1">📍 Adresse de livraison</p>
            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
          </div>

          {/* Delivery assignment section */}
          {order.deliveryPersonId ? (
            <div className="bg-white rounded-lg p-4 border-2 border-green-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    🚴
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">✅ Livreur assigné avec succès</p>
                    <p className="text-sm text-gray-600">
                      <strong>
                        {deliveryPersonnel?.find((p: any) => p.id === order.deliveryPersonId)?.firstName} {' '}
                        {deliveryPersonnel?.find((p: any) => p.id === order.deliveryPersonId)?.lastName}
                      </strong>
                      {' • '}
                      {deliveryPersonnel?.find((p: any) => p.id === order.deliveryPersonId)?.phone}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                  🚚 En cours de livraison
                </Badge>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  👤
                </div>
                <div>
                  <Label className="text-sm font-medium text-orange-900">
                    🔔 Choisir et assigner un livreur
                  </Label>
                  <p className="text-xs text-orange-700 mt-1">
                    Sélectionnez le livreur qui effectuera cette livraison
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Select
                  onValueChange={(deliveryPersonId) => {
                    assignDeliveryMutation.mutate({ orderId: order.id, deliveryPersonId });
                  }}
                  disabled={assignDeliveryMutation.isPending || personnelLoading}
                >
                  <SelectTrigger className="flex-1 border-orange-300 focus:border-orange-500">
                    <SelectValue placeholder="Sélectionner un livreur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryPersonnel?.map((person: any) => (
                      <SelectItem key={person.id} value={person.id}>
                        <div className="flex items-center space-x-2">
                          <span>🚴</span>
                          <span>{person.firstName} {person.lastName}</span>
                          <span className="text-gray-500">• {person.phone}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignDeliveryMutation.isPending && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                )}
              </div>

              {personnelLoading && (
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-1"></div>
                  Chargement des livreurs disponibles...
                </p>
              )}
              {!personnelLoading && (!deliveryPersonnel || deliveryPersonnel.length === 0) && (
                <p className="text-xs text-red-500 mt-2 flex items-center">
                  <span className="mr-1">⚠️</span>
                  Aucun livreur disponible pour le moment
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default function DashboardPharmacien() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("new-orders");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [medicationStatuses, setMedicationStatuses] = useState<Record<string, {available: boolean, surBon: boolean}>>({});
  const [visibleImages, setVisibleImages] = useState<Record<string, boolean>>({});
  const [medicationPrices, setMedicationPrices] = useState<Record<string, string>>({});
  const [newMedication, setNewMedication] = useState({ name: '', price: '', surBon: false });
  const [orderMedications, setOrderMedications] = useState<Record<string, any[]>>({});
  const [editingMedication, setEditingMedication] = useState<Record<string, boolean>>({});
  const [medicationNames, setMedicationNames] = useState<Record<string, string>>({});

  // Mutation pour mettre à jour le statut des commandes
  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      apiRequest("POST", `/api/pharmacien/orders/${orderId}/status`, { status }),
    onSuccess: (data, variables) => {
      toast({
        title: "Commande mise à jour",
        description: `Commande ${variables.status === 'confirmed' ? 'validée' : variables.status === 'rejected' ? 'rejetée' : 'mise à jour'} avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacien/orders"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la commande",
        variant: "destructive",
      });
    },
  });

  // Mutation pour mettre à jour les médicaments
  const updateMedicationsMutation = useMutation({
    mutationFn: ({ orderId, medications }: { orderId: string; medications: any[] }) =>
      apiRequest("POST", `/api/pharmacien/orders/${orderId}/medications`, { medications }),
    onSuccess: () => {
      toast({
        title: "Médicaments mis à jour",
        description: "Les informations des médicaments ont été sauvegardées",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacien/orders"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les médicaments",
        variant: "destructive",
      });
    },
  });

  // Mutation pour envoyer la réponse au patient
  const sendResponseMutation = useMutation({
    mutationFn: ({ orderId, medications }: { orderId: string; medications: any[] }) =>
      apiRequest("POST", `/api/pharmacien/orders/${orderId}/send-response`, { medications }),
    onSuccess: () => {
      toast({
        title: "Réponse envoyée",
        description: "La réponse a été envoyée au patient avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacien/orders"] });
      setMedicationPrices({});
      setMedicationStatuses({});
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la réponse",
        variant: "destructive",
      });
    },
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/pharmacien/orders"],
    refetchInterval: 5000 // Refresh every 5 seconds
  });
  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ["/api/pharmacien/prescriptions"],
    refetchInterval: 5000
  });

  // Function to get prescription image
  const getPrescriptionImage = async (prescriptionId: string) => {
    try {
      const response = await apiRequest(`/api/prescriptions/${prescriptionId}`);
      return response.imageUrl;
    } catch (error) {
      console.error('Error fetching prescription:', error);
      return null;
    }
  };

  const handleOrderUpdate = (orderId: string, status: string) => {
    updateOrderMutation.mutate({ orderId, status });
  };

  const handleMedicationUpdate = (orderId: string, medications: any[]) => {
    updateMedicationsMutation.mutate({ orderId, medications });
  };

  const toggleMedicationStatus = (orderId: string, medIndex: number, field: 'available' | 'surBon', value: boolean) => {
    const key = `${orderId}-${medIndex}`;
    setMedicationStatuses(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const updateMedicationPrice = (orderId: string, medIndex: number, price: string) => {
    const key = `${orderId}-${medIndex}`;
    setMedicationPrices(prev => ({
      ...prev,
      [key]: price
    }));
  };

  // Fonction pour ajouter un nouveau médicament à une commande
  const addMedicationToOrder = (orderId: string) => {
    if (!newMedication.name.trim() || !newMedication.price) {
      toast({
        title: "Validation requise",
        description: "Veuillez saisir le nom et le prix du médicament",
        variant: "destructive",
      });
      return;
    }

    // Ajouter le médicament à la liste locale pour cette commande
    setOrderMedications(prev => {
      const currentMeds = prev[orderId] || [];
      return {
        ...prev,
        [orderId]: [...currentMeds, {
          name: newMedication.name,
          price: newMedication.price,
          surBon: newMedication.surBon,
          available: true
        }]
      };
    });

    // Réinitialiser le formulaire
    setNewMedication({ name: '', price: '', surBon: false });

    toast({
      title: "Médicament ajouté",
      description: `${newMedication.name} a été ajouté à la commande`,
    });
  };

  // Fonction pour supprimer un médicament ajouté par le pharmacien
  const removePharmaticistMedication = (orderId: string, index: number) => {
    setOrderMedications(prev => {
      const currentMeds = prev[orderId] || [];
      const updatedMeds = currentMeds.filter((_, i) => i !== index);
      return {
        ...prev,
        [orderId]: updatedMeds
      };
    });

    toast({
      title: "Médicament supprimé",
      description: "Le médicament a été retiré de la commande",
    });
  };

  // Fonction pour modifier le nom d'un médicament patient
  const updateMedicationName = (orderId: string, medIndex: number, newName: string, isPatientMed: boolean = true) => {
    const key = isPatientMed ? `${orderId}-${medIndex}` : `pharmacist-${orderId}-${medIndex}`;
    setMedicationNames(prev => ({
      ...prev,
      [key]: newName
    }));
  };

  // Fonction pour basculer le mode d'édition d'un médicament
  const toggleEditMode = (statusKey: string) => {
    setEditingMedication(prev => ({
      ...prev,
      [statusKey]: !prev[statusKey]
    }));
  };

  const handleSendResponse = (orderId: string, originalMedications: any[]) => {
    const medications = originalMedications.map((med: any, index: number) => {
      const statusKey = `${orderId}-${index}`;
      const priceKey = `${orderId}-${index}`;
      const status = medicationStatuses[statusKey] || { available: true, surBon: med.surBon || false };
      const price = medicationPrices[priceKey] || '';

      return {
        ...med,
        ...status,
        price: price ? parseFloat(price) : undefined
      };
    });

    sendResponseMutation.mutate({ orderId, medications });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">
                💊 Tableau de bord Pharmacien
              </h1>
              <p className="text-gray-600">
                Bienvenue Dr. {user?.firstName} ! Gérez votre pharmacie et les commandes
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/pharmacy-profile'}
                className="bg-blue-50 hover:bg-blue-100 border-blue-200"
              >
                🏪 Gérer la pharmacie
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/create-pharmacy'}
                className="bg-green-50 hover:bg-green-100 border-green-200"
              >
                ➕ Créer pharmacie
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">
              Nouvelles Commandes
              {orders?.filter((o: any) => o.status === 'pending')?.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {orders.filter((o: any) => o.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="prescriptions">Vérification</TabsTrigger>
            <TabsTrigger value="pricing">Prix & Alternatives</TabsTrigger>
            <TabsTrigger value="preparation">
              Livraison & Livreurs
              {orders?.filter((o: any) => o.status === 'confirmed' || o.status === 'ready_for_delivery')?.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {orders.filter((o: any) => o.status === 'confirmed' || o.status === 'ready_for_delivery').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Réception des Commandes */}
          <TabsContent value="orders">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setActiveTab("orders")}
                  data-testid="card-nouvelles-commandes"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Nouvelles Commandes</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {ordersLoading ? "..." : (orders?.filter((o: any) => o.status === 'pending')?.length || 0)}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        🔔
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setActiveTab("preparation")}
                  data-testid="card-en-preparation"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">En Préparation</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {ordersLoading ? "..." : (orders?.filter((o: any) => o.status === 'confirmed' || o.status === 'preparing')?.length || 0)}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        ⚗️
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setActiveTab("preparation")}
                  data-testid="card-pretes"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Prêtes</p>
                        <p className="text-2xl font-bold text-green-600">
                          {ordersLoading ? "..." : (orders?.filter((o: any) => o.status === 'ready_for_delivery')?.length || 0)}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        ✅
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  data-testid="card-livrees"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Livrées</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {ordersLoading ? "..." : (orders?.filter((o: any) => o.status === 'delivered')?.length || 0)}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        🚚
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {ordersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Chargement des commandes...</p>
                </div>
              ) : !orders || orders?.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      📋
                    </div>
                    <h3 className="font-semibold mb-2">Aucune commande</h3>
                    <p className="text-sm text-gray-600">Les commandes apparaîtront ici</p>
                  </CardContent>
                </Card>
              ) : orders?.map((order: any) => (
                <Card key={order.id} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Commande #{order.id.slice(0, 8)}
                      </CardTitle>
                      <Badge variant={order.status === 'pending' ? "secondary" : "outline"}>
                        {order.status === 'pending' ? 'Nouvelle' :
                         order.status === 'confirmed' ? 'Confirmée' :
                         order.status === 'preparing' ? 'En préparation' :
                         order.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Patient: {order.user?.firstName} {order.user?.lastName} • {order.user?.phone}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Adresse de livraison</p>
                        <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Date de commande</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>

                    {/* Médicaments demandés */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Médicaments demandés</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        {order.medications && typeof order.medications === 'string' ? (
                          JSON.parse(order.medications).map((med: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm py-1">
                              <span>{med.name}</span>
                              {med.surBon && <Badge variant="outline" className="text-xs">Sur BON</Badge>}
                            </div>
                          ))
                        ) : order.medications && Array.isArray(order.medications) ? (
                          order.medications.map((med: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm py-1">
                              <span>{med.name}</span>
                              {med.surBon && <Badge variant="outline" className="text-xs">Sur BON</Badge>}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">Aucun médicament spécifié</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 flex-wrap gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" data-testid={`button-view-prescription-${order.id}`}>
                            👁️ Voir Ordonnance
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Ordonnance - Commande #{order.id.slice(0, 8)}</DialogTitle>
                            <DialogDescription>
                              Patient: {order.user?.firstName} {order.user?.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Layout en deux colonnes pour ordonnance et documents */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Colonne gauche - Photo d'ordonnance */}
                              <div>
                                <h4 className="font-medium mb-3">Photo de l'ordonnance</h4>
                                {order.prescriptionId ? (
                                  <div className="border rounded-lg p-4 bg-gray-50">
                                    <p className="text-sm text-gray-600 mb-3">Ordonnance ID: {order.prescriptionId}</p>
                                    <div className="bg-white rounded-lg overflow-hidden border">
                                      <PrescriptionImage
                                        prescriptionId={order.prescriptionId}
                                        className="w-full h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                      />
                                      <div className="p-2 bg-gray-50 text-center">
                                        <p className="text-xs text-gray-500">Cliquez pour agrandir</p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="border rounded-lg p-6 bg-yellow-50">
                                    <div className="text-center">
                                      <span className="text-4xl mb-2 block">⚠️</span>
                                      <p className="text-sm text-yellow-700 font-medium">Commande sans ordonnance</p>
                                      <p className="text-xs text-yellow-600 mt-1">Cette commande a été passée sans ordonnance photographiée</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Colonne droite - Documents BON et informations */}
                              <div>
                                <h4 className="font-medium mb-3">Documents BON et informations</h4>
                                <div className="space-y-3">
                                  {/* Documents BON */}
                                  {order.bonDocuments ? (
                                    <div className="border rounded-lg p-4 bg-blue-50">
                                      <h5 className="font-medium text-blue-900 mb-2">Documents BON uploadés</h5>
                                      <div className="space-y-2">
                                        {JSON.parse(order.bonDocuments).map((doc: any, index: number) => (
                                          <div key={index} className="bg-white rounded border">
                                            <div className="flex items-center justify-between p-2">
                                              <div className="flex items-center space-x-2">
                                                <span className="text-blue-600">📄</span>
                                                <span className="text-sm font-medium">{doc.name}</span>
                                              </div>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  const imageKey = `${order.id}-${index}`;
                                                  setVisibleImages(prev => ({
                                                    ...prev,
                                                    [imageKey]: !prev[imageKey]
                                                  }));
                                                }}
                                              >
                                                {visibleImages[`${order.id}-${index}`] ? '👁️ Cacher' : '👁️ Voir'}
                                              </Button>
                                            </div>

                                            {/* Image affichée directement */}
                                            {visibleImages[`${order.id}-${index}`] && (
                                              <div className="border-t p-4 bg-gray-50">
                                                <img
                                                  src={doc.data}
                                                  alt={`Document BON: ${doc.name}`}
                                                  className="w-full max-h-80 object-contain rounded cursor-pointer hover:shadow-lg transition-shadow"
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();

                                                    // Ouvrir en plein écran pour agrandir
                                                    const modal = document.createElement('div');
                                                    modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4';
                                                    modal.style.zIndex = '9999';
                                                    modal.style.cursor = 'pointer';

                                                    const modalContent = document.createElement('div');
                                                    modalContent.className = 'relative max-w-full max-h-full';
                                                    modalContent.innerHTML = `
                                                      <img src="${doc.data}"
                                                           class="max-w-full max-h-full object-contain"
                                                           alt="Document BON: ${doc.name}" />
                                                      <button class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 text-2xl font-bold">&times;</button>
                                                    `;

                                                    modal.appendChild(modalContent);

                                                    const closeModal = () => {
                                                      if (document.body.contains(modal)) {
                                                        document.body.removeChild(modal);
                                                      }
                                                    };

                                                    modalContent.addEventListener('click', (e) => e.stopPropagation());
                                                    const closeBtn = modalContent.querySelector('button');
                                                    closeBtn?.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
                                                    modal.addEventListener('click', closeModal);

                                                    const handleEscape = (e: KeyboardEvent) => {
                                                      if (e.key === 'Escape') {
                                                        closeModal();
                                                        document.removeEventListener('keydown', handleEscape);
                                                      }
                                                    };
                                                    document.addEventListener('keydown', handleEscape);

                                                    document.body.appendChild(modal);
                                                  }}
                                                />
                                                <p className="text-xs text-gray-500 mt-2 text-center">
                                                  Cliquez sur l'image pour l'agrandir
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="border rounded-lg p-4 bg-gray-50">
                                      <p className="text-sm text-gray-500 text-center">Aucun document BON uploadé</p>
                                    </div>
                                  )}

                                  {/* Informations supplémentaires */}
                                  <div className="border rounded-lg p-4 bg-gray-50">
                                    <h5 className="font-medium mb-2">Informations de la commande</h5>
                                    <div className="space-y-1 text-sm">
                                      <p><span className="font-medium">Date:</span> {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}</p>
                                      <p><span className="font-medium">Notes:</span> {order.deliveryNotes || "Aucune note"}</p>
                                      {order.totalAmount && (
                                        <p><span className="font-medium">Montant estimé:</span> {order.totalAmount} FCFA</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Gestion des médicaments */}
                            <div>
                              <h4 className="font-medium mb-3">Gestion des médicaments</h4>
                              
                              {/* Section pour ajouter de nouveaux médicaments */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <h5 className="font-medium text-blue-900 mb-3">➕ Ajouter des médicaments depuis l'ordonnance</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                  <Input
                                    placeholder="Nom du médicament"
                                    value={newMedication.name}
                                    onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Prix (FCFA)"
                                    value={newMedication.price}
                                    onChange={(e) => setNewMedication(prev => ({ ...prev, price: e.target.value }))}
                                    min="0"
                                    step="1"
                                  />
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id={`new-med-surbon-${order.id}`}
                                      checked={newMedication.surBon}
                                      onCheckedChange={(checked) => setNewMedication(prev => ({ ...prev, surBon: checked }))}
                                    />
                                    <Label htmlFor={`new-med-surbon-${order.id}`} className="text-sm">
                                      Sur BON
                                    </Label>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => addMedicationToOrder(order.id)}
                                  disabled={!newMedication.name.trim() || !newMedication.price}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  ➕ Ajouter ce médicament
                                </Button>
                              </div>

                              {/* Liste des médicaments existants et ajoutés */}
                              <div className="space-y-3">
                                {/* Médicaments du patient */}
                                {order.medications && typeof order.medications === 'string' ? (
                                  JSON.parse(order.medications).map((med: any, index: number) => {
                                    const statusKey = `${order.id}-${index}`;
                                    const currentStatus = medicationStatuses[statusKey] || { available: true, surBon: med.surBon || false };

                                    return (
                                      <div key={index} className="border rounded-lg p-4 bg-white">
                                        <div className="flex items-center justify-between mb-3">
                                          {editingMedication[statusKey] ? (
                                            <div className="flex items-center space-x-2 flex-1">
                                              <Input
                                                value={medicationNames[statusKey] || med.name}
                                                onChange={(e) => updateMedicationName(order.id, index, e.target.value, true)}
                                                className="flex-1"
                                                placeholder="Nom du médicament"
                                              />
                                              <Button
                                                size="sm"
                                                onClick={() => toggleEditMode(statusKey)}
                                                className="bg-green-600 hover:bg-green-700"
                                              >
                                                ✅
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  setMedicationNames(prev => {
                                                    const updated = { ...prev };
                                                    delete updated[statusKey];
                                                    return updated;
                                                  });
                                                  toggleEditMode(statusKey);
                                                }}
                                              >
                                                ❌
                                              </Button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center space-x-2 flex-1">
                                              <h5 className="font-medium">{medicationNames[statusKey] || med.name}</h5>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => toggleEditMode(statusKey)}
                                                className="text-blue-600 hover:text-blue-700"
                                              >
                                                ✏️
                                              </Button>
                                            </div>
                                          )}
                                          <Badge variant={currentStatus.available ? "default" : "destructive"}>
                                            {currentStatus.available ? "Disponible" : "Indisponible"}
                                          </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                          <div className="flex items-center space-x-2">
                                            <Switch
                                              id={`available-${statusKey}`}
                                              checked={currentStatus.available}
                                              onCheckedChange={(checked) =>
                                                toggleMedicationStatus(order.id, index, 'available', checked)
                                              }
                                            />
                                            <Label htmlFor={`available-${statusKey}`} className="text-sm">
                                              Disponible en stock
                                            </Label>
                                          </div>

                                          <div className="flex items-center space-x-2">
                                            <Switch
                                              id={`surbon-${statusKey}`}
                                              checked={currentStatus.surBon}
                                              onCheckedChange={(checked) =>
                                                toggleMedicationStatus(order.id, index, 'surBon', checked)
                                              }
                                            />
                                            <Label htmlFor={`surbon-${statusKey}`} className="text-sm">
                                              Sur BON (remboursable)
                                            </Label>
                                          </div>
                                        </div>

                                        {/* Prix du médicament */}
                                        <div className="mt-3">
                                          <Label htmlFor={`price-${statusKey}`} className="text-sm font-medium">
                                            Prix (FCFA)
                                          </Label>
                                          <Input
                                            id={`price-${statusKey}`}
                                            type="number"
                                            placeholder="Prix en FCFA"
                                            value={medicationPrices[statusKey] || ''}
                                            onChange={(e) => updateMedicationPrice(order.id, index, e.target.value)}
                                            className="mt-1"
                                            min="0"
                                            step="1"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : order.medications && Array.isArray(order.medications) ? (
                                  order.medications.map((med: any, index: number) => {
                                    const statusKey = `${order.id}-${index}`;
                                    const currentStatus = medicationStatuses[statusKey] || { available: true, surBon: med.surBon || false };

                                    return (
                                      <div key={index} className="border rounded-lg p-4 bg-white">
                                        <div className="flex items-center justify-between mb-3">
                                          <h5 className="font-medium">{med.name}</h5>
                                          <Badge variant={currentStatus.available ? "default" : "destructive"}>
                                            {currentStatus.available ? "Disponible" : "Indisponible"}
                                          </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                          <div className="flex items-center space-x-2">
                                            <Switch
                                              id={`available-${statusKey}`}
                                              checked={currentStatus.available}
                                              onCheckedChange={(checked) =>
                                                toggleMedicationStatus(order.id, index, 'available', checked)
                                              }
                                            />
                                            <Label htmlFor={`available-${statusKey}`} className="text-sm">
                                              Disponible en stock
                                            </Label>
                                          </div>

                                          <div className="flex items-center space-x-2">
                                            <Switch
                                              id={`surbon-${statusKey}`}
                                              checked={currentStatus.surBon}
                                              onCheckedChange={(checked) =>
                                                toggleMedicationStatus(order.id, index, 'surBon', checked)
                                              }
                                            />
                                            <Label htmlFor={`surbon-${statusKey}`} className="text-sm">
                                              Sur BON (remboursable)
                                            </Label>
                                          </div>
                                        </div>

                                        {/* Prix du médicament */}
                                        <div className="mt-3">
                                          <Label htmlFor={`price-${statusKey}`} className="text-sm font-medium">
                                            Prix (FCFA)
                                          </Label>
                                          <Input
                                            id={`price-${statusKey}`}
                                            type="number"
                                            placeholder="Prix en FCFA"
                                            value={medicationPrices[statusKey] || ''}
                                            onChange={(e) => updateMedicationPrice(order.id, index, e.target.value)}
                                            className="mt-1"
                                            min="0"
                                            step="1"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <p className="text-sm text-gray-500">Aucun médicament spécifié par le patient</p>
                                )}

                                {/* Médicaments ajoutés par le pharmacien */}
                                {orderMedications[order.id] && orderMedications[order.id].length > 0 && (
                                  <div className="border-t pt-4">
                                    <h5 className="font-medium text-blue-900 mb-3">💊 Médicaments ajoutés depuis l'ordonnance</h5>
                                    <div className="space-y-3">
                                      {orderMedications[order.id].map((med: any, index: number) => {
                                        const statusKey = `pharmacist-${order.id}-${index}`;
                                        const currentStatus = medicationStatuses[statusKey] || { available: med.available, surBon: med.surBon };

                                        return (
                                          <div key={statusKey} className="border rounded-lg p-4 bg-blue-50">
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="flex items-center space-x-2 flex-1">
                                                <h5 className="font-medium text-blue-900">{med.name}</h5>
                                                <Button
                                                  size="sm"
                                                  variant="destructive"
                                                  onClick={() => removePharmaticistMedication(order.id, index)}
                                                  className="text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200"
                                                  title="Supprimer ce médicament"
                                                >
                                                  🗑️
                                                </Button>
                                              </div>
                                              <Badge variant={currentStatus.available ? "default" : "destructive"}>
                                                {currentStatus.available ? "Disponible" : "Indisponible"}
                                              </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-3">
                                              <div className="flex items-center space-x-2">
                                                <Switch
                                                  id={`available-${statusKey}`}
                                                  checked={currentStatus.available}
                                                  onCheckedChange={(checked) =>
                                                    toggleMedicationStatus(order.id, index, 'available', checked)
                                                  }
                                                />
                                                <Label htmlFor={`available-${statusKey}`} className="text-sm">
                                                  Disponible en stock
                                                </Label>
                                              </div>

                                              <div className="flex items-center space-x-2">
                                                <Switch
                                                  id={`surbon-${statusKey}`}
                                                  checked={currentStatus.surBon}
                                                  onCheckedChange={(checked) =>
                                                    toggleMedicationStatus(order.id, index, 'surBon', checked)
                                                  }
                                                />
                                                <Label htmlFor={`surbon-${statusKey}`} className="text-sm">
                                                  Sur BON (remboursable)
                                                </Label>
                                              </div>
                                            </div>

                                            <div className="mt-3">
                                              <Label htmlFor={`price-${statusKey}`} className="text-sm font-medium">
                                                Prix (FCFA)
                                              </Label>
                                              <Input
                                                id={`price-${statusKey}`}
                                                type="number"
                                                placeholder="Prix en FCFA"
                                                value={medicationPrices[statusKey] || med.price || ''}
                                                onChange={(e) => updateMedicationPrice(order.id, index, e.target.value)}
                                                className="mt-1"
                                                min="0"
                                                step="1"
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex space-x-2 mt-4 pt-4 border-t">
                                <Button
                                  onClick={() => {
                                    // Combiner les médicaments du patient et ceux ajoutés par le pharmacien
                                    const patientMedications = order.medications && typeof order.medications === 'string'
                                      ? JSON.parse(order.medications).map((med: any, index: number) => {
                                          const statusKey = `${order.id}-${index}`;
                                          return {
                                            ...med,
                                            name: medicationNames[statusKey] || med.name // Utiliser le nom modifié si disponible
                                          };
                                        })
                                      : [];
                                    
                                    const pharmacistMedications = orderMedications[order.id] || [];
                                    
                                    const allMedications = [
                                      ...patientMedications,
                                      ...pharmacistMedications
                                    ];

                                    handleSendResponse(order.id, allMedications);
                                  }}
                                  disabled={sendResponseMutation.isPending}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  📤 Envoyer la réponse
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-accept-order-${order.id}`}
                        onClick={() => handleOrderUpdate(order.id, 'confirmed')}
                        disabled={updateOrderMutation.isPending}
                      >
                        ✅ Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        data-testid={`button-reject-order-${order.id}`}
                        onClick={() => handleOrderUpdate(order.id, 'rejected')}
                        disabled={updateOrderMutation.isPending}
                      >
                        ❌ Refuser
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Vérification des Médicaments */}
          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle>🔍 Vérification des Médicaments</CardTitle>
                <CardDescription>
                  Vérifiez la disponibilité et conformité des médicaments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prescriptionsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Chargement des prescriptions...</p>
                    </div>
                  ) : prescriptions?.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        🔍
                      </div>
                      <h3 className="font-semibold mb-2">Aucune prescription à vérifier</h3>
                      <p className="text-sm text-gray-600">Les prescriptions à vérifier apparaîtront ici</p>
                    </div>
                  ) : prescriptions?.map((prescription: any) => (
                    <div key={prescription.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">Ordonnance #{prescription.id.slice(0, 8)}</h4>
                          <p className="text-sm text-gray-600">
                            Patient: {prescription.user?.firstName} {prescription.user?.lastName}
                          </p>
                        </div>
                        <Badge variant="outline">À vérifier</Badge>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium mb-2">Médicaments prescrits:</p>
                        <div className="space-y-1">
                          {prescription.medications?.map((med: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{med.name} - {med.dosage}</span>
                              <Badge variant={med.available ? "default" : "destructive"}>
                                {med.available ? "Disponible" : "Indisponible"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleOrderUpdate(prescription.id, 'confirmed')}
                          disabled={updateOrderMutation.isPending}
                        >
                          ✅ Valider
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleOrderUpdate(prescription.id, 'rejected')}
                          disabled={updateOrderMutation.isPending}
                        >
                          ❌ Rejeter
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Proposition de Prix et Alternatives */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>💰 Proposition de Prix & Alternatives</CardTitle>
                <CardDescription>
                  Définissez les prix et proposez des alternatives si nécessaire
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    💰
                  </div>
                  <h3 className="font-semibold mb-2">Module de Tarification</h3>
                  <p className="text-sm text-gray-600">
                    Fonctionnalité de gestion des prix en développement
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validation et Préparation */}
          <TabsContent value="preparation">
            <Card>
              <CardHeader>
                <CardTitle>⚗️ Validation & Préparation</CardTitle>
                <CardDescription>
                  Commandes confirmées à préparer et commandes prêtes pour livraison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Section: Commandes en préparation */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <span className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-2">⚗️</span>
                      En Préparation
                    </h3>
                    <div className="space-y-4">
                      {orders?.filter((order: any) => order.status === 'confirmed').length === 0 ? (
                        <div className="border rounded-lg p-6 bg-gray-50 text-center">
                          <div className="text-gray-400 mb-2">⚗️</div>
                          <p className="text-sm text-gray-600">Aucune commande en préparation</p>
                        </div>
                      ) : orders?.filter((order: any) => order.status === 'confirmed').map((order: any) => (
                        <div key={order.id} className="border rounded-lg p-4 bg-blue-50">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">Commande #{order.id.slice(0, 8)}</h4>
                              <p className="text-sm text-gray-600">
                                Patient: {order.user?.firstName} {order.user?.lastName}
                              </p>
                            </div>
                            <Badge>En préparation</Badge>
                          </div>

                          <div className="flex items-center space-x-4 mb-3">
                            <div className="text-sm">
                              <span className="font-medium">Montant total:</span> {order.totalAmount} FCFA
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Adresse:</span> {order.deliveryAddress}
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleOrderUpdate(order.id, 'ready_for_delivery')}
                              disabled={updateOrderMutation.isPending}
                            >
                              📦 Prêt pour livraison
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section: Commandes prêtes pour livraison avec assignation de livreur */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <span className="bg-green-100 rounded-full w-8 h-8 flex items-center justify-center mr-2">📦</span>
                      Prêtes pour Livraison - Assignation des Livreurs
                    </h3>
                    {/* The following line was replaced as per the changes */}
                    <ReadyForDeliveryOrders orders={orders || []} />
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