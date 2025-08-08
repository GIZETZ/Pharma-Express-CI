import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import { MapPin, Clock, Star, Phone, Camera, Upload, Plus, X, FileText } from "lucide-react";

export default function Pharmacies() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            🏥 Pharmacies & Commandes
          </h1>
          <p className="text-gray-600">
            Bienvenue {user?.firstName} ! Localisez une pharmacie et passez commande
          </p>
          {currentAddress && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>Votre position: {currentAddress}</span>
            </div>
          )}
        </div>

        {/* Localiser Pharmacie */}
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
                  {/* Photo de l'ordonnance */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Photo de l'ordonnance</label>
                    <div className="space-y-3">
                      {!orderData.prescriptionPhoto ? (
                        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50">
                          <div className="text-center">
                            <Camera className="mx-auto h-16 w-16 text-blue-500 mb-3" />
                            <div className="text-lg font-medium text-blue-900 mb-2">
                              Envoyer la photo de l'ordonnance
                            </div>
                            <div className="text-sm text-blue-700 mb-4">
                              Prenez une photo claire de votre ordonnance en format portrait
                            </div>
                            <label className="cursor-pointer">
                              <Button type="button" className="bg-blue-600 hover:bg-blue-700">
                                <Camera className="h-4 w-4 mr-2" />
                                Prendre une photo
                              </Button>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg"
                                capture="environment"
                                onChange={handlePrescriptionPhoto}
                                className="hidden"
                              />
                            </label>
                            <div className="text-xs text-blue-600 mt-2">
                              Formats acceptés: PNG, JPEG, JPG
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Camera className="h-5 w-5 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                Photo ajoutée: {orderData.prescriptionPhoto.name}
                              </span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={removePrescriptionPhoto}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Adresse de livraison */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Adresse de livraison *</label>
                    <Input
                      type="text"
                      placeholder="Saisissez votre adresse complète"
                      value={orderData.deliveryAddress}
                      onChange={(e) => setOrderData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                      className="w-full"
                    />
                  </div>

                  {/* Liste des médicaments */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium">Médicaments souhaités *</label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addMedication}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {orderData.medications.map((medication, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <Input
                              type="text"
                              placeholder="Nom du médicament"
                              value={medication.name}
                              onChange={(e) => updateMedication(index, 'name', e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`sur-bon-${index}`}
                              checked={medication.surBon}
                              onCheckedChange={(checked) => updateMedication(index, 'surBon', checked)}
                            />
                            <Label 
                              htmlFor={`sur-bon-${index}`} 
                              className={`text-sm font-medium ${
                                medication.surBon ? 'text-green-600' : 'text-gray-600'
                              }`}
                            >
                              Sur BON
                            </Label>
                          </div>
                          {orderData.medications.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMedication(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Documents pour BON */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Documents pour validation BON</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <div className="text-center">
                        <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Ajoutez les documents nécessaires pour valider les médicaments sur BON
                        </p>
                        <label className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Choisir des fichiers
                          </Button>
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            onChange={handleDocumentUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {orderData.bonDocuments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {orderData.bonDocuments.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-700">{doc.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDocument(index)}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message à la pharmacie */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Message à la pharmacie</label>
                    <Textarea
                      placeholder="Informations complémentaires, questions spécifiques..."
                      value={orderData.pharmacyMessage}
                      onChange={(e) => setOrderData(prev => ({ ...prev, pharmacyMessage: e.target.value }))}
                      className="w-full"
                      rows={3}
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleCreateOrder}
                      disabled={createOrderMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {createOrderMutation.isPending ? "Envoi en cours..." : "Envoyer la commande"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNavigation currentPage="pharmacies" />
    </div>
  );
}
