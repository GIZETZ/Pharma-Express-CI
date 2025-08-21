import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BottomNavigation from "@/components/bottom-navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/auth/user-stats'],
    enabled: !!user,
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await fetch('/api/auth/upload-profile-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload de l\'image');
      }
      
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Photo mise à jour",
        description: "Votre photo de profil a été mise à jour avec succès.",
      });
      queryClient.setQueryData(['/api/auth/user'], updatedUser);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'upload.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un fichier image valide.",
          variant: "destructive",
        });
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "L'image ne doit pas dépasser 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      uploadImageMutation.mutate(file);
    }
  };

  const goBack = () => {
    setLocation("/home");
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/logout', {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt!",
      });
      queryClient.clear();
      localStorage.clear();
      window.location.href = '/login';
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la déconnexion",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pharma-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-4 border-pharma-green border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pharma-bg pb-20">
      {/* Header */}
      <header className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="w-10 h-10"
            data-testid="button-back"
          >
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Button>
          <h1 className="text-xl font-bold text-gray-900" data-testid="text-page-title">
            Mon Profil
          </h1>
        </div>
      </header>

      {/* Profile Header */}
      <div className="px-4 py-6">
        <Card className="shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <img 
                  src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 cursor-pointer" 
                  data-testid="img-profile"
                  onClick={() => document.getElementById('profile-image-input')?.click()}
                />
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-pharma-green rounded-full flex items-center justify-center border-2 border-white cursor-pointer"
                     onClick={() => document.getElementById('profile-image-input')?.click()}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploadImageMutation.isPending && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900" data-testid="text-user-name">
                  {user ? `${user.firstName} ${user.lastName}` : 'Chargement...'}
                </h2>
                <p className="text-gray-600" data-testid="text-user-phone">
                  {user?.phone || 'Chargement...'}
                </p>
                <p className="text-pharma-green text-sm font-medium">
                  Membre depuis {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2023'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-pharma-green"
                data-testid="button-edit-profile"
                onClick={() => setLocation("/edit-profile")}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </Button>
            </div>
            
            <div className="flex justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-pharma-green" data-testid="text-orders-count">
                  {statsLoading ? (
                    <div className="w-8 h-8 mx-auto border-2 border-pharma-green border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    userStats?.totalOrders || 0
                  )}
                </p>
                <p className="text-gray-600 text-base font-medium">Commandes effectuées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Options */}
        <div className="space-y-4">
          <Card className="shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Compte</h3>
            </div>
            
            <button 
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors" 
              data-testid="button-personal-info"
              onClick={() => setLocation("/edit-profile")}
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-pharma-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-gray-900">Informations personnelles</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <button 
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors" 
              data-testid="button-delivery-addresses"
              onClick={() => setLocation("/delivery-address")}
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-pharma-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-gray-900">Adresses de livraison</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors" data-testid="button-payment-methods">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-pharma-green" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-gray-900">Méthodes de paiement</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </Card>

          <Card className="shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Préférences</h3>
            </div>
            
            <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors" data-testid="button-notifications">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-pharma-green" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                <span className="font-medium text-gray-900">Notifications</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-sm">Activées</span>
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
            
            <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors" data-testid="button-language">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-pharma-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-gray-900">Langue</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-sm">Français</span>
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
          </Card>

          <Card className="shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Support</h3>
            </div>
            
            <button 
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors" 
              data-testid="button-help-center"
              onClick={() => setLocation("/help-center")}
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-pharma-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-gray-900">Centre d'aide</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <button 
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors" 
              data-testid="button-contact-support"
              onClick={() => window.location.href = 'tel:+2250767150156'}
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-pharma-green" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <div className="text-left">
                  <span className="font-medium text-gray-900 block">Contacter le support</span>
                  <span className="text-sm text-gray-500">+225 07 67 15 01 56</span>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            <button 
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors" 
              data-testid="button-privacy-policy"
              onClick={() => setLocation("/privacy-policy")}
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-pharma-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1L5 4v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V4l-5-3-8 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-gray-900">Politique de confidentialité</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </Card>

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-semibold hover:bg-red-100 h-auto"
            data-testid="button-logout"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Se déconnecter
          </Button>
        </div>
      </div>

      <BottomNavigation currentPage="profile" />
    </div>
  );
}
