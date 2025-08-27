import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import LanguageSelection from "@/pages/language-selection";
import Onboarding from "@/pages/onboarding";
import Home from "@/pages/home";
import Camera from "@/pages/camera";
import Pharmacies from "@/pages/pharmacies";
import OrderPage from "./pages/order";
import OrderValidationPage from "./pages/order-validation";
import PendingValidation from "./pages/pending-validation";
import SupervisorLock from "./pages/supervisorlock";
import DeliveryTracking from "@/pages/delivery-tracking";
import Profile from "@/pages/profile";
import EditProfile from "@/pages/edit-profile";
import DeliveryAddress from "@/pages/delivery-address";
import HelpCenter from "./pages/help-center";
import PrivacyPolicy from "./pages/privacy-policy";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import VerifyResetCode from "@/pages/verify-reset-code";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";
import DashboardPatient from "@/pages/dashboard-patient";
import DashboardPharmacien from "@/pages/dashboard-pharmacien";
import DashboardLivreur from "./pages/dashboard-livreur";
import DeliveryMapLivreur from "./pages/delivery-map-livreur";
import DashboardAdmin from "@/pages/dashboard-admin";
import PharmacyProfile from "@/pages/pharmacy-profile";
import CreatePharmacy from "@/pages/create-pharmacy";
import DeliveryApplication from "./pages/delivery-application";
import ApplicationStatus from "@/pages/application-status";
import SuspendedPage from "@/pages/suspended";
import DeliveryHiringPending from "./pages/delivery-hiring-pending";
import { lazy } from 'react';


function RoleDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  // Check if user is suspended (isActive = false)
  if (user.isActive === false) {
    return <SuspendedPage />;
  }

  // Check if professional account is pending validation
  if (user.role === "pharmacien" && user.verificationStatus === "pending") {
    return <PendingValidation />;
  }

  // For delivery persons, check verification status vs delivery application status
  if (user.role === "livreur") {
    // If user account validation is pending (by admin), show admin validation page
    if (user.verificationStatus === "pending") {
      return <PendingValidation />;
    }
    // If user is approved but delivery application is pending (by pharmacy), show hiring page
    if (user.verificationStatus === "approved" && user.deliveryApplicationStatus === "pending") {
      return <DeliveryHiringPending />;
    }
  }

  // Check if professional account was rejected
  if ((user.role === "pharmacien" || user.role === "livreur") && user.verificationStatus === "rejected") {
    return <PendingValidation />; // Could create a separate rejection page
  }

  // Check if delivery application was rejected
  if (user.role === "livreur" && user.deliveryApplicationStatus === "rejected") {
    return <PendingValidation />;
  }

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
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/verify-reset-code" component={VerifyResetCode} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* Routes protégées - nécessitent l'authentification */}
      {isAuthenticated ? (
        <>
          <Route path="/" component={RoleDashboard} />
          <Route path="/home" component={RoleDashboard} />
          <Route path="/dashboard" component={RoleDashboard} />
          <Route path="/dashboard-patient" component={DashboardPatient} />
          <Route path="/dashboard-pharmacien" component={DashboardPharmacien} />
          <Route path="/dashboard-livreur" component={DashboardLivreur} />
          <Route path="/delivery-map-livreur" component={DeliveryMapLivreur} />
          <Route path="/dashboard-admin" component={DashboardAdmin} />
          <Route path="/pending-validation" component={PendingValidation} />
          <Route path="/camera" component={Camera} />
          <Route path="/pharmacies" component={Pharmacies} />
          <Route path="/order" component={OrderPage} />
          <Route path="/order-validation" component={OrderValidationPage} />
          <Route path="/pending-validation" component={PendingValidation} />
          <Route path="/delivery-hiring-pending" component={DeliveryHiringPending} />
          <Route path="/suspended" component={SuspendedPage} />
          <Route path="/supervisorlock" component={SupervisorLock} />
          <Route path="/delivery" component={DeliveryTracking} />
          <Route path="/profile" component={Profile} />
          <Route path="/edit-profile" component={EditProfile} />
          <Route path="/pharmacy-profile" component={PharmacyProfile} />
          <Route path="/create-pharmacy" component={CreatePharmacy} />
          <Route path="/delivery-application" component={DeliveryApplication} />
          <Route path="/application-status" component={ApplicationStatus} />
          <Route path="/delivery-application-status" component={ApplicationStatus} />
          <Route path="/delivery-tracking" component={DeliveryTracking} />
          <Route path="/delivery-address" component={DeliveryAddress} />
          <Route path="/help-center" component={HelpCenter} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
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