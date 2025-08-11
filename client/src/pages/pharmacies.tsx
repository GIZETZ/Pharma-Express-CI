import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";
import { MapPin, Clock, Star, Phone } from "lucide-react";

export default function Pharmacies() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  // Géolocalisation automatique
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          // Reverse geocoding pour obtenir l'adresse
          try {
            const response = await fetch(`/api/location/reverse?lat=${latitude}&lng=${longitude}`);
            const addressData = await response.json();
            setCurrentAddress(addressData.formatted_address);
          } catch (error) {
            console.error("Erreur géolocalisation:", error);
          }
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
        }
      );
    }
  }, []);

  // Actualisation automatique périodique des pharmacies
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('Actualisation automatique des pharmacies...');
      refetchPharmacies();
    }, 120000); // Toutes les 2 minutes

    // Nettoyer l'intervalle au démontage du composant
    return () => clearInterval(intervalId);
  }, [refetchPharmacies]);

  // Pharmacies triées par distance si géolocalisation disponible
  const { data: pharmacies, isLoading: pharmaciesLoading, refetch: refetchPharmacies } = useQuery({ 
    queryKey: ["/api/pharmacies", userLocation],
    queryFn: async () => {
      const url = userLocation 
        ? `/api/pharmacies?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=50`
        : `/api/pharmacies`;
      console.log('Fetching pharmacies from:', url);
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        console.error('Failed to fetch pharmacies:', response.status, response.statusText);
        throw new Error('Erreur lors du chargement des pharmacies');
      }
      const data = await response.json();
      console.log('Pharmacies received:', data);
      
      // Sort pharmacies by distance if user location is available
      if (userLocation && Array.isArray(data)) {
        return data.sort((a, b) => {
          const distanceA = calculateDistance(
            userLocation.lat, userLocation.lng,
            parseFloat(a.latitude) || 0, parseFloat(a.longitude) || 0
          );
          const distanceB = calculateDistance(
            userLocation.lat, userLocation.lng,
            parseFloat(b.latitude) || 0, parseFloat(b.longitude) || 0
          );
          return distanceA - distanceB;
        });
      }
      
      return data || [];
    },
    enabled: true,
    staleTime: 30000, // 30 secondes avant de considérer les données comme périmées
    refetchInterval: 60000, // Actualisation automatique toutes les minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchIntervalInBackground: false // Pas d'actualisation en arrière-plan
  });

  // Function to calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-600 mb-2">
                🏥 Pharmacies & Commandes
              </h1>
              <p className="text-gray-600">
                Bienvenue {user?.firstName} ! Localisez une pharmacie et passez commande
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchPharmacies()}
              disabled={pharmaciesLoading}
            >
              {pharmaciesLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                "🔄 Actualiser"
              )}
            </Button>
          </div>
          {currentAddress && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>Votre position: {currentAddress}</span>
            </div>
          )}
        </div>

        {/* Localiser Pharmacie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localiser une Pharmacie
            </CardTitle>
            <CardDescription>
              {userLocation 
                ? "Pharmacies triées par proximité selon votre position" 
                : "Trouvez les pharmacies disponibles"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pharmaciesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Localisation des pharmacies...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pharmacies && pharmacies.length > 0 ? (
                  pharmacies.map((pharmacy: any, index: number) => {
                    const distance = userLocation ? calculateDistance(
                      userLocation.lat, userLocation.lng,
                      parseFloat(pharmacy.latitude) || 0, parseFloat(pharmacy.longitude) || 0
                    ) : null;
                    
                    return (
                      <Card key={pharmacy.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{pharmacy.name}</h4>
                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {pharmacy.address}
                              </p>
                              {pharmacy.phone && (
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                  <Phone className="h-3 w-3" />
                                  {pharmacy.phone}
                                </p>
                              )}
                              {distance && (
                                <p className="text-xs text-blue-600 mt-1">
                                  📍 {distance.toFixed(1)} km
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant={pharmacy.isOpen !== false ? 'default' : 'secondary'}>
                                {pharmacy.isOpen !== false ? 'Ouvert' : 'Fermé'}
                              </Badge>
                              {index === 0 && userLocation && (
                                <Badge variant="outline" className="text-xs">
                                  Plus proche
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm mb-3">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {pharmacy.rating || '4.5'}/5
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {pharmacy.deliveryTime || '30'} min
                            </span>
                          </div>
                          <Button 
                            className="w-full" 
                            size="sm" 
                            onClick={() => {
                              localStorage.setItem('selectedPharmacy', JSON.stringify(pharmacy));
                              navigate('/order');
                            }}
                            disabled={pharmacy.isOpen === false}
                          >
                            {pharmacy.isOpen !== false ? 'Sélectionner' : 'Fermée'}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-8">
                    <div className="text-gray-500 mb-4">
                      <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Aucune pharmacie trouvée</p>
                      <p className="text-sm">Veuillez réessayer plus tard</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => refetchPharmacies()}
                      disabled={pharmaciesLoading}
                    >
                      Actualiser
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNavigation currentPage="pharmacies" />
    </div>
  );
}
