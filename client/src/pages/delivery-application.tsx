
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function DeliveryApplication() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);

  // Récupérer toutes les pharmacies
  const { data: pharmacies, isLoading: loadingPharmacies } = useQuery({
    queryKey: ["/api/pharmacies"],
    enabled: true
  });

  // Mutation pour postuler à une pharmacie
  const applyToPharmacyMutation = useMutation({
    mutationFn: (pharmacyId: string) =>
      apiRequest("POST", "/api/livreur/apply-to-pharmacy", { pharmacyId }),
    onSuccess: () => {
      toast({
        title: "Candidature envoyée",
        description: "Votre candidature a été envoyée à la pharmacie. Vous recevrez une notification de leur réponse.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre candidature",
        variant: "destructive",
      });
    },
  });

  const handleApplyToPharmacy = (pharmacyId: string) => {
    applyToPharmacyMutation.mutate(pharmacyId);
  };

  if (loadingPharmacies) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Si l'utilisateur a déjà postulé
  if (user?.deliveryApplicationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                ⏳
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Candidature en attente
              </h1>
              <p className="text-gray-600 mb-4">
                Votre candidature a été envoyée à la pharmacie. Vous recevrez une notification dès qu'elle aura été traitée.
              </p>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                En attente de validation
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Si l'utilisateur a été rejeté
  if (user?.deliveryApplicationStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                ❌
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Candidature rejetée
              </h1>
              <p className="text-gray-600 mb-4">
                Votre candidature n'a pas été acceptée. Vous pouvez postuler à une autre pharmacie.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Postuler à une autre pharmacie
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-600 mb-2">
            🚴 Postuler comme Livreur
          </h1>
          <p className="text-gray-600">
            Choisissez une pharmacie pour laquelle vous souhaitez travailler
          </p>
        </div>

        <div className="grid gap-6">
          {pharmacies && pharmacies.length > 0 ? (
            pharmacies.map((pharmacy: any) => (
              <Card key={pharmacy.id} className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-purple-800">
                      {pharmacy.name}
                    </CardTitle>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Recrute
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center">
                    📍 {pharmacy.address}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Note</span>
                      <p className="text-sm">⭐ {pharmacy.rating || '4.5'}/5</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Téléphone</span>
                      <p className="text-sm">{pharmacy.phone || 'Non renseigné'}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">💰 Avantages</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• 500 FCFA par livraison</li>
                      <li>• Horaires flexibles</li>
                      <li>• Paiement hebdomadaire</li>
                      <li>• Formation fournie</li>
                    </ul>
                  </div>

                  <Button
                    onClick={() => handleApplyToPharmacy(pharmacy.id)}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={applyToPharmacyMutation.isPending}
                  >
                    {applyToPharmacyMutation.isPending ? "Envoi en cours..." : "Postuler à cette pharmacie 🚀"}
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  🏪
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Aucune pharmacie disponible
                </h3>
                <p className="text-gray-500">
                  Les pharmacies apparaîtront ici dès qu'elles seront disponibles
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
