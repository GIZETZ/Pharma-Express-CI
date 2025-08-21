import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function PendingValidation() {
  const { user, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Fetch updated user data from server
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        // Check if user is now approved
        if (userData.verificationStatus === 'approved' && 
            (userData.role !== 'livreur' || userData.deliveryApplicationStatus === 'approved')) {
          // User is approved, redirect to appropriate dashboard
          window.location.href = userData.role === 'livreur' ? '/dashboard-livreur' : 
                                userData.role === 'pharmacien' ? '/dashboard-pharmacien' : '/dashboard-patient';
        } else {
          // Still pending, just reload the page to show any updates
          window.location.reload();
        }
      } else {
        // Error or unauthorized, reload page
        window.location.reload();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      window.location.reload();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getRoleDisplayName = () => {
    switch (user?.role) {
      case 'pharmacien':
        return 'Pharmacien';
      case 'livreur':
        return 'Livreur';
      default:
        return 'Utilisateur';
    }
  };

  const getValidationMessage = () => {
    switch (user?.role) {
      case 'pharmacien':
        return "Votre demande d'inscription en tant que pharmacien est en cours de validation par notre équipe. Vous recevrez une notification dès que votre compte sera approuvé.";
      case 'livreur':
        return "Votre demande d'inscription en tant que livreur est en cours de validation par notre équipe. Vous recevrez une notification dès que votre compte sera approuvé.";
      default:
        return "Votre compte est en cours de validation par notre équipe.";
    }
  };

  const getRequiredDocuments = () => {
    switch (user?.role) {
      case 'pharmacien':
        return [
          "Diplôme de pharmacie",
          "Certificat d'inscription à l'Ordre des Pharmaciens",
          "Pièce d'identité",
          "Justificatif de domicile",
          "Autorisation d'ouverture de pharmacie"
        ];
      case 'livreur':
        return [
          "Pièce d'identité",
          "Permis de conduire (si applicable)",
          "Casier judiciaire",
          "Justificatif de domicile",
          "Certificat médical d'aptitude"
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Validation en cours
          </h1>
          <p className="text-gray-600">
            Bonjour {user?.firstName} {user?.lastName}
          </p>
        </div>

        {/* Status Card */}
        <Card className="shadow-sm">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {getRoleDisplayName()}
              </Badge>
              <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                En attente de validation
              </Badge>
            </div>
            <CardTitle className="text-xl">Votre demande est en cours de traitement</CardTitle>
            <CardDescription className="text-base">
              {getValidationMessage()}
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
                  <p className="font-medium text-gray-900">Compte créé</p>
                  <p className="text-sm text-gray-600">Votre inscription a été enregistrée avec succès</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Validation en cours</p>
                  <p className="text-sm text-gray-600">Vérification des documents et informations</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Accès autorisé</p>
                  <p className="text-sm text-gray-500">Accès à votre tableau de bord professionnel</p>
                </div>
              </div>
            </div>

            {/* Required Documents */}
            {getRequiredDocuments().length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Documents requis pour la validation :
                </h4>
                <ul className="space-y-1">
                  {getRequiredDocuments().map((doc, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contact Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                Besoin d'aide ?
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                Si vous avez des questions concernant votre validation, contactez notre support :
              </p>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Email :</span> support@yahopharma.ci
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
                onClick={handleRefresh} 
                disabled={isRefreshing}
                className="flex-1"
              >
                {isRefreshing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
              >
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Délai de validation habituel : 24-48 heures ouvrées
          </p>
        </div>
      </div>
    </div>
  );
}