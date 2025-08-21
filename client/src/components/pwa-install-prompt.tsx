import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePWA } from "@/hooks/use-pwa";

export default function PWAInstallPrompt() {
  const { deferredPrompt, isInstallable, installApp } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isInstallable && !localStorage.getItem('pwa-install-dismissed')) {
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || !isInstallable) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 fade-in" data-testid="pwa-install-prompt">
      <Card className="shadow-lg border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-pharma-green rounded-lg p-2">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900" data-testid="text-install-title">
                Installer l'app
              </h3>
              <p className="text-sm text-gray-600" data-testid="text-install-description">
                Ajoutez Pharma Express CI à votre écran d'accueil
              </p>
            </div>
            <Button
              onClick={handleInstall}
              className="bg-pharma-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pharma-green/90"
              data-testid="button-install-app"
            >
              Installer
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
              data-testid="button-dismiss-install"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
