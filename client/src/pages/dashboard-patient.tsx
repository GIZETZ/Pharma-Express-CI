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

import BottomNavigation from "@/components/bottom-navigation";
import { MapPin, Clock, Star, Phone, Camera, Upload, Plus, X, FileText } from "lucide-react";

export default function DashboardPatient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            👥 Tableau de bord Patient
          </h1>
          <p className="text-gray-600">
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
                        <Badge className={getOrderStatusColor(order.status)}>
                          {getOrderStatusText(order.status)}
                        </Badge>
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
                        <p className="text-sm"><strong>Pharmacie:</strong> {order.pharmacy?.name || 'Non spécifiée'}</p>
                        <p className="text-sm"><strong>Montant:</strong> {order.totalAmount} FCFA</p>
                        <p className="text-sm"><strong>Adresse:</strong> {order.deliveryAddress}</p>
                        {order.deliveryNotes && (
                          <p className="text-sm"><strong>Notes:</strong> {order.deliveryNotes}</p>
                        )}
                        
                        {/* Affichage des médicaments avec prix si confirmés par la pharmacie */}
                        {order.status !== 'pending' && order.medications && (
                          <div className="mt-3 bg-gray-50 rounded-lg p-3">
                            <p className="text-sm font-medium mb-2">Détails des médicaments:</p>
                            <div className="space-y-2">
                              {(typeof order.medications === 'string' ? JSON.parse(order.medications) : order.medications).map((med: any, index: number) => (
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
                            
                            {/* Actions de validation et paiement pour les commandes confirmées */}
                            {order.status === 'confirmed' && (
                              <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Sous-total médicaments:</span>
                                  <span className="font-semibold">{order.totalAmount} FCFA</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Frais de livraison:</span>
                                  <span className="font-semibold">1,000 FCFA</span>
                                </div>
                                <div className="flex items-center justify-between border-t pt-2">
                                  <span className="font-medium">Total à payer:</span>
                                  <span className="font-bold text-lg">{(parseFloat(order.totalAmount) + 1000).toFixed(0)} FCFA</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                  <Button 
                                    size="sm" 
                                    onClick={() => setSelectedOrderForPayment(order)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    💳 Procéder au paiement
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleCancelOrder(order.id)}
                                  >
                                    ❌ Annuler la commande
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {order.status === 'in_delivery' && (
                          <Button size="sm" className="w-full mt-2" onClick={() => setActiveTab("tracking")}>
                            Suivre la livraison
                          </Button>
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

          {/* Suivi Livraison */}
          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🚚 Suivre ma Livraison
                </CardTitle>
                <CardDescription>
                  Suivez en temps réel vos livraisons en cours avec géolocalisation du livreur
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentOrder && typeof currentOrder === 'object' && 'status' in currentOrder && (currentOrder as any).status === 'in_delivery' ? (
                  <div className="space-y-6">
                    {/* Statut de la livraison */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-orange-900">
                            🚚 Livraison en cours
                          </h3>
                          <p className="text-sm text-orange-700">
                            Commande #{(currentOrder as any).id.slice(0, 8)}
                          </p>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800">
                          En route
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Pharmacie</p>
                          <p className="font-medium">{(currentOrder as any).pharmacy?.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Montant</p>
                          <p className="font-medium">{(currentOrder as any).totalAmount} FCFA</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Adresse</p>
                          <p className="font-medium">{(currentOrder as any).deliveryAddress}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Temps estimé</p>
                          <p className="font-medium text-orange-600">≤ 10 minutes</p>
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
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contacter le livreur
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Voir sur la carte
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
                    <Button onClick={() => setActiveTab("pharmacies")}>
                      Passer une commande
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

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