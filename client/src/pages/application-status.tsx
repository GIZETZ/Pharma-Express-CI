
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, AlertCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ApplicationStatus() {
  const [, setLocation] = useLocation();
  const { user, refetch: refetchUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Get applied pharmacy info if user has applied
  const { data: pharmacy, isLoading: pharmacyLoading } = useQuery({
    queryKey: ['/api/pharmacies', user?.appliedPharmacyId],
    enabled: !!user?.appliedPharmacyId,
    queryFn: async () => {
      const response = await fetch(`/api/pharmacies/${user.appliedPharmacyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pharmacy');
      }
      return response.json();
    }
  });

  // Mutation to cancel application
  const cancelApplicationMutation = useMutation({
    mutationFn: () => apiRequest("/api/livreur/cancel-application", "POST"),
    onSuccess: () => {
      toast({
        title: "Candidature annulée",
        description: "Votre candidature a été annulée avec succès. Vous pouvez maintenant postuler ailleurs.",
      });
      // Refresh user data
      refetchUser();
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setShowCancelConfirm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'annuler la candidature",
        variant: "destructive",
      });
    }
  });

  if (!user || user.role !== 'livreur') {
    setLocation('/');
    return null;
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'En attente de validation',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="h-4 w-4" />,
          description: 'Votre candidature est en cours d\'examen par la pharmacie.'
        };
      case 'approved':
        return {
          label: 'Candidature acceptée',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="h-4 w-4" />,
          description: 'Félicitations ! Votre candidature a été acceptée. Vous pouvez maintenant accéder à votre tableau de bord.'
        };
      case 'rejected':
        return {
          label: 'Candidature non retenue',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <XCircle className="h-4 w-4" />,
          description: 'Votre candidature n\'a pas été retenue cette fois. Vous pouvez postuler à une autre pharmacie.'
        };
      default:
        return {
          label: 'Aucune candidature',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="h-4 w-4" />,
          description: 'Vous n\'avez pas encore postulé pour une pharmacie.'
        };
    }
  };

  const statusInfo = getStatusInfo(user.deliveryApplicationStatus || 'none');
  const hasActiveApplication = user.appliedPharmacyId && user.deliveryApplicationStatus === 'pending';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-md mx-auto flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/pharmacies')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">État de ma candidature</h1>
            <p className="text-sm text-gray-600">Suivi de votre demande</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Status Card */}
        <Card className="border-l-4 border-l-pharma-green">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Statut de la candidature</CardTitle>
              <Badge className={`flex items-center space-x-1 ${statusInfo.color}`}>
                {statusInfo.icon}
                <span>{statusInfo.label}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              {statusInfo.description}
            </p>

            {/* Pharmacy Info if applied */}
            {pharmacy && user.appliedPharmacyId && !pharmacyLoading && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  🏥 Pharmacie concernée
                </h4>
                <p className="text-sm text-blue-700">
                  <strong>Nom:</strong> {pharmacy.name}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Adresse:</strong> {pharmacy.address}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Téléphone:</strong> {pharmacy.phone}
                </p>
              </div>
            )}

            {pharmacyLoading && user.appliedPharmacyId && (
              <div className="bg-blue-50 p-4 rounded-lg animate-pulse">
                <div className="h-4 bg-blue-200 rounded mb-2"></div>
                <div className="h-3 bg-blue-200 rounded mb-1"></div>
                <div className="h-3 bg-blue-200 rounded"></div>
              </div>
            )}

            {/* User application info */}
            {(user.deliveryApplicationStatus === 'pending' || user.appliedPharmacyId) && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Informations de candidature
                </h4>
                <div className="space-y-2 text-sm text-yellow-700">
                  <p><strong>Candidature envoyée:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}</p>
                  <p><strong>Statut:</strong> {user.deliveryApplicationStatus || 'En attente'}</p>
                  {user.appliedPharmacyId && (
                    <p><strong>Pharmacie visée:</strong> {pharmacy?.name || 'Chargement...'}</p>
                  )}
                  <p><strong>Documents fournis:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    {user.idDocumentUrl && <li>Carte d'identité ✓</li>}
                    {user.drivingLicenseUrl && <li>Permis de conduire ✓</li>}
                    {user.professionalDocumentUrl && <li>CV ✓</li>}
                  </ul>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {user.deliveryApplicationStatus === 'approved' && (
                <Button
                  onClick={() => setLocation('/dashboard-livreur')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Accéder au tableau de bord 🚀
                </Button>
              )}

              {user.deliveryApplicationStatus === 'rejected' && (
                <Button
                  onClick={() => setLocation('/pharmacies')}
                  className="w-full bg-pharma-green hover:bg-pharma-green/90"
                >
                  Postuler à une autre pharmacie
                </Button>
              )}

              {user.deliveryApplicationStatus === 'pending' && (
                <>
                  <div className="text-center text-sm text-gray-500 p-4 border rounded-lg bg-gray-50">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Candidature en cours d'examen...</p>
                    <p className="text-xs mt-1">La pharmacie vous contactera sous 24-48h</p>
                  </div>
                  
                  {/* Cancel Application Button */}
                  {hasActiveApplication && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 mb-3">
                        Vous souhaitez annuler votre candidature et postuler ailleurs ?
                      </p>
                      {!showCancelConfirm ? (
                        <Button
                          variant="outline"
                          onClick={() => setShowCancelConfirm(true)}
                          className="w-full border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Annuler ma candidature
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-red-700 font-medium">
                            Êtes-vous sûr ? Cette action est irréversible.
                          </p>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowCancelConfirm(false)}
                              className="flex-1"
                            >
                              Annuler
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => cancelApplicationMutation.mutate()}
                              disabled={cancelApplicationMutation.isPending}
                              className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                              {cancelApplicationMutation.isPending ? 'Annulation...' : 'Confirmer'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {!user.appliedPharmacyId && (
                <Button
                  onClick={() => setLocation('/pharmacies')}
                  className="w-full bg-pharma-green hover:bg-pharma-green/90"
                >
                  Postuler maintenant
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timeline Card for pending applications */}
        {user.deliveryApplicationStatus === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Processus de validation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-700">Candidature envoyée</p>
                    <p className="text-sm text-gray-600">Documents reçus par la pharmacie</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-yellow-700">Examen en cours</p>
                    <p className="text-sm text-gray-600">La pharmacie examine votre candidature</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-500">Décision finale</p>
                    <p className="text-sm text-gray-600">Vous serez notifié du résultat</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
