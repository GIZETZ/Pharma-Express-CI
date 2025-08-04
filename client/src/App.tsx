import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";

import LanguageSelection from "@/pages/language-selection";
import Onboarding from "@/pages/onboarding";
import Home from "@/pages/home";
import Camera from "@/pages/camera";
import Pharmacies from "@/pages/pharmacies";
import DeliveryTracking from "@/pages/delivery-tracking";
import Profile from "@/pages/profile";
import EditProfile from "@/pages/edit-profile";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";
import PWAInstallPrompt from "@/components/pwa-install-prompt";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Afficher un loading pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Routes publiques - pages d'auth */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Routes protégées - nécessitent l'authentification */}
      {isAuthenticated ? (
        <>
          <Route path="/" component={Home} />
          <Route path="/home" component={Home} />
          <Route path="/camera" component={Camera} />
          <Route path="/pharmacies" component={Pharmacies} />
          <Route path="/delivery" component={DeliveryTracking} />
          <Route path="/profile" component={Profile} />
          <Route path="/edit-profile" component={EditProfile} />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          {/* Routes pour les utilisateurs non connectés */}
          <Route path="/" component={LanguageSelection} />
          <Route path="/onboarding" component={Onboarding} />
        </>
      )}

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('SW registered: ', registration);
        } catch (registrationError) {
          console.log('SW registration failed: ', registrationError);
        }
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <PWAInstallPrompt />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;