import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/bottom-navigation";
import { useNotifications } from "@/hooks/use-notifications";

export default function Home() {
  const [, setLocation] = useLocation();
  const { hasUnread } = useNotifications();

  const navigateToCamera = () => {
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

  const navigateToPharmacies = () => {
    setLocation("/pharmacies");
  };

  const navigateToDelivery = () => {
    setLocation("/delivery");
  };

  const navigateToProfile = () => {
    setLocation("/profile");
  };

  return (
    <div className="min-h-screen bg-pharma-bg pb-20">
      {/* Header */}
      <header className="bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-pharma-green rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900" data-testid="text-app-name">
              Pharma Express CI
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button className="relative p-2" data-testid="button-notifications">
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full notification-badge"></span>
              )}
            </button>
            <button onClick={navigateToProfile} data-testid="button-profile">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" 
              />
            </button>
          </div>
        </div>
      </header>

      {/* Quick Upload Card */}
      <div className="px-4 py-6">
        <div className="bg-gradient-to-r from-pharma-green to-green-400 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2h8v2H5v-2z" clipRule="evenodd" />
                </svg>
                <span className="text-white/90 text-sm font-medium">ORDONNANCE</span>
              </div>
              <h2 className="text-xl font-semibold mb-1">Envoyer une ordonnance</h2>
              <p className="text-white/80 text-sm">Prenez une photo ou téléversez</p>
            </div>
            <Button
              onClick={navigateToCamera}
              className="bg-white/20 backdrop-blur-sm rounded-xl p-3 hover:bg-white/30 h-auto"
              data-testid="button-quick-upload"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="shadow-sm cursor-pointer" onClick={navigateToPharmacies} data-testid="card-pharmacies">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-pharma-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Pharmacies</h3>
              <p className="text-gray-600 text-sm">Trouvez près de vous</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm cursor-pointer" onClick={navigateToDelivery} data-testid="card-delivery">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-pharma-blue delivery-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707L16 7.586A1 1 0 0015.414 7H14z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Livraison</h3>
              <p className="text-gray-600 text-sm">Suivi en temps réel</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm" data-testid="card-insurance">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Assurance</h3>
              <p className="text-gray-600 text-sm">Couverture médicale</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm" data-testid="card-history">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Historique</h3>
              <p className="text-gray-600 text-sm">Vos commandes</p>
            </CardContent>
          </Card>
        </div>

        {/* Delivery Tracking Card */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">À propos de la livraison</h3>
            <div className="flex items-center space-x-3" data-testid="delivery-info">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-pharma-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Suivez la livraison en temps réel</p>
                <p className="text-gray-600 text-sm">Estimé: 30-45 minutes</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation currentPage="home" />
    </div>
  );
}
