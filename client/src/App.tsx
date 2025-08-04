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
import DeliveryAddress from "@/pages/delivery-address";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";
import DashboardPatient from "@/pages/dashboard-patient";
import DashboardPharmacien from "@/pages/dashboard-pharmacien";
import DashboardLivreur from "@/pages/dashboard-livreur";
import DashboardAdmin from "@/pages/dashboard-admin";
import PWAInstallPrompt from "@/components/pwa-install-prompt";

function RoleDashboard() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  switch (user.role) {
    case "admin":
      return <DashboardAdmin />;
    case "pharmacien":
      return <DashboardPharmacien />;
    case "livreur":
      return <DashboardLivreur />;
    case "patient":
    default:
      return <DashboardPatient />;
  }
}

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
          <Route path="/" component={RoleDashboard} />
          <Route path="/home" component={RoleDashboard} />
          <Route path="/dashboard" component={RoleDashboard} />
          <Route path="/camera" component={Camera} />
          <Route path="/pharmacies" component={Pharmacies} />
          <Route path="/delivery" component={DeliveryTracking} />
          <Route path="/profile" component={Profile} />
          <Route path="/edit-profile" component={EditProfile} />
          <Route path="/delivery-address" component={DeliveryAddress} />
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