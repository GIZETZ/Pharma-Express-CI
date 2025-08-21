
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
    deliveryTime: '30'
  });

  const createPharmacyMutation = useMutation({
    mutationFn: async (data: any) => {
      // First create the pharmacy
      const pharmacyResponse = await apiRequest('POST', '/api/pharmacies', {
        name: data.name,
        address: data.address,
        phone: data.phone,
        deliveryTime: data.deliveryTime,
        latitude: 5.2893 + (Math.random() - 0.5) * 0.1,
        longitude: -3.9882 + (Math.random() - 0.5) * 0.1,
        rating: 4.5,
        isOpen: true,
        isEmergency24h: false
      });
      
      if (!pharmacyResponse.ok) {
        const errorData = await pharmacyResponse.json();
        throw new Error(errorData.message || 'Erreur lors de la création de la pharmacie');
      }
      
      const pharmacy = await pharmacyResponse.json();
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

              <div className="space-y-2">
                <Label htmlFor="deliveryTime" className="text-sm font-medium">
                  Temps de livraison estimé (minutes)
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
                <p className="text-xs text-gray-500">
                  Temps moyen de préparation et livraison de vos commandes
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Configuration initiale</h4>
                    <p className="text-sm text-blue-700">
                      Votre pharmacie sera créée avec les paramètres de base. Vous pourrez configurer les horaires d'ouverture, 
                      les frais de livraison et autres détails directement depuis votre tableau de bord après la création.
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
