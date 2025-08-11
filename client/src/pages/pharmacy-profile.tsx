
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import { ArrowLeft, MapPin, Phone, Clock, Star, Edit3, Save, X, Navigation } from "lucide-react";
import { useLocation } from "wouter";
import { useGeolocation } from "@/hooks/use-geolocation";

export default function PharmacyProfile() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  
  // Géolocalisation pour auto-localiser la pharmacie
  const { latitude, longitude, error: geoError, loading: geoLoading, refetch: refetchLocation } = useGeolocation();

  // Récupérer les informations de la pharmacie associée au pharmacien
  // Note: Using PUT with empty body as workaround for Vite middleware intercepting GET requests
  const { data: pharmacyData, isLoading } = useQuery({
    queryKey: ['/api/pharmacies/my-pharmacy'],
    queryFn: async () => {
      const response = await apiRequest('PUT', '/api/pharmacies/my-pharmacy', {});
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No pharmacy found yet
        }
        throw new Error(`Failed to fetch pharmacy: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user && user.role === 'pharmacien'
  });

  const updatePharmacyMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Sending pharmacy update data:', data);
      const response = await apiRequest('PUT', '/api/pharmacies/my-pharmacy', data);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Pharmacy update failed:', response.status, errorData);
        throw new Error(`Failed to update pharmacy: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Pharmacy update successful:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Pharmacy update mutation success:', data);
      
      // Invalider les queries
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacies/my-pharmacy'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // Afficher le toast de succès
      toast({ 
        title: "Profil mis à jour", 
        description: "Les informations de votre pharmacie ont été sauvegardées." 
      });
      
      // Réinitialiser l'état d'édition
      setEditMode(false);
      setEditData({});
      setCurrentAddress("");
    },
    onError: (error) => {
      console.error('Pharmacy update mutation error:', error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de mettre à jour le profil. Veuillez réessayer.", 
        variant: "destructive" 
      });
    }
  });

  // Reverse geocoding pour obtenir l'adresse à partir des coordonnées
  useEffect(() => {
    if (latitude && longitude && editMode && !updatePharmacyMutation.isPending) {
      const getAddressFromCoords = async () => {
        try {
          const response = await fetch(`/api/location/reverse?lat=${latitude}&lng=${longitude}`);
          if (response.ok) {
            const addressData = await response.json();
            setCurrentAddress(addressData.formatted_address || '');
            
            // Mettre à jour automatiquement l'adresse dans le formulaire d'édition
            setEditData(prev => ({
              ...prev,
              address: addressData.formatted_address || prev.address,
              latitude: latitude,
              longitude: longitude
            }));
          }
        } catch (error) {
          console.error("Erreur géolocalisation:", error);
        }
      };
      
      getAddressFromCoords();
    }
  }, [latitude, longitude, editMode, updatePharmacyMutation.isPending]);

  const handleEdit = () => {
    setEditData(pharmacyData || {});
    setEditMode(true);
  };

  const handleSave = () => {
    if (!updatePharmacyMutation.isPending) {
      updatePharmacyMutation.mutate(editData);
    }
  };

  const handleCancel = () => {
    if (!updatePharmacyMutation.isPending) {
      setEditMode(false);
      setEditData({});
      setCurrentAddress("");
    }
  };

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    refetchLocation();
    setTimeout(() => setIsDetectingLocation(false), 3000);
  };

  const updateOpeningHours = (day: string, field: 'open' | 'close', value: string) => {
    setEditData({
      ...editData,
      openingHours: {
        ...editData.openingHours,
        [day]: {
          ...editData.openingHours?.[day],
          [field]: value
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Afficher les informations de la pharmacie ou créer une pharmacie par défaut
  const displayPharmacy = pharmacyData || {
    name: `Pharmacie ${user?.firstName} ${user?.lastName}`,
    address: user?.address || 'Abidjan, Côte d\'Ivoire',
    phone: user?.phone || '',
    rating: 4.5,
    reviewCount: 0,
    deliveryTime: '30',
    isOpen: true,
    latitude: 5.2893,
    longitude: -3.9882,
    deliveryRadius: 5,
    minDeliveryFee: 1000,
    openingHours: {
      monday: { open: '08:00', close: '19:00' },
      tuesday: { open: '08:00', close: '19:00' },
      wednesday: { open: '08:00', close: '19:00' },
      thursday: { open: '08:00', close: '19:00' },
      friday: { open: '08:00', close: '19:00' },
      saturday: { open: '08:00', close: '17:00' },
      sunday: { open: '09:00', close: '15:00' }
    }
  };

  const days = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard-pharmacien')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Profil de la Pharmacie</h1>
              <p className="text-sm text-gray-600">Gérez les informations de votre établissement</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* En-tête avec informations principales */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {editMode ? (
                    <Input
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="text-xl font-bold"
                      placeholder="Nom de la pharmacie"
                    />
                  ) : (
                    displayPharmacy.name
                  )}
                  <Badge variant={displayPharmacy.isOpen ? 'default' : 'secondary'}>
                    {displayPharmacy.isOpen ? 'Ouvert' : 'Fermé'}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-start gap-2 mt-2">
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                  {editMode ? (
                    <div className="flex-1 space-y-2">
                      <Textarea
                        value={editData.address || ''}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        placeholder="Adresse complète"
                        rows={2}
                        className="w-full"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleDetectLocation}
                          disabled={isDetectingLocation || geoLoading}
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          {isDetectingLocation || geoLoading ? 'Localisation...' : 'Ma position actuelle'}
                        </Button>
                        {currentAddress && (
                          <Badge variant="outline" className="text-xs">
                            Position détectée
                          </Badge>
                        )}
                      </div>
                      {geoError && (
                        <p className="text-sm text-red-600">Erreur de géolocalisation: {geoError}</p>
                      )}
                    </div>
                  ) : (
                    <span className="flex-1">{displayPharmacy.address}</span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {!editMode ? (
                  <Button onClick={handleEdit} size="sm">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm" disabled={updatePharmacyMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                {editMode ? (
                  <Input
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    placeholder="Numéro de téléphone"
                  />
                ) : (
                  <span>{displayPharmacy.phone}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{displayPharmacy.rating}/5 ({displayPharmacy.reviewCount || 0} avis)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                {editMode ? (
                  <Input
                    value={editData.deliveryTime || ''}
                    onChange={(e) => setEditData({ ...editData, deliveryTime: e.target.value })}
                    placeholder="Temps de livraison (min)"
                    type="number"
                  />
                ) : (
                  <span>Livraison en {displayPharmacy.deliveryTime} min</span>
                )}
              </div>
            </div>
            
            {editMode && (latitude && longitude) && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  📍 Position GPS détectée: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Cette position aidera les patients à mieux localiser votre pharmacie
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="horaires" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="horaires">Horaires</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="parametres">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="horaires" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Horaires d'ouverture</CardTitle>
                <CardDescription>
                  Définissez vos horaires pour chaque jour de la semaine
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {days.map((day) => (
                  <div key={day.key} className="flex items-center justify-between py-2">
                    <Label className="w-24">{day.label}</Label>
                    <div className="flex items-center gap-4">
                      {editMode ? (
                        <>
                          <Input
                            type="time"
                            value={editData.openingHours?.[day.key]?.open || '08:00'}
                            onChange={(e) => updateOpeningHours(day.key, 'open', e.target.value)}
                            className="w-32"
                          />
                          <span>à</span>
                          <Input
                            type="time"
                            value={editData.openingHours?.[day.key]?.close || '18:00'}
                            onChange={(e) => updateOpeningHours(day.key, 'close', e.target.value)}
                            className="w-32"
                          />
                        </>
                      ) : (
                        <span className="text-sm">
                          {displayPharmacy.openingHours?.[day.key]?.open || '08:00'} - {displayPharmacy.openingHours?.[day.key]?.close || '18:00'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Services disponibles</CardTitle>
                <CardDescription>
                  Configurez les services proposés par votre pharmacie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Livraison à domicile</Label>
                      <p className="text-sm text-gray-600">Proposer la livraison de médicaments</p>
                    </div>
                    <Switch checked={true} disabled={!editMode} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Conseil pharmaceutique</Label>
                      <p className="text-sm text-gray-600">Service de conseil personnalisé</p>
                    </div>
                    <Switch checked={true} disabled={!editMode} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Urgences 24h/24</Label>
                      <p className="text-sm text-gray-600">Service d'urgence pharmaceutique</p>
                    </div>
                    <Switch checked={false} disabled={!editMode} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parametres" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de la pharmacie</CardTitle>
                <CardDescription>
                  Gérez les paramètres généraux de votre établissement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>Statut de la pharmacie</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Switch 
                        checked={editMode ? editData.isOpen : displayPharmacy.isOpen}
                        onCheckedChange={(checked) => editMode && setEditData({ ...editData, isOpen: checked })}
                        disabled={!editMode}
                      />
                      <span className="text-sm">
                        {(editMode ? editData.isOpen : displayPharmacy.isOpen) ? 'Pharmacie ouverte' : 'Pharmacie fermée'}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label>Zone de livraison (km)</Label>
                    {editMode ? (
                      <Input
                        type="number"
                        value={editData.deliveryRadius || 5}
                        onChange={(e) => setEditData({ ...editData, deliveryRadius: Number(e.target.value) })}
                        className="mt-2 w-32"
                        min="1"
                        max="50"
                      />
                    ) : (
                      <p className="text-sm text-gray-600 mt-2">{displayPharmacy.deliveryRadius || 5} km</p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <Label>Frais de livraison minimum (FCFA)</Label>
                    {editMode ? (
                      <Input
                        type="number"
                        value={editData.minDeliveryFee || 1000}
                        onChange={(e) => setEditData({ ...editData, minDeliveryFee: Number(e.target.value) })}
                        className="mt-2 w-40"
                        min="0"
                      />
                    ) : (
                      <p className="text-sm text-gray-600 mt-2">{displayPharmacy.minDeliveryFee || 1000} FCFA</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation currentPage="profile" />
    </div>
  );
}
