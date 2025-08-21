import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Suspended() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté, rediriger vers login
    if (!user) {
      navigate("/login");
      return;
    }

    // Si l'utilisateur est actif, rediriger vers le dashboard approprié
    if (user.isActive) {
      switch (user.role) {
        case "admin":
          navigate("/dashboard-admin");
          break;
        case "pharmacien":
          navigate("/dashboard-pharmacien");
          break;
        case "livreur":
          navigate("/dashboard-livreur");
          break;
        case "patient":
          navigate("/dashboard-patient");
          break;
        default:
          navigate("/");
          break;
      }
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleContactSupport = () => {
    // Ouvrir un lien mailto ou rediriger vers une page de contact
    window.location.href = "mailto:support@yahoopharma.ci?subject=Compte Suspendu - Demande de Réactivation&body=Bonjour,%0A%0AJe vous contacte concernant la suspension de mon compte.%0A%0ANom: " + 
      encodeURIComponent(`${user?.firstName} ${user?.lastName}`) + 
      "%0ATéléphone: " + encodeURIComponent(user?.phone || '') + 
      "%0A%0AMerci de bien vouloir examiner ma situation.%0A%0ACordialement";
  };

  if (!user || user.isActive) {
    return null; // L'useEffect va rediriger
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {/* Icône de suspension */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🚫</span>
          </div>

          {/* Titre principal */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Compte Suspendu
          </h1>

          {/* Message d'explication */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm font-medium mb-2">
              Votre compte a été temporairement suspendu
            </p>
            <p className="text-red-700 text-sm">
              Votre accès à la plateforme YahoPharma+ a été suspendu par l'administration. 
              Cette mesure peut être due à une violation des conditions d'utilisation ou à des problèmes de sécurité.
            </p>
          </div>

          {/* Informations du compte */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Informations du compte :</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Nom :</strong> {user.firstName} {user.lastName}</p>
              <p><strong>Téléphone :</strong> {user.phone}</p>
              <p><strong>Rôle :</strong> {
                user.role === 'pharmacien' ? 'Pharmacien' :
                user.role === 'livreur' ? 'Livreur' :
                user.role === 'patient' ? 'Patient' : user.role
              }</p>
              <p><strong>Statut :</strong> <span className="text-red-600 font-medium">Suspendu</span></p>
            </div>
          </div>

          {/* Actions pour l'utilisateur */}
          <div className="space-y-3">
            <Button 
              onClick={handleContactSupport}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              📧 Contacter le Support
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full"
            >
              🚪 Se Déconnecter
            </Button>
          </div>

          {/* Message d'aide */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-xs">
              <strong>Besoin d'aide ?</strong><br />
              Contactez notre équipe support à <strong>support@yahoopharma.ci</strong> 
              ou appelez le <strong>+225 27 20 30 40 50</strong> pour plus d'informations 
              sur la réactivation de votre compte.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              YahoPharma+ © 2025 - Tous droits réservés
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}