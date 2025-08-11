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

  // Pharmacies triées par distance si géolocalisation disponible
  const { data: pharmacies, isLoading: pharmaciesLoading } = useQuery({ 
    queryKey: ["/api/pharmacies", userLocation],
    queryFn: async () => {
      const url = userLocation 
        ? `/api/pharmacies?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=10`
        : `/api/pharmacies`;
      console.log('Fetching pharmacies from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des pharmacies');
      }
      const data = await response.json();
      console.log('Pharmacies received:', data);
      return data;
    },
    enabled: true,
    staleTime: 0, // Force fresh data every time
    cacheTime: 0  // Don't cache the results
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            🏥 Pharmacies & Commandes
          </h1>
          <p className="text-gray-600">
            Bienvenue {user?.firstName} ! Localisez une pharmacie et passez commande
          </p>
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
                {pharmacies?.map((pharmacy: any, index: number) => (
                  <Card key={pharmacy.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{pharmacy.name}</h4>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {pharmacy.address}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {pharmacy.phone}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={pharmacy.isOpen ? 'default' : 'secondary'}>
                            {pharmacy.isOpen ? 'Ouvert' : 'Fermé'}
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
                          {pharmacy.rating}/5
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {pharmacy.deliveryTime} min
                        </span>
                      </div>
                      <Button 
                        className="w-full" 
                        size="sm" 
                        onClick={() => {
                          localStorage.setItem('selectedPharmacy', JSON.stringify(pharmacy));
                          navigate('/order');
                        }}
                        disabled={!pharmacy.isOpen}
                      >
                        {pharmacy.isOpen ? 'Sélectionner' : 'Fermée'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNavigation currentPage="pharmacies" />
    </div>
  );
}
