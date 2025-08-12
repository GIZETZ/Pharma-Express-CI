
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/bottom-navigation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useState, useEffect } from "react";
import type { Order, DeliveryPerson } from "@shared/schema";

export default function DeliveryTracking() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { latitude: userLat, longitude: userLng } = useGeolocation();
  const [deliveryPersonLocation, setDeliveryPersonLocation] = useState<{lat: number, lng: number} | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);

  // Get current order being tracked
  const { data: currentOrder, isLoading: orderLoading } = useQuery<Order>({
    queryKey: ['/api/orders/current'],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time tracking
  });

  const { data: deliveryPerson } = useQuery<DeliveryPerson>({
    queryKey: ['/api/delivery-persons', currentOrder?.deliveryPersonId],
    enabled: !!currentOrder?.deliveryPersonId,
  });

  // Simulate delivery person location updates (in real app, this would come from GPS)
  useEffect(() => {
    if (currentOrder?.status === 'in_delivery' && userLat && userLng) {
      const interval = setInterval(() => {
        // Simulate delivery person moving closer to patient
        const randomOffset = 0.001;
        const newLat = userLat + (Math.random() - 0.5) * randomOffset;
        const newLng = userLng + (Math.random() - 0.5) * randomOffset;
        
        setDeliveryPersonLocation({ lat: newLat, lng: newLng });
        
        // Calculate estimated time based on distance
        const distance = calculateDistance(newLat, newLng, userLat, userLng);
        const estimatedMinutes = Math.max(1, Math.round(distance * 60)); // Assuming 1km per minute
        setEstimatedTime(estimatedMinutes);
      }, 3000); // Update every 3 seconds

      return () => clearInterval(interval);
    }
  }, [currentOrder?.status, userLat, userLng]);

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
            Suivi de livraison
          </h1>
        </div>
      </header>

      {/* Delivery Status */}
      <div className="px-4 py-6">
        <div className="bg-gradient-to-r from-pharma-green to-green-400 rounded-2xl p-6 text-white mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white drop-shadow-sm" data-testid="text-delivery-status">
                {currentOrder?.status === 'in_delivery' ? 'En cours de livraison' : 'Suivi de commande'}
              </h2>
              <p className="text-white/90 drop-shadow-sm" data-testid="text-order-number">
                Commande #{currentOrder?.id.slice(0, 8) || 'PX2024001'}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center shadow-inner">
              <svg className="w-8 h-8 text-white drop-shadow-sm delivery-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707L16 7.586A1 1 0 0015.414 7H14z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-white/90 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-white drop-shadow-sm" data-testid="text-estimated-arrival">
              Arrivée estimée: {estimatedTime > 0 ? `${estimatedTime} minutes` : '15-20 minutes'}
            </span>
          </div>
        </div>

        {/* Interactive Delivery Map */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Carte de suivi en temps réel</h3>
            <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg h-64 overflow-hidden border-2 border-gray-200">
              {/* Map Background with Grid */}
              <div className="absolute inset-0 opacity-10">
                <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className="border border-gray-300"></div>
                  ))}
                </div>
              </div>

              {/* Street Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,20 Q30,15 60,25 T100,20" stroke="#e5e7eb" strokeWidth="0.5" fill="none" />
                <path d="M0,40 L100,45" stroke="#e5e7eb" strokeWidth="0.3" fill="none" />
                <path d="M0,70 Q25,65 50,75 T100,70" stroke="#e5e7eb" strokeWidth="0.4" fill="none" />
                <path d="M20,0 L25,100" stroke="#e5e7eb" strokeWidth="0.3" fill="none" />
                <path d="M50,0 Q48,30 52,60 T50,100" stroke="#e5e7eb" strokeWidth="0.4" fill="none" />
                <path d="M80,0 L75,100" stroke="#e5e7eb" strokeWidth="0.3" fill="none" />
              </svg>

              {/* Patient Location (Fixed) */}
              {userLat && userLng && (
                <div className="absolute bottom-4 right-4 flex flex-col items-center">
                  <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-pulse">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 mt-1 bg-white px-2 py-1 rounded shadow">Vous</span>
                </div>
              )}

              {/* Pharmacy Location */}
              <div className="absolute top-4 left-4 flex flex-col items-center">
                <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z" />
                    <path d="M8 11h4v2H8v-2z" />
                    <path d="M10 9v4" stroke="white" strokeWidth="1" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-green-600 mt-1 bg-white px-2 py-1 rounded shadow">Pharmacie</span>
              </div>

              {/* Delivery Person Location (Moving) */}
              {deliveryPersonLocation && currentOrder?.status === 'in_delivery' && (
                <div 
                  className="absolute transition-all duration-3000 ease-linear flex flex-col items-center"
                  style={{
                    left: `${30 + (deliveryPersonLocation.lat - (userLat || 0)) * 2000}%`,
                    top: `${50 + (deliveryPersonLocation.lng - (userLng || 0)) * 2000}%`,
                  }}
                >
                  <div className="w-6 h-6 bg-orange-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-bounce">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707L16 7.586A1 1 0 0015.414 7H14z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-orange-600 mt-1 bg-white px-2 py-1 rounded shadow">Livreur</span>
                </div>
              )}

              {/* Route Line */}
              {deliveryPersonLocation && userLat && userLng && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{stopColor:'#f97316', stopOpacity:1}} />
                      <stop offset="100%" style={{stopColor:'#3b82f6', stopOpacity:1}} />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M ${30 + (deliveryPersonLocation.lat - userLat) * 2000} ${50 + (deliveryPersonLocation.lng - userLng) * 2000} 
                        Q ${65} ${40} 
                        ${85} ${75}`}
                    stroke="url(#routeGradient)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    fill="none"
                    className="animate-pulse"
                  />
                </svg>
              )}

              {/* Real-time coordinates display */}
              {deliveryPersonLocation && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs p-2 rounded">
                  <div>Livreur: {deliveryPersonLocation.lat.toFixed(4)}, {deliveryPersonLocation.lng.toFixed(4)}</div>
                  {userLat && userLng && (
                    <div>Vous: {userLat.toFixed(4)}, {userLng.toFixed(4)}</div>
                  )}
                  <div className="text-orange-300">Distance: {deliveryPersonLocation && userLat && userLng ? 
                    `${calculateDistance(deliveryPersonLocation.lat, deliveryPersonLocation.lng, userLat, userLng).toFixed(2)} km` : 'Calcul...'}</div>
                </div>
              )}

              {/* Status indicator */}
              <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold animate-pulse">
                🔴 EN DIRECT
              </div>
            </div>
            
            <div className="mt-3 flex justify-between items-center text-sm text-gray-600">
              <span>🔄 Mise à jour automatique toutes les 3 secondes</span>
              <span>📍 Précision GPS: ±5 mètres</span>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Timeline */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Statut de la commande</h3>
            <div className="space-y-4">
              {getStatusSteps().map((step, index) => (
                <div key={step.key} className="flex items-center space-x-4" data-testid={`step-${step.key}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? step.active 
                        ? 'bg-pharma-green animate-pulse' 
                        : 'bg-pharma-green'
                      : 'bg-gray-300'
                  }`}>
                    {step.completed ? (
                      step.active ? (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707L16 7.586A1 1 0 0015.414 7H14z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )
                    ) : (
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.label}
                    </h4>
                    <p className={`text-sm ${step.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                      {step.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Confirmation Button for Patient */}
            {currentOrder?.status === 'in_delivery' && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-800">Confirmer la réception</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Le livreur est arrivé ? Confirmez la réception de votre commande
                    </p>
                  </div>
                  <Button
                    onClick={handleConfirmDelivery}
                    disabled={confirmDeliveryMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {confirmDeliveryMutation.isPending ? 'Confirmation...' : 'Confirmer la livraison ✅'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Contact */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Contact livreur</h3>
            <div className="flex items-center space-x-4">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" 
                alt="Livreur" 
                className="w-12 h-12 rounded-full object-cover" 
                data-testid="img-delivery-person"
              />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900" data-testid="text-delivery-person-name">
                  {deliveryPerson?.firstName || 'Jean-Claude'} {deliveryPerson?.lastName || 'K.'}
                </h4>
                <p className="text-gray-600 text-sm">Livreur agréé</p>
                {deliveryPersonLocation && (
                  <p className="text-xs text-gray-500">
                    📍 Position: {deliveryPersonLocation.lat.toFixed(4)}, {deliveryPersonLocation.lng.toFixed(4)}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  size="icon"
                  className="w-10 h-10 bg-green-100 rounded-full hover:bg-green-200"
                  data-testid="button-call-delivery-person"
                >
                  <svg className="w-5 h-5 text-pharma-green" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </Button>
                <Button
                  size="icon"
                  className="w-10 h-10 bg-blue-100 rounded-full hover:bg-blue-200"
                  data-testid="button-message-delivery-person"
                >
                  <svg className="w-5 h-5 text-pharma-blue" fill="currentColor" viewBox="0 0 20 20">
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
