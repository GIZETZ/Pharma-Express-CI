import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function DeliveryHiringPending() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    // Optionally refresh user data here
    window.location.reload();
  };

  const goToPharmacies = () => {
    setLocation('/pharmacies');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            En attente d'embauche
          </h1>
          <p className="text-gray-600">
            Votre candidature a été soumise avec succès
          </p>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Candidature en cours de traitement</CardTitle>
            <CardDescription className="text-base">
              Nous avons bien reçu votre candidature de livreur. Une pharmacie va examiner votre profil et vous contacter si votre candidature correspond à leurs besoins.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Timeline */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Candidature soumise</p>
                  <p className="text-sm text-gray-600">Vos documents ont été envoyés avec succès</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Examen par les pharmacies</p>
                  <p className="text-sm text-gray-600">Les pharmacies examinent votre candidature</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Embauche confirmée</p>
                  <p className="text-sm text-gray-500">Accès à votre tableau de bord de livraison</p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Prochaines étapes :
              </h4>
              <ul className="space-y-1">
                <li className="text-sm text-blue-800 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Une pharmacie vous contactera directement si intéressée</span>
                </li>
                <li className="text-sm text-blue-800 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Vous pourrez postuler dans d'autres pharmacies</span>
                </li>
                <li className="text-sm text-blue-800 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Gardez votre téléphone accessible pour recevoir les appels</span>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                Besoin d'aide ?
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                Si vous avez des questions concernant votre candidature :
              </p>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Email :</span> emploi@yahopharma.ci
                </p>
                <p className="text-sm">
                  <span className="font-medium">Téléphone :</span> +225 XX XX XX XX XX
                </p>
                <p className="text-sm">
                  <span className="font-medium">Heures d'ouverture :</span> Lun-Ven 8h-18h
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={goToPharmacies}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                data-testid="button-view-pharmacies"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                Voir les pharmacies
              </Button>
              <Button 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                variant="outline"
                className="flex-1"
                data-testid="button-refresh-status"
              >
                {isRefreshing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Vérification...
                  </>
                ) : (
                  'Actualiser le statut'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={logout}
                className="flex-1"
                data-testid="button-logout"
              >
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Délai de réponse habituel : 24-72 heures ouvrées
          </p>
          <p className="mt-1">
            N'hésitez pas à postuler dans plusieurs pharmacies pour augmenter vos chances
          </p>
        </div>
      </div>
    </div>
  );
}