import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
    medications: [{ name: '', surBon: false }],
    pharmacyMessage: '',
    bonDocuments: [] as File[],
    prescriptionPhoto: null as File | null
  });

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
    }
  };

  const removePrescriptionPhoto = () => {
    setOrderData(prev => ({ ...prev, prescriptionPhoto: null }));
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setOrderData(prev => ({ ...prev, bonDocuments: [...prev.bonDocuments, ...files] }));
  };

  const removeDocument = (index: number) => {
    setOrderData(prev => ({
      ...prev,
      bonDocuments: prev.bonDocuments.filter((_, i) => i !== index)
    }));
  };

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const formData = new FormData();
      formData.append('pharmacyId', selectedPharmacy.id);
      formData.append('deliveryAddress', orderData.deliveryAddress);
      formData.append('medications', JSON.stringify(orderData.medications));
      formData.append('pharmacyMessage', orderData.pharmacyMessage);
      
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
    if (!orderData.deliveryAddress.trim()) {
      toast({
        variant: "destructive",
        title: "Adresse requise",
        description: "Veuillez saisir votre adresse de livraison",
      });
      return;
    }

    if (!orderData.medications.some(med => med.name.trim())) {
      toast({
        variant: "destructive",
        title: "Médicaments requis",
        description: "Veuillez ajouter au moins un médicament",
      });
      return;
    }

    createOrderMutation.mutate(orderData);
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
              <label className="block text-sm font-medium mb-3">Photo de l'ordonnance *</label>
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Info:</strong> La pharmacie déterminera le prix final en fonction des médicaments disponibles. 
                Les médicaments marqués "Sur BON" nécessitent une validation de vos documents d'assurance.
              </p>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleCreateOrder}
                disabled={createOrderMutation.isPending || !orderData.deliveryAddress || !orderData.medications.some(med => med.name.trim())}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {createOrderMutation.isPending ? "Envoi en cours..." : "📤 Confirmer la commande"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation currentPage="pharmacies" />
    </div>
  );
}