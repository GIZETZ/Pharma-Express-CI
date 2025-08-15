
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/bottom-navigation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useState, useEffect, useRef } from "react";
import type { Order, DeliveryPerson } from "@shared/schema";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function DeliveryTracking() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { latitude: userLat, longitude: userLng } = useGeolocation();
  const [deliveryPersonLocation, setDeliveryPersonLocation] = useState<{lat: number, lng: number} | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [map, setMap] = useState<L.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const pharmacyMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // OpenStreetMap configuration (free alternative)
  const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const OSM_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  // Get current order being tracked
  const { data: currentOrder, isLoading: orderLoading } = useQuery<Order>({
    queryKey: ['/api/orders/current'],
    refetchInterval: 5000,
  });

  const { data: deliveryPerson } = useQuery<DeliveryPerson>({
    queryKey: ['/api/delivery-persons', currentOrder?.deliveryPersonId],
    enabled: !!currentOrder?.deliveryPersonId,
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    const initialMap = L.map(mapRef.current, {
      center: [5.3364, -4.0267], // Abidjan center
      zoom: 13,
      zoomControl: true,
    });

    // Add OpenStreetMap tile layer
    L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(initialMap);

    setMap(initialMap);

    return () => {
      initialMap.remove();
    };
  }, [mapRef]);

  // Add user marker when location is available
  useEffect(() => {
    if (!map || !userLat || !userLng) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const userIcon = L.divIcon({
      html: `
        <div style="
          background: #3B82F6; 
          width: 20px; 
          height: 20px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="12" height="12" fill="white" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
          </svg>
        </div>
      `,
      className: 'user-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon })
      .addTo(map)
      .bindPopup('📍 Votre position')
      .openPopup();

    map.setView([userLat, userLng], 15);
  }, [map, userLat, userLng]);

  // Add pharmacy marker
  useEffect(() => {
    if (!map) return;

    if (pharmacyMarkerRef.current) {
      pharmacyMarkerRef.current.remove();
    }

    const pharmacyIcon = L.divIcon({
      html: `
        <div style="
          background: #10B981; 
          width: 24px; 
          height: 24px; 
          border-radius: 6px; 
          border: 3px solid white; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="14" height="14" fill="white" viewBox="0 0 20 20">
            <path d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z" />
            <path d="M8 11h4v2H8v-2z" />
            <path d="M10 9v4" stroke="white" stroke-width="1" />
          </svg>
        </div>
      `,
      className: 'pharmacy-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Default pharmacy location (replace with actual pharmacy coordinates)
    const pharmacyLat = 5.3456;
    const pharmacyLng = -4.0892;

    pharmacyMarkerRef.current = L.marker([pharmacyLat, pharmacyLng], { icon: pharmacyIcon })
      .addTo(map)
      .bindPopup('🏥 Pharmacie');
  }, [map]);

  // Simulate delivery person movement and add marker
  useEffect(() => {
    if (currentOrder?.status === 'in_delivery' && userLat && userLng && map) {
      const interval = setInterval(() => {
        // Simulate delivery person moving from pharmacy toward user
        const pharmacyLat = 5.3456;
        const pharmacyLng = -4.0892;
        
        // Calculate a position between pharmacy and user (moving towards user)
        const progress = Math.min(0.8, Math.random() * 0.9 + 0.1); // 10% to 80% of the way
        const newLat = pharmacyLat + (userLat - pharmacyLat) * progress;
        const newLng = pharmacyLng + (userLng - pharmacyLng) * progress;
        
        setDeliveryPersonLocation({ lat: newLat, lng: newLng });
        
        // Calculate estimated time based on distance
        const distance = calculateDistance(newLat, newLng, userLat, userLng);
        const estimatedMinutes = Math.max(1, Math.round(distance * 30)); // Assuming 2km per minute
        setEstimatedTime(estimatedMinutes);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [currentOrder?.status, userLat, userLng, map]);

  // Update delivery person marker
  useEffect(() => {
    if (!map || !deliveryPersonLocation) return;

    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.remove();
    }

    const deliveryIcon = L.divIcon({
      html: `
        <div style="
          background: #F97316; 
          width: 20px; 
          height: 20px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: bounce 1s infinite;
        ">
          <svg width="12" height="12" fill="white" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707L16 7.586A1 1 0 0015.414 7H14z" />
          </svg>
        </div>
      `,
      className: 'delivery-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    deliveryMarkerRef.current = L.marker([deliveryPersonLocation.lat, deliveryPersonLocation.lng], { icon: deliveryIcon })
      .addTo(map)
      .bindPopup(`🚚 Livreur - Arrivée: ${estimatedTime} min`);

    // Draw route from delivery person to user
    if (userLat && userLng && routePolylineRef.current) {
      routePolylineRef.current.remove();
    }

    if (userLat && userLng) {
      routePolylineRef.current = L.polyline([
        [deliveryPersonLocation.lat, deliveryPersonLocation.lng],
        [userLat, userLng]
      ], {
        color: '#F97316',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10'
      }).addTo(map);

      // Fit map to show all markers
      const group = new L.FeatureGroup([
        deliveryMarkerRef.current,
        userMarkerRef.current!,
        pharmacyMarkerRef.current!
      ]);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [map, deliveryPersonLocation, userLat, userLng, estimatedTime]);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Mutation to confirm delivery
  const confirmDeliveryMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest("POST", `/api/orders/${orderId}/confirm-delivery`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/current'] });
      toast({
        title: "Livraison confirmée",
        description: "Votre commande a été marquée comme livrée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de confirmer la livraison",
        variant: "destructive",
      });
    },
  });

  const handleConfirmDelivery = () => {
    if (currentOrder) {
      confirmDeliveryMutation.mutate(currentOrder.id);
    }
  };

  const goBack = () => {
    setLocation("/home");
  };

  const getStatusSteps = () => {
    const status = currentOrder?.status;
    const steps = [
      { 
        key: 'pending', 
        label: 'Commande confirmée', 
        time: currentOrder?.createdAt ? new Date(currentOrder.createdAt).toLocaleString('fr-FR') : "En attente", 
        completed: status !== 'pending' 
      },
      { 
        key: 'ready_for_delivery', 
        label: 'Préparation terminée', 
        time: status && ['ready_for_delivery', 'in_delivery', 'delivered'].includes(status) ? "Prêt pour livraison" : "En attente", 
        completed: status && ['ready_for_delivery', 'in_delivery', 'delivered'].includes(status) 
      },
      { 
        key: 'in_delivery', 
        label: 'En cours de livraison', 
        time: status === 'in_delivery' ? `Arrivée estimée: ${estimatedTime} min` : status === 'delivered' ? "Terminé" : "En attente", 
        completed: status && ['in_delivery', 'delivered'].includes(status),
        active: status === 'in_delivery'
      },
      { 
        key: 'delivered', 
        label: 'Livraison terminée', 
        time: status === 'delivered' ? "Confirmé" : "En attente de votre confirmation", 
        completed: status === 'delivered' 
      },
    ];
    return steps;
  };

  if (orderLoading) {
    return (
      <div className="min-h-screen bg-pharma-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-4 border-pharma-green border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-gray-600">Chargement des informations de livraison...</p>
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
            Suivi de livraison en temps réel
          </h1>
        </div>
      </header>

      {/* Delivery Status */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-r from-green-100 to-green-200 border-2 border-green-300 rounded-2xl p-4 mb-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold text-green-800" data-testid="text-delivery-status">
                {currentOrder?.status === 'in_delivery' ? '🚚 En cours de livraison' : 'Suivi de commande'}
              </h2>
              <p className="text-green-700 text-sm" data-testid="text-order-number">
                Commande #{currentOrder?.id.slice(0, 8) || 'PX2024001'}
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-600 text-white animate-pulse">
              🔴 LIVE
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-green-800 text-sm" data-testid="text-estimated-arrival">
              Arrivée estimée: {estimatedTime > 0 ? `${estimatedTime} minutes` : '15-20 minutes'}
            </span>
          </div>
        </div>

        {/* Interactive Leaflet Map */}
        <Card className="shadow-sm mb-4">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Carte de suivi GPS</h3>
            <div 
              ref={mapRef} 
              className="h-80 w-full rounded-lg border-2 border-gray-200 relative"
              style={{ minHeight: '320px' }}
            />
            
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Vous</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Livreur</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Pharmacie</span>
              </div>
            </div>
            
            <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
              <span>🔄 Mise à jour toutes les 3 secondes</span>
              <span>📍 Précision GPS: ±5 mètres</span>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Timeline */}
        <Card className="shadow-sm mb-4">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Statut de la commande</h3>
            <div className="space-y-3">
              {getStatusSteps().map((step, index) => (
                <div key={step.key} className="flex items-center space-x-3" data-testid={`step-${step.key}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    step.completed 
                      ? step.active 
                        ? 'bg-pharma-green animate-pulse' 
                        : 'bg-pharma-green'
                      : 'bg-gray-300'
                  }`}>
                    {step.completed ? (
                      step.active ? (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707L16 7.586A1 1 0 0015.414 7H14z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium text-sm ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.label}
                    </h4>
                    <p className={`text-xs ${step.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                      {step.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Confirmation Button */}
            {currentOrder?.status === 'in_delivery' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-800 text-sm">Confirmer la réception</h4>
                    <p className="text-xs text-green-700 mt-1">
                      Le livreur est arrivé ? Confirmez la réception
                    </p>
                  </div>
                  <Button
                    onClick={handleConfirmDelivery}
                    disabled={confirmDeliveryMutation.isPending}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {confirmDeliveryMutation.isPending ? 'Confirmation...' : 'Confirmer ✅'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Contact */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Contact livreur</h3>
            <div className="flex items-center space-x-3">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" 
                alt="Livreur" 
                className="w-10 h-10 rounded-full object-cover" 
                data-testid="img-delivery-person"
              />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm" data-testid="text-delivery-person-name">
                  {deliveryPerson?.firstName || 'Jean-Claude'} {deliveryPerson?.lastName || 'K.'}
                </h4>
                <p className="text-gray-600 text-xs">Livreur agréé</p>
                {deliveryPersonLocation && (
                  <p className="text-xs text-gray-500">
                    📍 Position: {deliveryPersonLocation.lat.toFixed(4)}, {deliveryPersonLocation.lng.toFixed(4)}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  size="icon"
                  className="w-8 h-8 bg-green-100 rounded-full hover:bg-green-200"
                  data-testid="button-call-delivery-person"
                >
                  <svg className="w-4 h-4 text-pharma-green" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </Button>
                <Button
                  size="icon"
                  className="w-8 h-8 bg-blue-100 rounded-full hover:bg-blue-200"
                  data-testid="button-message-delivery-person"
                >
                  <svg className="w-4 h-4 text-pharma-blue" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation currentPage="delivery" />
    </div>
  );
}
