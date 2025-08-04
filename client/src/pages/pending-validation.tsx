import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function PendingValidation() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Card className="border-2 border-yellow-300">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⏳</span>
            </div>
            <CardTitle className="text-xl text-yellow-800">
              Compte en Attente de Validation
            </CardTitle>
            <CardDescription>
              Votre inscription a été reçue avec succès
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Bonjour {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                Votre compte <strong>{user?.role === "pharmacien" ? "Pharmacien" : "Livreur"}</strong> est 
                actuellement en cours de validation par notre équipe administrative.
              </p>
              <div className="text-xs text-yellow-600 space-y-1">
                <p>📋 Nous vérifions vos documents d'identité</p>
                {user?.role === "pharmacien" && <p>🎓 Validation de votre diplôme de pharmacien</p>}
                {user?.role === "livreur" && <p>🚗 Vérification de votre permis de conduire</p>}
                <p>✅ Validation administrative en cours</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Prochaines étapes</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <p>1. Notre équipe vérifie vos pièces justificatives</p>
                <p>2. Validation dans les 24-48h ouvrables</p>
                <p>3. Notification par SMS dès l'approbation</p>
                <p>4. Accès complet à votre tableau de bord</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                <strong>💬 Besoin d'aide ?</strong><br/>
                Contactez-nous au +225 01 23 45 67
              </p>
            </div>

            <div className="pt-4 space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.reload()}
                data-testid="button-refresh"
              >
                🔄 Vérifier le Statut
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                Se Déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}