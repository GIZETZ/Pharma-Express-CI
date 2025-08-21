import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Onboarding() {
  const [, setLocation] = useLocation();

  const handleContinue = () => {
    setLocation("/home");
  };

  const handleCameraClick = () => {
    // Au lieu d'aller vers /camera, ouvrir directement l'input file
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        // Stocker la photo et aller directement aux pharmacies
        localStorage.setItem('prescriptionPhoto', JSON.stringify({
          name: file.name,
          size: file.size,
          lastModified: file.lastModified
        }));
        setLocation("/pharmacies");
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-pharma-bg">
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-pharma-green rounded-2xl mb-6">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2h8v2H5v-2z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-app-title">
            Pharma Express CI
          </h1>
        </div>
        
        <Card className="w-full max-w-sm mb-8 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Téléverser une ordonnance
            </h2>
            <p className="text-gray-600 mb-6">
              Choisissez une pharmacie et faites-vous livrer vos médicaments
            </p>
            
            <button
              onClick={handleCameraClick}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6 hover:border-pharma-green transition-colors"
              data-testid="button-upload-prescription"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">Téléverser l'ordonnance</p>
            </button>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Sélectionner une pharmacie
                </h3>
                <p className="text-gray-600 text-sm">
                  Veuillez sélectionner une pharmacie
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Button
          className="w-full max-w-sm bg-pharma-blue text-white py-4 rounded-xl font-semibold text-lg h-auto hover:bg-pharma-blue/90"
          onClick={handleContinue}
          data-testid="button-continue"
        >
          Continuer
        </Button>
      </div>
    </div>
  );
}
