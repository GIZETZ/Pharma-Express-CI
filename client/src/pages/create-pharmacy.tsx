
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Phone, Clock } from "lucide-react";
import { useLocation } from "wouter";

export default function CreatePharmacy() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [pharmacyData, setPharmacyData] = useState({
    name: `Pharmacie ${user?.firstName} ${user?.lastName}`,
    address: user?.address || 'Abidjan, Côte d\'Ivoire',
    phone: user?.phone || '',
    deliveryTime: '30',
    deliveryRadius: '5',
    minDeliveryFee: '1000'
  });

  const createPharmacyMutation = useMutation({
    mutationFn: async (data: any) => {
      // First create the pharmacy
      const pharmacyResponse = await apiRequest('POST', '/api/pharmacies', {
        ...data,
        latitude: 5.2893 + (Math.random() - 0.5) * 0.1,
        longitude: -3.9882 + (Math.random() - 0.5) * 0.1,
        rating: 4.5,
        isOpen: true,
        openingHours: {
          monday: { open: '08:00', close: '19:00' },
          tuesday: { open: '08:00', close: '19:00' },
          wednesday: { open: '08:00', close: '19:00' },
          thursday: { open: '08:00', close: '19:00' },
          friday: { open: '08:00', close: '19:00' },
          saturday: { open: '08:00', close: '17:00' },
          sunday: { open: '09:00', close: '15:00' }
        }
      });
      
      const pharmacy = await pharmacyResponse.json();
      
      // Then update the user to associate with the pharmacy
      await apiRequest('PUT', '/api/auth/user', {
        pharmacyId: pharmacy.id
      });
      
      return pharmacy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacies/my-pharmacy'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ 
        title: "Pharmacie créée", 
        description: "Votre pharmacie a été créée avec succès." 
      });
      navigate('/pharmacy-profile');
    },
    onError: (error) => {
      console.error('Error creating pharmacy:', error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de créer la pharmacie. Veuillez réessayer.", 
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pharmacyData.name || !pharmacyData.address || !pharmacyData.phone) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }
    
    createPharmacyMutation.mutate(pharmacyData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-xl font-bold">Créer votre Pharmacie</h1>
              <p className="text-sm text-gray-600">Configurez les informations de votre établissement</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Informations de la Pharmacie
            </CardTitle>
            <CardDescription>
              Renseignez les détails de votre pharmacie pour que les patients puissent vous trouver
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nom de la pharmacie *
                </Label>
                <Input
                  id="name"
                  value={pharmacyData.name}
                  onChange={(e) => setPharmacyData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Pharmacie de la Paix"
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Adresse complète *
                </Label>
                <Textarea
                  id="address"
                  value={pharmacyData.address}
                  onChange={(e) => setPharmacyData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Ex: Boulevard de la Paix, Cocody, Abidjan"
                  className="w-full"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Numéro de téléphone *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={pharmacyData.phone}
                  onChange={(e) => setPharmacyData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ex: +225 27 22 44 55 66"
                  className="w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryTime" className="text-sm font-medium">
                    Temps de livraison (min)
                  </Label>
                  <Input
                    id="deliveryTime"
                    type="number"
                    value={pharmacyData.deliveryTime}
                    onChange={(e) => setPharmacyData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                    placeholder="30"
                    min="10"
                    max="120"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryRadius" className="text-sm font-medium">
                    Zone de livraison (km)
                  </Label>
                  <Input
                    id="deliveryRadius"
                    type="number"
                    value={pharmacyData.deliveryRadius}
                    onChange={(e) => setPharmacyData(prev => ({ ...prev, deliveryRadius: e.target.value }))}
                    placeholder="5"
                    min="1"
                    max="50"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minDeliveryFee" className="text-sm font-medium">
                    Frais de livraison (FCFA)
                  </Label>
                  <Input
                    id="minDeliveryFee"
                    type="number"
                    value={pharmacyData.minDeliveryFee}
                    onChange={(e) => setPharmacyData(prev => ({ ...prev, minDeliveryFee: e.target.value }))}
                    placeholder="1000"
                    min="0"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Horaires d'ouverture</h4>
                    <p className="text-sm text-blue-700">
                      Les horaires par défaut seront configurés (8h-19h en semaine, 8h-17h le samedi, 9h-15h le dimanche).
                      Vous pourrez les modifier après la création dans le profil de la pharmacie.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard-pharmacien')}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createPharmacyMutation.isPending}
                  className="flex-1"
                >
                  {createPharmacyMutation.isPending ? 'Création...' : 'Créer ma pharmacie'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
