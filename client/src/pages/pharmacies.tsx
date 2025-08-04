import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import type { Pharmacy } from "@shared/schema";

export default function Pharmacies() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: pharmacies, isLoading } = useQuery<Pharmacy[]>({
    queryKey: ['/api/pharmacies'],
  });

  const selectPharmacy = (pharmacy: Pharmacy) => {
    localStorage.setItem('selected-pharmacy', JSON.stringify(pharmacy));
    toast({
      title: "Pharmacie sélectionnée",
      description: "Votre commande est en cours de traitement",
    });
    setLocation("/delivery");
  };

  const goBack = () => {
    setLocation("/home");
  };

  const filteredPharmacies = pharmacies?.filter(pharmacy =>
    pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pharmacy.address.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
            Pharmacies à proximité
          </h1>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Rechercher une pharmacie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-pharma-green focus:bg-white transition-all"
            data-testid="input-search-pharmacy"
          />
          <svg className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Map */}
      <div className="px-4 mb-4">
        <div className="map-container">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <p className="font-medium">Carte interactive</p>
              <p className="text-sm">Localisation des pharmacies</p>
            </div>
          </div>
          {/* Mock location pins */}
          <div className="absolute top-6 left-8 w-3 h-3 bg-pharma-green rounded-full animate-pulse"></div>
          <div className="absolute top-16 right-12 w-3 h-3 bg-pharma-green rounded-full animate-pulse"></div>
          <div className="absolute bottom-8 left-16 w-3 h-3 bg-pharma-green rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Pharmacy List */}
      <div className="px-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 mx-auto border-4 border-pharma-green border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-gray-600">Chargement des pharmacies...</p>
          </div>
        ) : filteredPharmacies.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <p className="text-gray-600">Aucune pharmacie trouvée</p>
          </div>
        ) : (
          filteredPharmacies.map((pharmacy) => (
            <Card key={pharmacy.id} className="shadow-sm" data-testid={`card-pharmacy-${pharmacy.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-pharma-green rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900" data-testid={`text-pharmacy-name-${pharmacy.id}`}>
                      {pharmacy.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2" data-testid={`text-pharmacy-address-${pharmacy.id}`}>
                      {pharmacy.address}
                    </p>
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-medium" data-testid={`text-pharmacy-rating-${pharmacy.id}`}>
                          {pharmacy.rating}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600" data-testid={`text-pharmacy-delivery-time-${pharmacy.id}`}>
                          {pharmacy.deliveryTime} min
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600">1.2 km</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={pharmacy.isOpen ? "default" : "secondary"}
                      className={`mb-2 ${pharmacy.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      data-testid={`badge-pharmacy-status-${pharmacy.id}`}
                    >
                      {pharmacy.isOpen ? 'Ouvert' : 'Fermé'}
                    </Badge>
                    <Button
                      onClick={() => selectPharmacy(pharmacy)}
                      disabled={!pharmacy.isOpen}
                      className={`w-full ${pharmacy.isOpen ? 'bg-pharma-green hover:bg-pharma-green/90' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                      data-testid={`button-select-pharmacy-${pharmacy.id}`}
                    >
                      {pharmacy.isOpen ? 'Choisir' : 'Fermé'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <BottomNavigation currentPage="pharmacies" />
    </div>
  );
}
