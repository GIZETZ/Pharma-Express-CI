import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";

import LanguageSelection from "@/pages/language-selection";
import Onboarding from "@/pages/onboarding";
import Home from "@/pages/home";
import Camera from "@/pages/camera";
import Pharmacies from "@/pages/pharmacies";
import DeliveryTracking from "@/pages/delivery-tracking";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import PWAInstallPrompt from "@/components/pwa-install-prompt";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LanguageSelection} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/home" component={Home} />
      <Route path="/camera" component={Camera} />
      <Route path="/pharmacies" component={Pharmacies} />
      <Route path="/delivery" component={DeliveryTracking} />
      <Route path="/profile" component={Profile} />
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
      <TooltipProvider>
        <Toaster />
        <PWAInstallPrompt />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
