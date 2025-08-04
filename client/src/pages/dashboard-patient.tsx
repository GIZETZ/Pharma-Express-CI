import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";
import BottomNavigation from "@/components/bottom-navigation";
import { MapPin, Clock, Star, Phone, Camera, Upload } from "lucide-react";

export default function DashboardPatient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [orderData, setOrderData] = useState({
    deliveryAddress: '',
    notes: '',
    totalAmount: 0
  });
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  
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
      apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify(orderDetails),
      }),
    onSuccess: () => {
      toast({
        title: "Commande créée",
        description: "Votre commande a été envoyée à la pharmacie",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setActiveTab("orders");
      setSelectedPharmacy(null);
      setOrderData({ deliveryAddress: '', notes: '', totalAmount: 0 });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande",
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
    queryFn: () => {
      const url = userLocation 
        ? `/api/pharmacies?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=10`
        : `/api/pharmacies`;
      return apiRequest(url);
    },
    enabled: true
  });
  
  const { data: currentOrder } = useQuery({ 
    queryKey: ["/api/orders/current"],
    refetchInterval: 5000 // Refresh toutes les 5 secondes pour suivi temps réel
  });

  const handleCreateOrder = () => {
    if (selectedPharmacy && orderData.deliveryAddress && orderData.totalAmount > 0) {
      createOrderMutation.mutate({
        pharmacyId: selectedPharmacy.id,
        deliveryAddress: orderData.deliveryAddress,
        deliveryNotes: orderData.notes,
        totalAmount: orderData.totalAmount.toString(),
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

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Mes Commandes</TabsTrigger>
            <TabsTrigger value="prescriptions">Ordonnances</TabsTrigger>
            <TabsTrigger value="pharmacies">Pharmacies</TabsTrigger>
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
                  <Button data-testid="button-new-order" onClick={() => setActiveTab("pharmacies")}>
                    Nouvelle Commande
                  </Button>
                </CardContent>
              </Card>

              {ordersLoading ? (
                <div className="col-span-2 text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Chargement de vos commandes...</p>
                </div>
              ) : orders && orders.length > 0 ? (
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
                  <Button onClick={() => setActiveTab("pharmacies")}>
                    Créer ma première commande
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Ordonnances */}
          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 Envoyer une Ordonnance
                </CardTitle>
                <CardDescription>
                  Photographiez ou téléchargez une photo de votre ordonnance médicale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Prendre une Photo</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Photographiez votre ordonnance avec un éclairage optimal pour une meilleure lecture
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button 
                      data-testid="button-camera" 
                      onClick={openCamera}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Utiliser la Caméra
                    </Button>
                    <Button 
                      variant="outline" 
                      data-testid="button-upload"
                      onClick={selectFile}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Choisir un Fichier
                    </Button>
                  </div>
                  {prescriptionFile && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✅ Ordonnance "{prescriptionFile.name}" envoyée avec succès
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Conseils pour une bonne photo :</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Utilisez un bon éclairage naturel</li>
                    <li>• Vérifiez que le texte est bien lisible</li>
                    <li>• Évitez les reflets et les ombres</li>
                    <li>• Photographiez l'ordonnance entière</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Localiser Pharmacie */}
          <TabsContent value="pharmacies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localiser une Pharmacie
                </CardTitle>
                <CardDescription>
                  {userLocation 
                    ? "Pharmacies triées par proximité selon votre position" 
                    : "Trouvez les pharmacies disponibles"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pharmaciesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Localisation des pharmacies...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pharmacies?.map((pharmacy: any, index: number) => (
                      <Card key={pharmacy.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{pharmacy.name}</h4>
                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {pharmacy.address}
                              </p>
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <Phone className="h-3 w-3" />
                                {pharmacy.phone}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant={pharmacy.isOpen ? 'default' : 'secondary'}>
                                {pharmacy.isOpen ? 'Ouvert' : 'Fermé'}
                              </Badge>
                              {index === 0 && userLocation && (
                                <Badge variant="outline" className="text-xs">
                                  Plus proche
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm mb-3">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {pharmacy.rating}/5
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {pharmacy.deliveryTime} min
                            </span>
                          </div>
                          <Button 
                            className="w-full" 
                            size="sm" 
                            onClick={() => setSelectedPharmacy(pharmacy)}
                            disabled={!pharmacy.isOpen}
                          >
                            {pharmacy.isOpen ? 'Sélectionner' : 'Fermée'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {selectedPharmacy && (
                  <Card className="mt-6 border-2 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        📋 Commande à {selectedPharmacy.name}
                      </CardTitle>
                      <CardDescription>
                        Frais de livraison: 1000 FCFA (500 FCFA plateforme + 500 FCFA livreur)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Adresse de livraison *</label>
                        <Input
                          type="text"
                          placeholder="Saisissez votre adresse de livraison"
                          value={orderData.deliveryAddress}
                          onChange={(e) => setOrderData({ ...orderData, deliveryAddress: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Notes pour la pharmacie</label>
                        <Textarea
                          placeholder="Précisez vos besoins, médicaments sur BON, etc."
                          value={orderData.notes}
                          onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Montant estimé (FCFA) *</label>
                        <Input
                          type="number"
                          placeholder="Montant total estimé"
                          value={orderData.totalAmount || ''}
                          onChange={(e) => setOrderData({ ...orderData, totalAmount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          💡 <strong>Astuce:</strong> Mentionnez dans les notes si certains médicaments 
                          doivent "passer sur BON" pour prise en charge par l'assurance.
                        </p>
                      </div>
                      
                      <Button 
                        onClick={handleCreateOrder} 
                        disabled={createOrderMutation.isPending || !orderData.deliveryAddress || orderData.totalAmount <= 0}
                        className="w-full"
                      >
                        {createOrderMutation.isPending ? "Envoi en cours..." : "📤 Confirmer la commande"}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
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
                {currentOrder && currentOrder.status === 'in_delivery' ? (
                  <div className="space-y-6">
                    {/* Statut de la livraison */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-orange-900">
                            🚚 Livraison en cours
                          </h3>
                          <p className="text-sm text-orange-700">
                            Commande #{currentOrder.id.slice(0, 8)}
                          </p>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800">
                          En route
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Pharmacie</p>
                          <p className="font-medium">{currentOrder.pharmacy?.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Montant</p>
                          <p className="font-medium">{currentOrder.totalAmount} FCFA</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Adresse</p>
                          <p className="font-medium">{currentOrder.deliveryAddress}</p>
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
                ) : orders && orders.some((order: any) => order.status === 'pending' || order.status === 'confirmed' || order.status === 'ready_for_delivery') ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Commande en préparation</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Votre commande est en cours de traitement par la pharmacie
                    </p>
                    <div className="text-left bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                      {orders.filter((order: any) => ['pending', 'confirmed', 'ready_for_delivery'].includes(order.status)).map((order: any) => (
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
      <BottomNavigation />
    </div>
  );
}