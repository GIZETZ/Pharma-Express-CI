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
    if (!navigator.geolocation) {
      toast({
        title: "Géolocalisation non supportée",
        description: "Votre navigateur ne supporte pas la géolocalisation. Veuillez saisir votre adresse manuellement.",
        variant: "destructive",
      });
      return;
    }

    setIsDetectingLocation(true);
    
    const timeoutId = setTimeout(() => {
      setIsDetectingLocation(false);
      toast({
        title: "Délai dépassé",
        description: "La géolocalisation prend trop de temps. Veuillez saisir votre adresse manuellement.",
        variant: "destructive",
      });
    }, 20000); // 20 secondes timeout

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        const { latitude, longitude, accuracy } = position.coords;

        // Vérifier que les coordonnées sont valides
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
          setIsDetectingLocation(false);
          toast({
            title: "Coordonnées invalides",
            description: "Les coordonnées GPS reçues sont invalides. Veuillez saisir votre adresse manuellement.",
            variant: "destructive",
          });
          return;
        }

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
          
          if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
          }
          
          const addressData = await response.json();
          
          if (addressData?.formatted_address) {
            setCurrentAddress(addressData.formatted_address);
            setOrderData(prev => ({ ...prev, deliveryAddress: addressData.formatted_address }));
            
            toast({
              title: "✅ Position détectée",
              description: `Adresse: ${addressData.formatted_address}`,
            });
          } else {
            throw new Error("Adresse non trouvée");
          }
        } catch (error) {
          console.error("Erreur reverse geocoding:", error);
          // Garder les coordonnées même si le reverse geocoding échoue
          toast({
            title: "📍 GPS capturé",
            description: "Position GPS enregistrée. Veuillez compléter votre adresse ci-dessous.",
            variant: "default",
          });
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        setIsDetectingLocation(false);
        
        let errorMessage = "Erreur inconnue de géolocalisation";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Accès à la géolocalisation refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Position indisponible. Vérifiez votre connexion internet et que le GPS est activé.";
            break;
          case error.TIMEOUT:
            errorMessage = "Délai dépassé pour obtenir votre position. Réessayez ou saisissez votre adresse manuellement.";
            break;
          default:
            errorMessage = `Erreur de géolocalisation: ${error.message || "Cause inconnue"}`;
            break;
        }
        
        console.error("Erreur de géolocalisation:", error);
        toast({
          title: "⚠️ Géolocalisation échouée",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,    // Demander la meilleure précision possible
        timeout: 15000,              // 15 secondes timeout pour getCurrentPosition
        maximumAge: 60000            // Accepter une position de moins d'1 minute
      }
    );
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
    <div className="min-h-screen bg-pharma-bg">
      <div className="max-w-4xl mx-auto p-4 pb-20 fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 slide-in">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/pharmacies')}
            className="flex items-center gap-2 hover:bg-white/60 transition-all duration-300 glass-effect rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">
              Nouvelle Commande
            </h1>
            <p className="text-slate-600 mt-1">
              Commande à {selectedPharmacy.name}
            </p>
          </div>
        </div>

        {/* Pharmacy Info Card */}
        <Card className="mb-8 pharma-card border-l-4 border-l-pharma-primary scale-in" style={{animationDelay: '0.1s'}}>
          <CardContent className="p-6">
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
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4 glass-effect">
              <p className="text-sm font-medium text-green-900 flex items-center gap-2">
                <span className="text-lg">💰</span>
                Frais de livraison: <span className="font-bold text-pharma-primary">1000 FCFA</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Order Form */}
        <Card className="pharma-card scale-in" style={{animationDelay: '0.2s'}}>
          <CardHeader className="pb-6">
            <CardTitle className="text-xl flex items-center gap-3 gradient-text">
              <span className="text-2xl">📋</span>
              Détails de la Commande
            </CardTitle>
            <CardDescription className="text-slate-600 mt-2">
              Remplissez les informations nécessaires pour votre commande
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Photo de l'ordonnance */}
            <div className="fade-in" style={{animationDelay: '0.3s'}}>
              <label className="block text-sm font-semibold mb-4 text-slate-700">📷 Photo de l'ordonnance</label>
              <div className="space-y-4">
                {!orderData.prescriptionPhoto ? (
                  <div className="border-2 border-dashed border-pharma-primary/30 rounded-2xl p-8 bg-gradient-to-br from-green-50/50 to-green-100/50 glass-effect transition-all duration-300 hover:border-pharma-primary/50">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pharma-primary to-pharma-accent rounded-2xl flex items-center justify-center">
                        <Camera className="h-10 w-10 text-white" />
                      </div>
                      <div className="text-xl font-bold text-slate-800 mb-2">
                          Envoyer la photo de l'ordonnance
                        </div>
                        <div className="text-sm text-slate-600 mb-6">
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
                            className="pharma-btn w-full py-6 text-white font-semibold rounded-xl"
                            onClick={(e) => triggerCameraInput(e)}
                          >
                            <Camera className="h-5 w-5 mr-2" />
                            Prendre une photo
                          </Button>
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            onChange={handleDocumentUpload}
                            className="hidden"
                            id="bon-documents-input"
                          />
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border border-emerald-200 rounded-xl p-5 bg-gradient-to-r from-emerald-50 to-green-50 glass-effect">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                            <Camera className="h-7 w-7 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-emerald-900">Photo ajoutée</p>
                            <p className="text-sm text-emerald-700 truncate max-w-48">{orderData.prescriptionPhoto.name}</p>
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
                      id="bon-documents-input"
                    />
                    <Button 
                      type="button" 
                      className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 w-full py-4 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                      onClick={() => {
                        document.getElementById('bon-documents-input')?.click();
                        toast({
                          title: "Sélection de documents BON",
                          description: "Choisissez vos documents BON à associer",
                        });
                      }}
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      Associer un BON
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Adresse de livraison */}
            <div className="fade-in" style={{animationDelay: '0.4s'}}>
              <label className="block text-sm font-semibold mb-4 text-slate-700">📍 Adresse de livraison</label>

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
                <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl glass-effect">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-emerald-800 text-sm font-semibold">Position détectée</p>
                      {currentAddress && (
                        <p className="text-emerald-700 text-sm mt-1">{currentAddress}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Saisissez votre adresse complète"
                  value={orderData.deliveryAddress}
                  onChange={(e) => setOrderData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                  className="w-full pharma-input py-6 text-base"
                />
                
                {!userLocation && !isDetectingLocation && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Relancer la géolocalisation
                      window.location.reload();
                    }}
                    className="w-full border-pharma-primary/30 text-pharma-primary hover:bg-pharma-primary hover:text-white"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Réessayer la géolocalisation
                  </Button>
                )}
              </div>
            </div>

            {/* Liste des médicaments */}
            <div className="fade-in" style={{animationDelay: '0.5s'}}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700">
                  💊 Médicaments souhaités
                  <span className="text-slate-500 text-xs ml-2">(Optionnel)</span>
                </label>
              </div>
              <div className="space-y-4">
                {orderData.medications.map((medication, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl bg-white/60 glass-effect transition-all duration-300 hover:border-pharma-primary/30">
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="Nom du médicament"
                        value={medication.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        className="w-full pharma-input"
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
              <div className="mt-4 flex justify-center">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addMedication}
                  className="flex items-center gap-2 border-pharma-primary/30 text-pharma-primary hover:bg-pharma-primary hover:text-white transition-all duration-300 rounded-lg px-4 py-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Button>
              </div>
            </div>

            {/* Documents pour BON - Affiché dès qu'une photo d'ordonnance est prise OU qu'un médicament est marqué "Sur BON" */}
            {(orderData.prescriptionPhoto || orderData.medications.some(med => med.surBon)) && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Documents BON
                  <span className="text-blue-600 text-xs ml-2">
                    (Assurance, attestation)
                  </span>
                </label>
                <div className="border-2 border-dashed rounded-lg p-4 border-blue-300 bg-blue-50">
                  <div className="text-center">
                    <FileText className="mx-auto h-8 w-8 mb-2 text-blue-500" />
                    <p className="text-sm mb-3 font-medium text-blue-800">
                      Documents d'assurance
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
                      className="text-white bg-blue-600 hover:bg-blue-700"
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
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
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

            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-5 glass-effect">
              <p className="text-sm text-green-900 flex items-start gap-3">
                <span className="text-lg mt-0.5">💡</span>
                <span><strong>Info:</strong> Photo d'ordonnance ou liste de médicaments requise. La pharmacie confirmera le prix final.</span>
              </p>
            </div>

            <div className="pt-6 fade-in" style={{animationDelay: '0.6s'}}>
              <Button
                onClick={handleCreateOrder}
                disabled={createOrderMutation.isPending || !validateOrder()}
                className="w-full pharma-btn py-6 text-lg font-bold text-white rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {createOrderMutation.isPending ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Envoi en cours...
                  </div>
                ) : (
                  <span className="flex items-center gap-3">
                    <span className="text-xl">📤</span>
                    Confirmer la commande
                  </span>
                )}
              </Button>

              {/* Indicateur de validation */}
              <div className="mt-4 text-sm text-center">
                {!validateOrder() && (
                  <span className="text-red-600 flex items-center justify-center gap-2 bg-red-50 py-2 px-4 rounded-lg">
                    <span>⚠️</span>
                    Vérifiez les éléments requis
                  </span>
                )}
                {validateOrder() && (
                  <span className="text-emerald-600 flex items-center justify-center gap-2 bg-emerald-50 py-2 px-4 rounded-lg">
                    <span>✅</span>
                    Prêt à confirmer
                  </span>
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