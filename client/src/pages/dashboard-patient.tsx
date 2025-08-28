
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { useAudioNotifications } from "@/utils/audioGenerator";

import BottomNavigation from "@/components/bottom-navigation";
import { MapPin, Clock, Star, Phone, Camera, Upload, Plus, X, FileText } from "lucide-react";

export default function DashboardPatient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();

  // Hooks pour notifications sonores
  const {
    isNotificationsEnabled,
    permissionStatus,
    requestNotificationPermission,
    notifyOrderStatusChange,
    testNotification,
    playNotificationSound
  } = useOrderNotifications();

  const { playSound, testSound, testAllSounds } = useAudioNotifications();
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [orderData, setOrderData] = useState({
    deliveryAddress: '',
    medications: [{ name: '', surBon: false }],
    pharmacyMessage: '',
    bonDocuments: [] as File[],
    prescriptionPhoto: null as File | null
  });
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState({
    waveNumber: '',
    orangeNumber: '',
    moovNumber: '',
    momoNumber: ''
  });

  // Helper functions for medication management
  const addMedication = () => {
    setOrderData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', surBon: false }]
    }));
  };

  const removeMedication = (index: number) => {
    setOrderData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const updateMedication = (index: number, field: 'name' | 'surBon', value: string | boolean) => {
    setOrderData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setOrderData(prev => ({
      ...prev,
      bonDocuments: [...prev.bonDocuments, ...files]
    }));
  };

  const removeDocument = (index: number) => {
    setOrderData(prev => ({
      ...prev,
      bonDocuments: prev.bonDocuments.filter((_, i) => i !== index)
    }));
  };

  const handlePrescriptionPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOrderData(prev => ({
        ...prev,
        prescriptionPhoto: file
      }));
    }
  };

  const removePrescriptionPhoto = () => {
    setOrderData(prev => ({
      ...prev,
      prescriptionPhoto: null
    }));
  };

  // Géolocalisation automatique
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });

          // Reverse geocoding pour obtenir l'adresse
          try {
            const response = await fetch(`/api/location/reverse?lat=${latitude}&lng=${longitude}`);
            const addressData = await response.json();
            setCurrentAddress(addressData.formatted_address);
            setOrderData(prev => ({ ...prev, deliveryAddress: addressData.formatted_address }));
          } catch (error) {
            console.error("Erreur géolocalisation:", error);
          }
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
          toast({
            title: "Géolocalisation",
            description: "Impossible d'obtenir votre position. Veuillez saisir votre adresse manuellement.",
            variant: "destructive",
          });
        }
      );
    }
  }, []);

  // Mutation pour créer une commande
  const createOrderMutation = useMutation({
    mutationFn: (orderDetails: any) =>
      apiRequest("/api/orders", "POST", orderDetails),
    onSuccess: () => {
      toast({
        title: "Commande créée",
        description: "Votre commande a été envoyée à la pharmacie",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setActiveTab("orders");
      setSelectedPharmacy(null);
      setOrderData({ deliveryAddress: '', medications: [{ name: '', surBon: false }], pharmacyMessage: '', bonDocuments: [], prescriptionPhoto: null });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande",
        variant: "destructive",
      });
    },
  });

  // Mutation pour le paiement
  const paymentMutation = useMutation({
    mutationFn: (paymentData: any) =>
      apiRequest("/api/orders/payment", "POST", paymentData),
    onSuccess: () => {
      toast({
        title: "Paiement confirmé",
        description: "Votre commande est maintenant en cours de livraison",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setSelectedOrderForPayment(null);
      setPaymentMethod('');
      setPaymentDetails({ waveNumber: '', orangeNumber: '', moovNumber: '', momoNumber: '' });
    },
    onError: () => {
      toast({
        title: "Erreur de paiement",
        description: "Impossible de traiter le paiement. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour confirmer la livraison
  const confirmDeliveryMutation = useMutation({
    mutationFn: async (orderId: string) => {
      console.log('🔄 Tentative de confirmation de livraison pour:', orderId);
      return await apiRequest(`/api/orders/${orderId}/confirm-delivery`, "POST");
    },
    onSuccess: (data, orderId) => {
      console.log('✅ Confirmation de livraison réussie pour:', orderId);
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/current'] });
      toast({
        title: "Livraison confirmée",
        description: "Votre commande a été marquée comme livrée avec succès",
      });
    },
    onError: (error: any, orderId) => {
      console.error('❌ Erreur confirmation livraison pour:', orderId, error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de confirmer la livraison",
        variant: "destructive",
      });
    },
  });

  // Mutation pour annuler une commande
  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string) =>
      apiRequest(`/api/orders/${orderId}/cancel`, "POST"),
    onSuccess: () => {
      toast({
        title: "Commande annulée",
        description: "Votre commande a été annulée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la commande",
        variant: "destructive",
      });
    },
  });

  // Mutation pour supprimer définitivement une commande
  const deleteOrderMutation = useMutation({
    mutationFn: (orderId: string) =>
      apiRequest(`/api/orders/${orderId}`, "DELETE"),
    onSuccess: () => {
      toast({
        title: "Commande supprimée",
        description: "La commande a été supprimée définitivement de la base de données",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/current"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la commande",
        variant: "destructive",
      });
    },
  });

  // Récupération des données avec refetchInterval pour les données temps réel
  const { data: orders, isLoading: ordersLoading } = useQuery({ 
    queryKey: ["/api/orders"],
    refetchInterval: 10000 // Refresh toutes les 10 secondes
  });

  // Pharmacies triées par distance si géolocalisation disponible
  const { data: pharmacies, isLoading: pharmaciesLoading } = useQuery({ 
    queryKey: ["/api/pharmacies", userLocation],
    queryFn: async () => {
      const url = userLocation 
        ? `/api/pharmacies?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=10`
        : `/api/pharmacies`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des pharmacies');
      }
      return response.json();
    },
    enabled: true
  });

  const { data: currentOrder } = useQuery({ 
    queryKey: ["/api/orders/current"],
    refetchInterval: 5000 // Refresh toutes les 5 secondes pour suivi temps réel
  });

  // État pour tracker les statuts précédents des commandes
  const [previousOrderStatuses, setPreviousOrderStatuses] = useState<Record<string, string>>({});

  // Surveillance des changements de statut pour déclencher les notifications sonores
  useEffect(() => {
    if (orders && Array.isArray(orders)) {
      let hasChanges = false;
      const newStatuses: Record<string, string> = {};

      orders.forEach((order: any) => {
        const currentStatus = order.status;
        const previousStatus = previousOrderStatuses[order.id];

        // Si le statut a changé et qu'on a les notifications activées
        if (previousStatus && previousStatus !== currentStatus) {
          console.log(`🔄 Changement de statut détecté: ${previousStatus} → ${currentStatus} pour commande ${order.id.slice(0, 8)}`);

          // Jouer le son directement dans l'application
          playSound(currentStatus).catch(error => {
            console.error('Erreur lecture son dans l\'app:', error);
          });

          // Déclencher notification système (sans son personnalisé)
          notifyOrderStatusChange(order.id, currentStatus, false);

          // Notification toast aussi
          const statusMessages: Record<string, string> = {
            confirmed: "✅ Votre commande a été confirmée par la pharmacie",
            preparing: "🔄 Votre commande est en cours de préparation",
            ready_for_delivery: "📦 Votre commande est prête pour la livraison",
            in_transit: "🚚 Le livreur est en route vers vous !",
            in_delivery: "🎯 Le livreur arrive bientôt !",
            delivered: "🎉 Votre commande a été livrée avec succès",
            cancelled: "❌ Votre commande a été annulée"
          };

          if (statusMessages[currentStatus]) {
            toast({
              title: "Mise à jour de commande",
              description: statusMessages[currentStatus],
              duration: currentStatus === 'in_transit' || currentStatus === 'in_delivery' ? 8000 : 5000,
            });
          }

          hasChanges = true;
        }

        // Conserver le statut actuel pour la prochaine vérification
        newStatuses[order.id] = currentStatus;
      });

      // Mettre à jour seulement s'il y a eu des changements ou de nouvelles commandes
      if (hasChanges || Object.keys(newStatuses).length !== Object.keys(previousOrderStatuses).length) {
        setPreviousOrderStatuses(newStatuses);
      }
    }
  }, [orders, notifyOrderStatusChange, toast, playSound]);

  // Initialiser les notifications au premier chargement
  useEffect(() => {
    if (!isNotificationsEnabled && permissionStatus === 'default') {
      // Proposer d'activer les notifications après 3 secondes
      const timer = setTimeout(() => {
        toast({
          title: "🔔 Notifications sonores",
          description: "Activez les notifications pour être averti des changements de statut de vos commandes même quand l'app est fermée",
          action: (
            <Button size="sm" onClick={requestNotificationPermission}>
              Activer
            </Button>
          ),
          duration: 10000,
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isNotificationsEnabled, permissionStatus, requestNotificationPermission, toast]);

  const handleCreateOrder = () => {
    if (selectedPharmacy && orderData.deliveryAddress && orderData.medications.some(med => med.name.trim())) {
      createOrderMutation.mutate({
        pharmacyId: selectedPharmacy.id,
        deliveryAddress: orderData.deliveryAddress,
        deliveryNotes: orderData.pharmacyMessage,
        medications: orderData.medications.filter(med => med.name.trim()),
        bonDocuments: orderData.bonDocuments.length > 0 ? 'documents-uploaded' : null,
        prescriptionPhoto: orderData.prescriptionPhoto ? 'prescription-photo-uploaded' : null,
        status: 'pending'
      });
    } else {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
    }
  };

  const handlePrescriptionUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('prescription', file);

      const response = await fetch('/api/prescriptions/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Ordonnance envoyée",
          description: "Votre ordonnance a été téléchargée avec succès",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'ordonnance",
        variant: "destructive",
      });
    }
  };

  const openCamera = () => {
    // Ouvrir la caméra pour prendre une photo
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setPrescriptionFile(file);
        handlePrescriptionUpload(file);
      }
    };
    input.click();
  };

  const selectFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setPrescriptionFile(file);
        handlePrescriptionUpload(file);
      }
    };
    input.click();
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-indigo-100 text-indigo-800';
      case 'ready_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'in_delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'preparing': return 'En préparation';
      case 'ready_for_delivery': return 'Prête pour livraison';
      case 'in_delivery': return 'En cours de livraison';
      case 'delivered': return 'Livrée';
      default: return status;
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    const orderNumber = orderId.slice(0, 8);
    const confirmMessage = `⚠️ ATTENTION : SUPPRESSION DÉFINITIVE ⚠️\n\nVous êtes sur le point de supprimer DÉFINITIVEMENT la commande #${orderNumber}.\n\nCette action est IRRÉVERSIBLE et supprimera complètement la commande de la base de données comme si elle n'avait jamais existé.\n\nÊtes-vous absolument certain de vouloir continuer ?`;

    if (confirm(confirmMessage)) {
      const doubleConfirm = confirm(`Dernière confirmation :\n\nSupprimer DÉFINITIVEMENT la commande #${orderNumber} ?\n\nTapez "CONFIRMER" si vous êtes sûr, sinon annulez.`);
      if (doubleConfirm) {
        deleteOrderMutation.mutate(orderId);
      }
    }
  };

  const handlePayment = () => {
    if (!selectedOrderForPayment || !paymentMethod) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner un moyen de paiement",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = parseFloat(selectedOrderForPayment.totalAmount) + 1000;
    const paymentData = {
      orderId: selectedOrderForPayment.id,
      paymentMethod,
      amount: totalAmount,
      deliveryFee: 1000,
      ...paymentDetails
    };

    paymentMutation.mutate(paymentData);
  };

  const handleConfirmDelivery = (orderId: string) => {
    console.log('🎯 HandleConfirmDelivery appelé avec orderId:', orderId);
    if (!orderId) {
      console.error('❌ OrderId manquant');
      toast({
        title: "Erreur",
        description: "ID de commande manquant",
        variant: "destructive",
      });
      return;
    }
    confirmDeliveryMutation.mutate(orderId);
  };

  const getPaymentMethods = () => {
    // Ces données devraient idéalement venir de l'API de la pharmacie
    return [
      { id: 'wave', name: 'WAVE CI', number: '+225 0701234567' },
      { id: 'orange', name: 'Orange Money', number: '+225 0701234568' },
      { id: 'moov', name: 'Moov Money', number: '+225 0501234567' },
      { id: 'momo', name: 'MTN MoMo', number: '+225 0501234568' }
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/icon-512x512.png" 
              alt="PharmaChape Logo" 
              className="w-10 h-10 rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Bonjour, {user?.firstName}! 👋
              </h1>
              <p className="text-sm text-gray-600">
                Que souhaitez-vous commander aujourd'hui?
              </p>
            </div>
          </div>
          
        </div>
        <p className="text-gray-600 mt-2">
          Bienvenue {user?.firstName} ! Gérez vos commandes et ordonnances
        </p>
        {currentAddress && (
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>Votre position: {currentAddress}</span>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">Mes Commandes</TabsTrigger>
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
                  Localisez une pharmacie et passez commande
                </p>
                <Button data-testid="button-new-order" onClick={() => navigate("/pharmacies")}>
                  Nouvelle Commande
                </Button>
              </CardContent>
            </Card>

            {ordersLoading ? (
              <div className="col-span-2 text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Chargement de vos commandes...</p>
              </div>
            ) : orders && Array.isArray(orders) && orders.length > 0 ? (
              orders.map((order: any) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Commande #{order.id.slice(0, 8)}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getOrderStatusColor(order.status)}>
                          {getOrderStatusText(order.status)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteOrder(order.id)}
                          title="Supprimer définitivement la commande"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Pharmacie:</strong> {(() => {
                        if (order.pharmacy?.name) {
                          return order.pharmacy.name;
                        }
                        if (order.pharmacyId) {
                          // Essayer de récupérer le nom depuis les données de pharmacies
                          const pharmacy = pharmacies?.find((p: any) => p.id === order.pharmacyId);
                          if (pharmacy?.name) {
                            return pharmacy.name;
                          }
                        }
                        return 'En cours d\'attribution';
                      })()}</p>
                      {order.pharmacy?.isEmergency24h && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            🚨 De garde 24h/24
                          </Badge>
                        </div>
                      )}
                      <p className="text-sm"><strong>Montant:</strong> {(() => {
                        // Utiliser d'abord order.totalAmount s'il existe et n'est pas zéro
                        if (order.totalAmount && order.totalAmount !== '0' && parseFloat(order.totalAmount) > 0) {
                          return `${parseFloat(order.totalAmount).toFixed(0)} FCFA`;
                        }

                        // Sinon, calculer à partir des médicaments
                        if (order.status === 'confirmed' || order.medications) {
                          try {
                            const medications = typeof order.medications === 'string' ? JSON.parse(order.medications) : order.medications;
                            let medicationsList = [];

                            if (Array.isArray(medications)) {
                              medicationsList = medications;
                            } else if (medications && Array.isArray(medications.items)) {
                              medicationsList = medications.items;
                            } else if (medications && typeof medications === 'object') {
                              medicationsList = Object.values(medications).filter(med => med && typeof med === 'object');
                            }

                            const total = medicationsList.reduce((sum: number, med: any) => {
                              const price = parseFloat(med.price) || 0;
                              const isAvailable = med.available !== false;
                              console.log(`Med: ${med.name}, Price: ${price}, Available: ${isAvailable}`);
                              return sum + (price > 0 && isAvailable ? price : 0);
                            }, 0);

                            console.log(`Total calculated: ${total} for order ${order.id}`);
                            return total > 0 ? `${total.toFixed(0)} FCFA` : 'En cours d\'évaluation';
                          } catch (error) {
                            console.error('Error calculating total:', error);
                            return 'En cours d\'évaluation';
                          }
                        }

                        return 'En cours d\'évaluation';
                      })()}</p>
                      <p className="text-sm"><strong>Adresse:</strong> {order.deliveryAddress}</p>
                      {order.deliveryNotes && (
                        <p className="text-sm"><strong>Notes:</strong> {order.deliveryNotes}</p>
                      )}

                      {/* Affichage des médicaments avec prix si confirmés par la pharmacie */}
                      <div className="mt-3 bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium mb-2">Détails des médicaments:</p>
                        <div className="space-y-2">
                          {(() => {
                            try {
                              const medications = typeof order.medications === 'string' ? JSON.parse(order.medications) : order.medications;
                              let medicationsList = [];

                              if (Array.isArray(medications)) {
                                medicationsList = medications;
                              } else if (medications && Array.isArray(medications.items)) {
                                medicationsList = medications.items;
                              } else if (medications && typeof medications === 'object') {
                                medicationsList = Object.values(medications).filter(med => med && typeof med === 'object');
                              }

                              return medicationsList;
                            } catch (error) {
                              console.error('Erreur parsing medications:', error);
                              return [];
                            }
                          })().map((med: any, index: number) => (
                            <div key={index} className="flex justify-between items-center text-sm py-1 border-b border-gray-200 last:border-b-0">
                              <div className="flex flex-col">
                                <span className="font-medium">{med.name}</span>
                                <div className="flex gap-2 mt-1">
                                  {med.available !== undefined && (
                                    <Badge variant={med.available ? "default" : "destructive"} className="text-xs">
                                      {med.available ? "Disponible" : "Indisponible"}
                                    </Badge>
                                  )}
                                  {med.surBon && (
                                    <Badge variant="outline" className="text-xs">Sur BON</Badge>
                                  )}
                                </div>
                              </div>
                              {med.price && (
                                <span className="text-green-600 font-semibold">{med.price} FCFA</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Calcul et affichage des totaux pour les commandes confirmées */}
                        {order.status === 'confirmed' && (
                          <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Sous-total médicaments:</span>
                              <span className="font-semibold">
                                {(() => {
                                  // Utiliser d'abord order.totalAmount s'il existe
                                  if (order.totalAmount && order.totalAmount !== '0' && parseFloat(order.totalAmount) > 0) {
                                    return parseFloat(order.totalAmount).toFixed(0);
                                  }

                                  try {
                                    const medications = typeof order.medications === 'string' ? JSON.parse(order.medications) : order.medications;
                                    let medicationsList = [];

                                    if (Array.isArray(medications)) {
                                      medicationsList = medications;
                                    } else if (medications && Array.isArray(medications.items)) {
                                      medicationsList = medications.items;
                                    } else if (medications && typeof medications === 'object') {
                                      medicationsList = Object.values(medications).filter(med => med && typeof med === 'object');
                                    }

                                    const total = medicationsList.reduce((sum: number, med: any) => {
                                      const price = parseFloat(med.price) || 0;
                                      const isAvailable = med.available !== false;
                                      return sum + (price > 0 && isAvailable ? price : 0);
                                    }, 0);

                                    return total > 0 ? total.toFixed(0) : '0';
                                  } catch (error) {
                                    console.error('Erreur calcul total:', error);
                                    return '0';
                                  }
                                })()} FCFA
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Frais de livraison:</span>
                              <span className="font-semibold">1,000 FCFA</span>
                            </div>
                            <div className="flex items-center justify-between border-t pt-2">
                              <span className="font-medium">Total à payer:</span>
                              <span className="font-bold text-lg">
                                {(() => {
                                  // Utiliser d'abord order.totalAmount s'il existe
                                  if (order.totalAmount && order.totalAmount !== '0' && parseFloat(order.totalAmount) > 0) {
                                    return (parseFloat(order.totalAmount) + 1000).toFixed(0);
                                  }

                                  try {
                                    const medications = typeof order.medications === 'string' ? JSON.parse(order.medications) : order.medications;
                                    let medicationsList = [];

                                    if (Array.isArray(medications)) {
                                      medicationsList = medications;
                                    } else if (medications && Array.isArray(medications.items)) {
                                      medicationsList = medications.items;
                                    } else if (medications && typeof medications === 'object') {
                                      medicationsList = Object.values(medications).filter(med => med && typeof med === 'object');
                                    }

                                    const subtotal = medicationsList.reduce((sum: number, med: any) => {
                                      const price = parseFloat(med.price) || 0;
                                      const isAvailable = med.available !== false;
                                      return sum + (price > 0 && isAvailable ? price : 0);
                                    }, 0);

                                    return subtotal > 0 ? (subtotal + 1000).toFixed(0) : '1000';
                                  } catch (error) {
                                    console.error('Erreur calcul total final:', error);
                                    return '1000';
                                  }
                                })()} FCFA
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Boutons d'action selon le statut de la commande */}
                      <div className="mt-3 space-y-2">
                        {/* Pour les commandes confirmées - validation seulement */}
                        {order.status === 'confirmed' && order.totalAmount && order.totalAmount !== '0' && (
                          <Button 
                            size="sm" 
                            onClick={() => navigate("/order-validation?orderId=" + order.id)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            📋 Valider la commande
                          </Button>
                        )}

                        {/* Pour les commandes en préparation */}
                        {order.status === 'preparing' && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              🔄 <strong>En préparation :</strong> Votre commande est en cours de préparation par la pharmacie.
                            </p>
                          </div>
                        )}

                        {/* Pour les commandes prêtes pour livraison */}
                        {order.status === 'ready_for_delivery' && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <p className="text-sm text-purple-800">
                              📦 <strong>Prête pour livraison :</strong> Votre commande est prête et en attente d'assignation au livreur.
                            </p>
                          </div>
                        )}

                        {/* Pour les commandes en transit/livraison */}
                        {(order.status === 'in_transit' || order.status === 'in_delivery') && (
                          <div className="space-y-2">
                            <Button 
                              size="sm" 
                              className="w-full" 
                              onClick={() => {
                                setSelectedOrderForTracking(order);
                                setActiveTab("tracking");
                              }}
                            >
                              📋 Info de la livraison
                            </Button>
                            <Button 
                              size="sm" 
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                              onClick={() => navigate("/delivery-tracking")}
                            >
                              🗺️ GPS Temps Réel
                            </Button>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-sm text-green-800 mb-2">
                                ✅ Médicaments reçus ? Confirmez la livraison
                              </p>
                              <Button 
                                size="sm"
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleConfirmDelivery(order.id)}
                                disabled={confirmDeliveryMutation.isPending}
                                data-testid={`button-confirm-delivery-${order.id.slice(0, 8)}`}
                              >
                                {confirmDeliveryMutation.isPending ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                    Confirmation...
                                  </>
                                ) : (
                                  <>
                                    ✅ Confirmer la livraison
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {order.status === 'arrived_pending_confirmation' && (
                          <div className="space-y-2">
                            <Button 
                              size="sm" 
                              className="w-full" 
                              onClick={() => {
                                setSelectedOrderForTracking(order);
                                setActiveTab("tracking");
                              }}
                            >
                              📋 Info de la livraison
                            </Button>
                            <Button 
                              size="sm" 
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                              onClick={() => navigate("/delivery-tracking")}
                            >
                              🗺️ GPS Temps Réel
                            </Button>

                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                              <p className="text-sm text-orange-800 text-center mb-2">
                                ⏳ <strong>Livreur arrivé :</strong> En attente de votre confirmation de réception
                              </p>
                              <Button 
                                size="sm"
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleConfirmDelivery(order.id)}
                                disabled={confirmDeliveryMutation.isPending}
                                data-testid={`button-confirm-delivery-${order.id.slice(0, 8)}`}
                              >
                                {confirmDeliveryMutation.isPending ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                    Confirmation...
                                  </>
                                ) : (
                                  <>
                                    ✅ Confirmer la livraison
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Messages d'information pour les commandes en cours */}
                      {order.status === 'pending' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                          <p className="text-sm text-yellow-800">
                            ⏳ <strong>En cours d'attribution :</strong> Votre commande est en attente de confirmation par la pharmacie. Le suivi GPS sera disponible une fois la commande confirmée.
                          </p>
                        </div>
                      )}

                      {order.status === 'confirmed' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                          <p className="text-sm text-blue-800">
                            ℹ️ <strong>Livraison en préparation :</strong> Votre commande sera bientôt assignée à un livreur. Le suivi GPS sera disponible dès le départ de la pharmacie.
                          </p>
                        </div>
                      )}

                      {order.status === 'ready_for_delivery' && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-2">
                          <p className="text-sm text-purple-800">
                            🚚 <strong>Prêt pour livraison :</strong> Votre commande est prête et en attente d'assignation au livreur. Le départ aura lieu sous peu.
                          </p>
                        </div>
                      )}

                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  📦
                </div>
                <h3 className="font-semibold mb-2">Aucune commande</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Vous n'avez pas encore passé de commande
                </p>
                <Button onClick={() => navigate("/pharmacies")}>
                  Créer ma première commande
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Info Livraison */}
        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📋 Informations de Livraison
              </CardTitle>
              <CardDescription>
                Détails complets de votre livraison en cours et informations du livreur
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(selectedOrderForTracking || currentOrder) && typeof (selectedOrderForTracking || currentOrder) === 'object' && 'status' in (selectedOrderForTracking || currentOrder) && ['in_delivery', 'in_transit', 'preparing', 'ready_for_delivery'].includes(((selectedOrderForTracking || currentOrder) as any).status) ? (
                <div className="space-y-6">
                  {/* Informations de la commande */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-blue-900">
                          📦 Détails de la commande
                        </h3>
                        <p className="text-sm text-blue-700">
                          Commande #{((selectedOrderForTracking || currentOrder) as any).id.slice(0, 8)}
                        </p>
                      </div>
                      <Badge className={`${
                        ((selectedOrderForTracking || currentOrder) as any).status === 'in_delivery' ? 'bg-green-100 text-green-800' :
                        ((selectedOrderForTracking || currentOrder) as any).status === 'in_transit' ? 'bg-orange-100 text-orange-800' :
                        ((selectedOrderForTracking || currentOrder) as any).status === 'ready_for_delivery' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {((selectedOrderForTracking || currentOrder) as any).status === 'in_delivery' ? 'En livraison' :
                         ((selectedOrderForTracking || currentOrder) as any).status === 'in_transit' ? 'En route' :
                         ((selectedOrderForTracking || currentOrder) as any).status === 'ready_for_delivery' ? 'Prêt à livrer' :
                         'En préparation'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Pharmacie</p>
                        <p className="font-medium">{((selectedOrderForTracking || currentOrder) as any).pharmacy?.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Montant</p>
                        <p className="font-medium">{((selectedOrderForTracking || currentOrder) as any).totalAmount} FCFA</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Adresse de livraison</p>
                        <p className="font-medium">{((selectedOrderForTracking || currentOrder) as any).deliveryAddress}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Temps estimé</p>
                        <p className="font-medium text-orange-600">
                          {((selectedOrderForTracking || currentOrder) as any).status === 'preparing' ? 'En préparation' : '≤ 10 minutes'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Informations du livreur */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                      🚗 Informations du Livreur
                    </h3>

                    {((selectedOrderForTracking || currentOrder) as any).deliveryPersonId ? (
                      <>
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-200 overflow-hidden">
                            {/* Photo de profil réelle du livreur */}
                            {(() => {
                              // Récupérer les infos du livreur depuis l'API ou les données de la commande
                              const deliveryPersonId = ((selectedOrderForTracking || currentOrder) as any).deliveryPersonId;
                              // Pour l'instant, utiliser les initiales en attendant l'implémentation de la photo
                              return (
                                <span className="text-2xl font-bold text-green-600">
                                  {deliveryPersonId ? deliveryPersonId.slice(0, 2).toUpperCase() : '🚴'}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-green-900">
                              {(() => {
                                const deliveryPersonId = ((selectedOrderForTracking || currentOrder) as any).deliveryPersonId;
                                // Ici on pourrait récupérer le vrai nom depuis l'API
                                return deliveryPersonId ? `Livreur ${deliveryPersonId.slice(0, 8)}` : 'Livreur en cours d\'assignation';
                              })()}
                            </h4>
                            <p className="text-sm text-green-700">Livreur agréé - En service</p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
                              <span className="text-xs text-green-600">Évaluation en cours</span>
                            </div>
                          </div>
                        </div>

                        {/* Informations du véhicule - PLAQUE TRÈS VISIBLE */}
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                          <h5 className="font-bold text-red-900 mb-2 text-center">🚗 VÉHICULE DU LIVREUR</h5>
                          <div className="text-center">
                            <div className="bg-white border-4 border-black rounded-lg p-3 inline-block mb-2">
                              <p className="text-xs text-gray-600 font-bold">PLAQUE D'IMMATRICULATION</p>
                              <p className="text-3xl font-black text-black tracking-wider">CI-2578-AB</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                              <div>
                                <p className="text-gray-600 font-medium">🏍️ Type</p>
                                <p className="font-bold">Moto Yamaha DT 125</p>
                              </div>
                              <div>
                                <p className="text-gray-600 font-medium">🎨 Couleur</p>
                                <p className="font-bold">Rouge</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Boutons de contact avec le livreur */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <a 
                            href="tel:+22507445566"
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                          >
                            📞 Appeler
                          </a>
                          <a 
                            href="sms:+22507445566?body=Bonjour, je suis votre client pour la commande Pharma Express. Où êtes-vous ?"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                          >
                            💬 SMS
                          </a>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-3">
                            <div>
                              <p className="text-gray-600 font-medium">📱 Identifiant livreur</p>
                              <p className="font-mono bg-white px-2 py-1 rounded border">
                                LIV-{((selectedOrderForTracking || currentOrder) as any).deliveryPersonId?.slice(0, 8)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium">📞 Contact via l'app</p>
                              <p className="font-medium text-green-700">Disponible pendant la livraison</p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium">⏰ Heure de prise en charge</p>
                              <p className="font-medium">
                                {((selectedOrderForTracking || currentOrder) as any).status === 'preparing' ? 'En attente' : 
                                 ((selectedOrderForTracking || currentOrder) as any).updatedAt ? 
                                 new Date(((selectedOrderForTracking || currentOrder) as any).updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) :
                                 'En cours'}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <p className="text-gray-600 font-medium">🏍️ Mode de transport</p>
                              <p className="font-medium">Véhicule de livraison agréé</p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium">📦 Statut livraison</p>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-600 rounded-full border border-gray-300"></div>
                                <span className="font-medium">
                                  {((selectedOrderForTracking || currentOrder) as any).status === 'in_transit' ? 'En route' :
                                   ((selectedOrderForTracking || currentOrder) as any).status === 'preparing' ? 'En préparation' :
                                   ((selectedOrderForTracking || currentOrder) as any).status === 'ready_for_delivery' ? 'Prêt pour livraison' :
                                   'En cours'}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-600 font-medium">🏷️ ID Commande</p>
                              <p className="font-mono bg-white px-2 py-1 rounded border font-bold">
                                #{((selectedOrderForTracking || currentOrder) as any).id?.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          ⏳
                        </div>
                        <p className="text-gray-600">Aucun livreur assigné pour le moment</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {((selectedOrderForTracking || currentOrder) as any).status === 'preparing' ? 
                            'Votre commande est en cours de préparation' :
                            'Assignation du livreur en cours...'}
                        </p>
                      </div>
                    )}

                    {/* Informations de sécurité */}
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <h5 className="font-medium text-green-900 mb-2">🔒 Sécurité et Identification</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Permis de conduire</p>
                          <p className="font-medium">✅ Vérifié et valide</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Assurance véhicule</p>
                          <p className="font-medium">✅ En cours de validité</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Formation livraison médicaments</p>
                          <p className="font-medium">✅ Certifié</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Vérification antécédents</p>
                          <p className="font-medium">✅ Contrôlé</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline de livraison */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Timeline de livraison</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Commande confirmée</p>
                          <p className="text-xs text-gray-500">Pharmacie a validé votre commande</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Préparation terminée</p>
                          <p className="text-xs text-gray-500">Médicaments prêts pour livraison</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                        <div>
                          <p className="text-sm font-medium">En cours de livraison</p>
                          <p className="text-xs text-gray-500">Le livreur est en route vers vous</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Livraison terminée</p>
                          <p className="text-xs text-gray-400">À confirmer à la réception</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions rapides */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {((selectedOrderForTracking || currentOrder) as any).deliveryPersonId ? (
                      <>
                        <Button 
                          variant="outline" 
                          className="flex items-center gap-2"
                          onClick={() => {
                            toast({
                              title: "Contact livreur",
                              description: "Fonctionnalité d'appel disponible pendant la livraison active",
                            });
                          }}
                        >
                          <Phone className="h-4 w-4" />
                          Contacter livreur
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex items-center gap-2"
                          onClick={() => {
                            toast({
                              title: "Chat en direct",
                              description: "Chat disponible une fois la livraison démarrée",
                            });
                          }}
                        >
                          📱 Chat livreur
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          className="flex items-center gap-2 opacity-50"
                          disabled
                        >
                          <Phone className="h-4 w-4" />
                          Livreur non assigné
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex items-center gap-2 opacity-50"
                          disabled
                        >
                          📱 Chat indisponible
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => navigate("/delivery-tracking")}
                    >
                      <MapPin className="h-4 w-4" />
                      Suivi GPS temps réel
                    </Button>
                  </div>

                  {/* Bouton de confirmation de livraison */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">✅ Confirmer la réception</h4>
                    <p className="text-sm text-green-800 mb-3">
                      Une fois que vous avez reçu vos médicaments, confirmez la livraison pour terminer la commande.
                    </p>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleConfirmDelivery(((selectedOrderForTracking || currentOrder) as any).id)}
                      disabled={confirmDeliveryMutation.isPending}
                      data-testid="button-confirm-delivery"
                    >
                      {confirmDeliveryMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Confirmation...
                        </>
                      ) : (
                        <>
                          ✅ Confirmer la livraison
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Informations sur les pénalités */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      ℹ️ <strong>Garantie de livraison :</strong> Livraison sous 10 minutes maximum. 
                      Au-delà, 100 FCFA de réduction par minute de retard.
                    </p>
                  </div>
                </div>
              ) : orders && Array.isArray(orders) && orders.some((order: any) => order.status === 'pending' || order.status === 'confirmed' || order.status === 'ready_for_delivery') ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Commande en préparation</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Votre commande est en cours de traitement par la pharmacie
                  </p>
                  <div className="text-left bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                    {Array.isArray(orders) && orders.filter((order: any) => ['pending', 'confirmed', 'ready_for_delivery'].includes(order.status)).map((order: any) => (
                      <div key={order.id} className="space-y-2">
                        <p className="text-sm"><strong>Commande #{order.id.slice(0, 8)}</strong></p>
                        <p className="text-sm">Pharmacie: {order.pharmacy?.name}</p>
                        <p className="text-sm">Statut: {getOrderStatusText(order.status)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    📦
                  </div>
                  <h3 className="font-semibold mb-2">Aucune livraison en cours</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Vos livraisons actives apparaîtront ici avec suivi en temps réel
                  </p>
                  <Button onClick={() => navigate("/pharmacies")}>
                    Passer une commande
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de paiement */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">💳 Paiement de la commande</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedOrderForPayment(null)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                {/* Récapitulatif */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Récapitulatif</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Médicaments:</span>
                      <span>{selectedOrderForPayment.totalAmount} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Livraison:</span>
                      <span>1,000 FCFA</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span>Total:</span>
                      <span>{(parseFloat(selectedOrderForPayment.totalAmount) + 1000).toFixed(0)} FCFA</span>
                    </div>
                  </div>
                </div>

                {/* Méthodes de paiement */}
                <div>
                  <h4 className="font-medium mb-3">Choisir le moyen de paiement</h4>
                  <div className="space-y-2">
                    {getPaymentMethods().map((method) => (
                      <div 
                        key={method.id}
                        className={`border rounded-lg p-3 cursor-pointer ${
                          paymentMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => setPaymentMethod(method.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              paymentMethod === method.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                            }`}>
                              {paymentMethod === method.id && (
                                <div className="w-full h-full rounded-full bg-white scale-50"></div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{method.name}</p>
                              <p className="text-sm text-gray-600">{method.number}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions de paiement */}
                {paymentMethod && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium mb-2">📋 Instructions de paiement</h4>
                    <div className="text-sm text-yellow-800 space-y-1">
                      <p>1. Ouvrez votre app {getPaymentMethods().find(m => m.id === paymentMethod)?.name}</p>
                      <p>2. Envoyez <strong>{(parseFloat(selectedOrderForPayment.totalAmount) + 1000).toFixed(0)} FCFA</strong> au numéro:</p>
                      <p className="font-bold">{getPaymentMethods().find(m => m.id === paymentMethod)?.number}</p>
                      <p>3. Confirmez le paiement ci-dessous une fois effectué</p>
                    </div>
                  </div>
                )}

                {/* Numéro de transaction */}
                {paymentMethod && (
                  <div>
                    <Label htmlFor="transaction-id" className="text-sm font-medium">
                      Numéro de transaction (optionnel)
                    </Label>
                    <Input
                      id="transaction-id"
                      placeholder="Ex: TXN123456789"
                      className="mt-1"
                    />
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedOrderForPayment(null)}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handlePayment}
                    disabled={!paymentMethod || paymentMutation.isPending}
                  >
                    {paymentMutation.isPending ? 'Traitement...' : 'Confirmer le paiement'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation currentPage="orders" />
    </div>
  );
}
