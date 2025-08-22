import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";
import { Camera, Upload, Plus, X, FileText, ArrowLeft, MapPin, Phone, Star, Clock } from "lucide-react";

export default function OrderPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();

  // Get pharmacy data from URL params or localStorage
  const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);

  const [orderData, setOrderData] = useState({
    deliveryAddress: '',
    deliveryLatitude: null as number | null,
    deliveryLongitude: null as number | null,
    medications: [{ name: '', surBon: false }],
    pharmacyMessage: '',
    bonDocuments: [] as File[],
    prescriptionPhoto: null as File | null
  });

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useEffect(() => {
    // Try to get pharmacy data from localStorage (set when navigating from pharmacy list)
    const pharmacyData = localStorage.getItem('selectedPharmacy');
    if (pharmacyData) {
      setSelectedPharmacy(JSON.parse(pharmacyData));
      // Clear it after use
      localStorage.removeItem('selectedPharmacy');
    } else {
      // If no pharmacy selected, redirect back to pharmacies
      navigate('/pharmacies');
    }
  }, [navigate]);

  // Géolocalisation automatique avec haute précision
  useEffect(() => {
    if (navigator.geolocation) {
      setIsDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          // Stocker les coordonnées GPS précises
          setUserLocation({ lat: latitude, lng: longitude });
          setOrderData(prev => ({
            ...prev,
            deliveryLatitude: latitude,
            deliveryLongitude: longitude
          }));

          console.log(`📍 GPS précis capturé: ${latitude}, ${longitude} (précision: ${accuracy}m)`);

          // Reverse geocoding pour obtenir l'adresse
          try {
            const response = await fetch(`/api/location/reverse?lat=${latitude}&lng=${longitude}`);
            const addressData = await response.json();
            setCurrentAddress(addressData.formatted_address);
            setOrderData(prev => ({ ...prev, deliveryAddress: addressData.formatted_address }));

            toast({
              title: "Position GPS détectée",
              description: `Coordonnées précises capturées (précision: ${Math.round(accuracy)}m)`,
            });
          } catch (error) {
            console.error("Erreur géolocalisation:", error);
            // Garder les coordonnées même si le reverse geocoding échoue
            toast({
              title: "Coordonnées GPS capturées",
              description: "Position GPS enregistrée. Veuillez saisir votre adresse manuellement.",
            });
          } finally {
            setIsDetectingLocation(false);
          }
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
          setIsDetectingLocation(false);
          toast({
            title: "Géolocalisation",
            description: "Impossible d'obtenir votre position. Veuillez saisir votre adresse manuellement.",
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,    // Demander la meilleure précision possible
          timeout: 15000,              // Augmenter le timeout pour permettre une meilleure précision
          maximumAge: 0                // Ne pas utiliser de position en cache, toujours récupérer une nouvelle position
        }
      );
    }
  }, [toast]);

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

  const handlePrescriptionPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOrderData(prev => ({ ...prev, prescriptionPhoto: file }));
      toast({
        title: "Photo capturée",
        description: "Photo d'ordonnance ajoutée avec succès",
      });
      // Vider l'input pour permettre la reprise de la même photo
      e.target.value = '';
    }
  };

  const removePrescriptionPhoto = () => {
    setOrderData(prev => ({ ...prev, prescriptionPhoto: null }));
  };

  const triggerCameraInput = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const input = document.getElementById('camera-input') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setOrderData(prev => ({ ...prev, bonDocuments: [...prev.bonDocuments, ...files] }));
      toast({
        title: "Documents BON ajoutés",
        description: `${files.length} document(s) BON ajouté(s) avec succès`,
      });
    }
  };

  const removeDocument = (index: number) => {
    setOrderData(prev => ({
      ...prev,
      bonDocuments: prev.bonDocuments.filter((_, i) => i !== index)
    }));
  };

  // Fonction de validation: vérifier qu'au moins une photo d'ordonnance OU un médicament est fourni
  const validateOrder = () => {
    const hasAddress = orderData.deliveryAddress.trim().length > 0;
    const hasPrescriptionPhoto = orderData.prescriptionPhoto !== null;
    const hasMedications = orderData.medications.some(med => med.name.trim().length > 0);
    const hasRequiredBonDocuments = !orderData.medications.some(med => med.name.trim() && med.surBon) || orderData.bonDocuments.length > 0;

    return hasAddress && (hasPrescriptionPhoto || hasMedications) && hasRequiredBonDocuments;
  };

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const formData = new FormData();
      formData.append('pharmacyId', selectedPharmacy.id);
      formData.append('deliveryAddress', orderData.deliveryAddress);
      formData.append('deliveryNotes', orderData.pharmacyMessage || '');
      formData.append('medications', JSON.stringify(orderData.medications));
      formData.append('status', 'pending');

      // Ajouter les coordonnées GPS précises (obligatoires pour un routage précis)
      if (orderData.deliveryLatitude && orderData.deliveryLongitude) {
        formData.append('deliveryLatitude', orderData.deliveryLatitude.toString());
        formData.append('deliveryLongitude', orderData.deliveryLongitude.toString());
        console.log(`📤 Envoi commande avec coordonnées GPS: ${orderData.deliveryLatitude}, ${orderData.deliveryLongitude}`);
      } else {
        console.warn('⚠️ Commande envoyée sans coordonnées GPS précises - le routage sera approximatif');
      }

      if (orderData.prescriptionPhoto) {
        formData.append('prescriptionPhoto', orderData.prescriptionPhoto);
      }

      orderData.bonDocuments.forEach((file: File, index: number) => {
        formData.append(`bonDocument${index}`, file);
      });

      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Commande envoyée",
        description: "Votre commande a été envoyée à la pharmacie avec succès!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      navigate('/dashboard-patient');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'envoi de la commande",
      });
    },
  });

  const handleCreateOrder = () => {
    if (!selectedPharmacy) {
      toast({
        variant: "destructive",
        title: "Pharmacie requise",
        description: "Aucune pharmacie sélectionnée",
      });
      return;
    }

    if (!validateOrder()) {
      let message = "Veuillez vérifier les éléments suivants : ";
      const errors = [];

      if (!orderData.deliveryAddress.trim()) {
        errors.push("adresse de livraison");
      }

      if (!orderData.prescriptionPhoto && !orderData.medications.some(med => med.name.trim())) {
        errors.push("photo d'ordonnance ou médicaments saisis");
      }

      if (orderData.medications.some(med => med.name.trim() && med.surBon) && orderData.bonDocuments.length === 0) {
        errors.push("documents BON pour les médicaments sur BON");
      }

      message += errors.join(", ");

      toast({
        title: "Validation requise",
        description: message,
        variant: "destructive",
      });
      return;
    }

    // Include pharmacy ID in the order data  
    const validMedications = orderData.medications.filter(med => med.name.trim());
    const orderPayload = {
      ...orderData,
      pharmacyId: selectedPharmacy.id,
      medications: validMedications,
      status: 'pending'
    };

    createOrderMutation.mutate(orderPayload);
  };

  if (!selectedPharmacy) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/pharmacies')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Nouvelle Commande
            </h1>
            <p className="text-gray-600">
              Commande à {selectedPharmacy.name}
            </p>
          </div>
        </div>

        {/* Pharmacy Info Card */}
        <Card className="mb-6 border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-lg">{selectedPharmacy.name}</h4>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {selectedPharmacy.address}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" />
                  {selectedPharmacy.phone}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    {selectedPharmacy.rating}/5
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {selectedPharmacy.deliveryTime} min
                  </span>
                  {selectedPharmacy.isEmergency24h && (
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                      🚨 De garde 24h/24
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💰 Frais de livraison: 1000 FCFA (500 FCFA plateforme + 500 FCFA livreur)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Order Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              📋 Détails de la Commande
            </CardTitle>
            <CardDescription>
              Remplissez les informations nécessaires pour votre commande
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                        <div className="space-y-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePrescriptionPhoto}
                            className="hidden"
                            id="camera-input"
                          />
                          <Button 
                            type="button" 
                            className="bg-blue-600 hover:bg-blue-700 w-full"
                            onClick={(e) => triggerCameraInput(e)}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Prendre une photo
                          </Button>
                          <Button 
                            type="button" 
                            className="bg-green-600 hover:bg-green-700 w-full"
                            onClick={() => {
                              document.getElementById('bon-input-early')?.click();
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Associer un BON
                          </Button>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Camera className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-green-900">Photo ajoutée</p>
                            <p className="text-sm text-green-700 truncate max-w-48">{orderData.prescriptionPhoto.name}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removePrescriptionPhoto}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="bon-input-early"
                    />
                    <Button 
                      type="button" 
                      className="bg-green-600 hover:bg-green-700 w-full"
                      onClick={() => {
                        document.getElementById('bon-documents-input')?.click();
                        toast({
                          title: "Sélection de documents BON",
                          description: "Choisissez vos documents BON à associer",
                        });
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Associer un BON
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Adresse de livraison */}
            <div>
              <label className="block text-sm font-medium mb-2">Adresse de livraison</label>

              {/* Zone d'affichage de la géolocalisation */}
              {isDetectingLocation && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-700 text-sm">Détection de votre position...</span>
                  </div>
                </div>
              )}

              {userLocation && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-green-700 text-sm font-medium">📍 Position GPS précise détectée</p>
                        <p className="text-green-600 text-xs font-mono">
                          Lat: {userLocation.lat.toFixed(8)}° | Lng: {userLocation.lng.toFixed(8)}°
                        </p>
                        {currentAddress && (
                          <p className="text-green-600 text-xs mt-1">📍 {currentAddress}</p>
                        )}
                        <p className="text-green-500 text-xs mt-1">✅ Coordonnées GPS haute précision pour routage exact</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Input
                type="text"
                placeholder="Saisissez votre adresse complète"
                value={orderData.deliveryAddress}
                onChange={(e) => setOrderData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                L'adresse sera automatiquement remplie si la géolocalisation est autorisée
              </p>
            </div>

            {/* Liste des médicaments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium">
                  Médicaments souhaités
                  <span className="text-gray-500 text-xs ml-2">(Optionnel si photo d'ordonnance fournie)</span>
                </label>
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

            {/* Documents pour BON - Affiché seulement si des médicaments sont sur BON */}
            {orderData.medications.some(med => med.name.trim() && med.surBon) && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Documents pour validation BON
                  <span className="text-orange-600 text-xs ml-2">
                    (Requis car vous avez des médicaments sur BON)
                  </span>
                </label>
                <div className="border-2 border-dashed rounded-lg p-4 border-orange-300 bg-orange-50">
                  <div className="text-center">
                    <FileText className="mx-auto h-8 w-8 mb-2 text-orange-500" />
                    <p className="text-sm mb-2 font-medium text-orange-800">
                      Documents obligatoires pour validation BON
                    </p>
                    <p className="text-xs mb-3 text-orange-700">
                      Carte d'assurance, attestation de prise en charge, etc.
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="bon-documents-input"
                    />
                    <Button 
                      type="button" 
                      className="text-white bg-orange-600 hover:bg-orange-700"
                      size="sm"
                      onClick={() => {
                        document.getElementById('bon-documents-input')?.click();
                        toast({
                          title: "Sélection de fichiers BON",
                          description: "Choisissez vos documents BON à associer",
                        });
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choisir des fichiers
                    </Button>
                  </div>
                  {orderData.bonDocuments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {orderData.bonDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-orange-200">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-orange-600" />
                            <span className="text-sm text-gray-700">{doc.name}</span>
                          </div>
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
            )}

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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Info:</strong> Vous pouvez envoyer votre commande de deux façons : 
                1) <strong>Photo d'ordonnance uniquement</strong> (le pharmacien saisira les médicaments) 
                2) <strong>Médicaments saisis manuellement</strong> (avec ou sans photo). 
                La pharmacie déterminera le prix final et pourra modifier les détails si nécessaire. 
                Les médicaments marqués "Sur BON" nécessitent une validation de vos documents d'assurance.
              </p>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleCreateOrder}
                disabled={createOrderMutation.isPending || !validateOrder()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {createOrderMutation.isPending ? "Envoi en cours..." : "📤 Confirmer la commande"}
              </Button>

              {/* Indicateur de validation */}
              <div className="mt-2 text-xs text-gray-500 text-center">
                {!validateOrder() && (
                  <span className="text-red-600">⚠️ Vérifiez les éléments requis</span>
                )}
                {validateOrder() && (
                  <span className="text-green-600">✅ Prêt à confirmer</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation currentPage="pharmacies" />
    </div>
  );
}