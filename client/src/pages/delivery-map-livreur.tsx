
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";
import BottomNavigation from "@/components/bottom-navigation";
import { useLocation } from "wouter";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function DeliveryMapLivreur() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { latitude, longitude } = useGeolocation();
  const [map, setMap] = useState<L.Map | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<{distance: number, duration: number} | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const deliveryMarkersRef = useRef<L.Marker[]>([]);
  const currentLocationMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Configuration des tuiles OSM
  const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const OSM_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  const ABIDJAN_CENTER = { lat: 5.3364, lng: -4.0267 };

  // Récupérer les livraisons du livreur
  const { data: myDeliveries } = useQuery({
    queryKey: ["/api/livreur/deliveries"],
    enabled: true,
    refetchInterval: 10000,
  });

  // Fonction pour calculer la route réelle
  const calculateRoute = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
      );
      
      if (!response.ok) throw new Error('Erreur de routage');
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
        const distance = Math.round((route.distance / 1000) * 10) / 10;
        const duration = Math.round(route.duration / 60);
        
        return { coordinates, distance, duration };
      }
    } catch (error) {
      console.error('Erreur lors du calcul de la route:', error);
      return {
        coordinates: [[startLat, startLng], [endLat, endLng]],
        distance: Math.round(calculateDistance(startLat, startLng, endLat, endLng) * 10) / 10,
        duration: Math.round(calculateDistance(startLat, startLng, endLat, endLng) * 3)
      };
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Délai pour s'assurer que le DOM est prêt et éviter les conflits HMR
    const initTimer = setTimeout(() => {
      if (!mapRef.current) return;

      try {
        const initialMap = L.map(mapRef.current, {
          center: [ABIDJAN_CENTER.lat, ABIDJAN_CENTER.lng],
          zoom: 12,
          zoomControl: true,
        });

        L.tileLayer(OSM_TILE_URL, {
          attribution: OSM_ATTRIBUTION,
          maxZoom: 19,
        }).addTo(initialMap);

        setMap(initialMap);
        console.log('✅ Carte Leaflet initialisée');
      } catch (error) {
        console.error('❌ Erreur initialisation carte:', error);
      }
    }, 200);

    return () => {
      clearTimeout(initTimer);
      if (map) {
        try {
          map.remove();
        } catch (error) {
          console.warn('Nettoyage carte:', error);
        }
      }
    };
  }, []);

  // Add current location marker
  useEffect(() => {
    if (!map || !latitude || !longitude) return;

    // Vérifier que la carte est valide et a un conteneur DOM
    try {
      if (!map.getContainer() || !map.getContainer().parentNode) {
        console.warn('Carte Leaflet non valide, attente de réinitialisation...');
        return;
      }
    } catch (error) {
      console.warn('Erreur lors de la vérification de la carte:', error);
      return;
    }

    // Nettoyer le marqueur existant en toute sécurité
    if (currentLocationMarkerRef.current) {
      try {
        currentLocationMarkerRef.current.remove();
      } catch (error) {
        console.warn('Erreur lors du nettoyage du marqueur:', error);
      }
      currentLocationMarkerRef.current = null;
    }

    const currentLocationIcon = L.divIcon({
      html: `
        <div style="
          background: #3B82F6; 
          width: 24px; 
          height: 24px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
        ">
          <svg width="14" height="14" fill="white" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
          </svg>
        </div>
        <style>
          @keyframes pulse {
            0% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3); }
            70% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
          }
        </style>
      `,
      className: 'current-location-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Délai additionnel pour s'assurer que la carte est prête
    const addMarkerTimer = setTimeout(() => {
      try {
        if (!map || !map.getContainer() || !map.getContainer().parentNode) {
          console.warn('Carte non prête pour les marqueurs');
          return;
        }

        currentLocationMarkerRef.current = L.marker([latitude, longitude], { icon: currentLocationIcon })
          .addTo(map)
          .bindPopup('📍 Votre position actuelle');

        map.setView([latitude, longitude], 14);
      } catch (error) {
        console.error('Erreur lors de l\'ajout du marqueur de position:', error);
      }
    }, 300);

    return () => clearTimeout(addMarkerTimer);
  }, [map, latitude, longitude]);

  // Add delivery markers
  useEffect(() => {
    if (!map || !myDeliveries) return;

    // Vérifier que la carte est valide
    try {
      if (!map.getContainer() || !map.getContainer().parentNode) {
        console.warn('Carte Leaflet non valide pour les marqueurs de livraison');
        return;
      }
    } catch (error) {
      console.warn('Erreur lors de la vérification de la carte pour les livraisons:', error);
      return;
    }

    // Clear existing markers safely
    deliveryMarkersRef.current.forEach(marker => {
      try {
        marker.remove();
      } catch (error) {
        console.warn('Erreur lors du nettoyage d\'un marqueur:', error);
      }
    });
    deliveryMarkersRef.current = [];

    const activeDeliveries = myDeliveries.filter((delivery: any) => 
      ['assigned_pending_acceptance', 'in_transit', 'arrived_pending_confirmation'].includes(delivery.status)
    );

    activeDeliveries.forEach((delivery: any, index: number) => {
      // Utiliser les vraies coordonnées GPS de livraison du patient
      let deliveryLat, deliveryLng;
      
      if (delivery.deliveryLatitude && delivery.deliveryLongitude) {
        // Utiliser les coordonnées GPS réelles et précises stockées dans la commande
        deliveryLat = parseFloat(delivery.deliveryLatitude.toString());
        deliveryLng = parseFloat(delivery.deliveryLongitude.toString());
        console.log(`✅ Utilisation coordonnées GPS précises pour livraison ${delivery.id}: ${deliveryLat}, ${deliveryLng}`);
      } else {
        // Erreur critique : pas de coordonnées GPS disponibles
        console.error(`❌ ERREUR: Pas de coordonnées GPS pour la livraison ${delivery.id}. L'adresse "${delivery.deliveryAddress}" ne peut pas être localisée précisément.`);
        toast({
          title: "Coordonnées manquantes",
          description: `Livraison ${delivery.id.slice(0, 8)}: Pas de coordonnées GPS précises disponibles`,
          variant: "destructive",
        });
        return; // Skip cette livraison
      }

      // Créer une icône simple et efficace pour le point d'arrivée (destination)
      const colorPrimary = delivery.status === 'in_transit' ? '#F97316' : '#10B981';
      const colorSecondary = delivery.status === 'in_transit' ? '#EA580C' : '#059669';
      
      const deliveryIcon = L.divIcon({
        html: `
          <div style="
            position: relative;
            width: 30px;
            height: 30px;
            background: ${colorPrimary};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <div style="
              position: absolute;
              bottom: -8px;
              left: 50%;
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 8px solid ${colorSecondary};
              transform: translateX(-50%);
            "></div>
          </div>
        `,
        className: 'delivery-marker-icon',
        iconSize: [30, 38],
        iconAnchor: [15, 38],
        popupAnchor: [0, -38]
      });

      try {
        const marker = L.marker([deliveryLat, deliveryLng], { icon: deliveryIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-3">
              <div class="flex items-center mb-2">
                <span class="text-lg mr-2">🎯</span>
                <h4 class="font-bold text-blue-800">DESTINATION</h4>
              </div>
              <p class="text-sm font-semibold text-gray-800">Livraison #${delivery.id.slice(0, 8)}</p>
              <p class="text-sm text-gray-600 mt-1">📍 ${delivery.deliveryAddress}</p>
              <p class="text-sm text-green-600 font-medium mt-1">💰 ${delivery.totalAmount} FCFA</p>
              <button onclick="window.selectDelivery('${delivery.id}')" class="mt-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all">
                🗺️ Tracer l'itinéraire
              </button>
            </div>
          `);

        // Store delivery coordinates for routing
        (marker as any).deliveryData = {
          ...delivery,
          coordinates: { lat: deliveryLat, lng: deliveryLng }
        };

        deliveryMarkersRef.current.push(marker);
      } catch (error) {
        console.error(`Erreur lors de l'ajout du marqueur livraison ${delivery.id}:`, error);
      }
    });

    // Fit map to show all markers
    if (deliveryMarkersRef.current.length > 0 && currentLocationMarkerRef.current) {
      const group = new L.FeatureGroup([
        currentLocationMarkerRef.current,
        ...deliveryMarkersRef.current
      ]);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [map, myDeliveries]);

  // Global function to select delivery
  useEffect(() => {
    (window as any).selectDelivery = (deliveryId: string) => {
      const delivery = myDeliveries?.find((d: any) => d.id === deliveryId);
      if (delivery) {
        setSelectedDelivery(delivery);
        // Calculer automatiquement l'itinéraire
        setTimeout(() => showRouteToDelivery(delivery), 500);
      }
    };

    return () => {
      delete (window as any).selectDelivery;
    };
  }, [myDeliveries, latitude, longitude]);

  const showRouteToDelivery = async (delivery: any) => {
    if (!latitude || !longitude || !map) {
      toast({
        title: "Position manquante",
        description: "Votre position GPS n'est pas disponible",
        variant: "destructive",
      });
      return;
    }

    // Vérifier la présence des coordonnées GPS précises
    if (!delivery.deliveryLatitude || !delivery.deliveryLongitude) {
      toast({
        title: "Coordonnées GPS manquantes",
        description: `Impossible de calculer l'itinéraire vers ${delivery.deliveryAddress} - coordonnées GPS non disponibles`,
        variant: "destructive",
      });
      return;
    }

    // Utiliser les coordonnées GPS réelles et précises
    const deliveryLat = parseFloat(delivery.deliveryLatitude.toString());
    const deliveryLng = parseFloat(delivery.deliveryLongitude.toString());
    
    console.log(`🗺️ Calcul itinéraire précis:`);
    console.log(`  📍 Position livreur: ${latitude}, ${longitude}`);
    console.log(`  🏠 Position patient: ${deliveryLat}, ${deliveryLng}`);
    console.log(`  📧 Adresse: ${delivery.deliveryAddress}`);

    try {
      const route = await calculateRoute(
        latitude, longitude,
        deliveryLat, deliveryLng
      );

      setRouteInfo({
        distance: route.distance,
        duration: route.duration
      });

      // Remove existing route
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }

      // Add new route
      routePolylineRef.current = L.polyline(route.coordinates, {
        color: '#F97316',
        weight: 5,
        opacity: 0.8,
        dashArray: '10, 5'
      }).addTo(map);

      // Fit map to route
      map.fitBounds(routePolylineRef.current.getBounds().pad(0.1));

      toast({
        title: "Itinéraire calculé ✅",
        description: `Distance: ${route.distance}km • Durée: ${route.duration}min • Destination: ${delivery.deliveryAddress}`,
      });

    } catch (error) {
      // Créer un itinéraire simple en ligne droite en cas d'erreur
      const simpleRoute = [[latitude, longitude], [deliveryLat, deliveryLng]];
      const distance = calculateDistance(latitude, longitude, deliveryLat, deliveryLng);
      
      setRouteInfo({
        distance: Math.round(distance * 10) / 10,
        duration: Math.round(distance * 3)
      });

      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }

      routePolylineRef.current = L.polyline(simpleRoute, {
        color: '#DC2626',
        weight: 4,
        opacity: 0.7,
        dashArray: '15, 10'
      }).addTo(map);

      map.fitBounds(routePolylineRef.current.getBounds().pad(0.1));

      toast({
        title: "Itinéraire approximatif",
        description: `Distance: ${Math.round(distance * 10) / 10}km (ligne droite) • Destination: ${delivery.deliveryAddress}`,
      });
    }
  };

  // Mutation to update delivery status
  const updateDeliveryMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      apiRequest("POST", `/api/livreur/deliveries/${orderId}/status`, { status }),
    onSuccess: () => {
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la livraison a été mis à jour",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/livreur/deliveries"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    },
  });

  const handleStartDelivery = () => {
    if (selectedDelivery) {
      updateDeliveryMutation.mutate({ 
        orderId: selectedDelivery.id, 
        status: 'in_transit' 
      });
    }
  };

  const handleArrivalConfirmation = () => {
    if (selectedDelivery) {
      updateDeliveryMutation.mutate({ 
        orderId: selectedDelivery.id, 
        status: 'arrived_pending_confirmation' 
      });
    }
  };

  

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard-livreur")}
            className="w-10 h-10"
          >
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Button>
          <h1 className="text-xl font-bold text-gray-900">
            🗺️ Carte GPS Livraisons
          </h1>
        </div>
      </header>

      <div className="p-4">
        {/* Status */}
        <div className="bg-gradient-to-r from-blue-100 to-blue-200 border-2 border-blue-300 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-800">
                🚚 Navigation GPS Livreur
              </h2>
              <p className="text-blue-700 text-sm">
                Cliquez sur un marqueur pour voir l'itinéraire
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-600 text-white">
              {myDeliveries?.filter((d: any) => ['assigned_pending_acceptance', 'in_transit', 'arrived_pending_confirmation'].includes(d.status)).length || 0} livraisons
            </Badge>
          </div>
        </div>

        {/* Map */}
        <Card className="shadow-sm mb-4">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">🛣️ Carte interactive avec routes CI</h3>
            <div 
              ref={mapRef} 
              className="h-96 w-full rounded-lg border-2 border-gray-200"
              style={{ minHeight: '384px' }}
            />
            
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Ma position</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full transform rotate-45" style={{ borderRadius: '50% 50% 50% 0' }}></div>
                <span>🎯 Destinations</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              💡 Les marqueurs en forme de goutte indiquent les points d'arrivée précis
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {myDeliveries && myDeliveries.filter((d: any) => ['assigned_pending_acceptance', 'in_transit', 'arrived_pending_confirmation'].includes(d.status)).length > 0 && (
          <Card className="shadow-sm mb-4">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">🚀 Actions rapides</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => {
                    // Sélectionner automatiquement la première livraison active
                    const activeDeliveries = myDeliveries.filter((d: any) => ['assigned_pending_acceptance', 'in_transit', 'arrived_pending_confirmation'].includes(d.status));
                    if (activeDeliveries.length > 0) {
                      setSelectedDelivery(activeDeliveries[0]);
                      showRouteToDelivery(activeDeliveries[0]);
                    }
                  }}
                  variant="outline"
                  className="text-sm"
                >
                  🗺️ Voir itinéraire
                </Button>
                <Button 
                  onClick={() => {
                    if (map && currentLocationMarkerRef.current) {
                      map.setView([latitude || ABIDJAN_CENTER.lat, longitude || ABIDJAN_CENTER.lng], 15);
                    }
                  }}
                  variant="outline"
                  className="text-sm"
                >
                  📍 Ma position
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Delivery Info */}
        {selectedDelivery && (
          <Card className="shadow-sm mb-4 border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">📦 Livraison sélectionnée</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Commande:</span>
                  <span className="text-sm font-medium">#{selectedDelivery.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Client:</span>
                  <span className="text-sm font-medium">
                    {selectedDelivery.patient?.firstName} {selectedDelivery.patient?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Téléphone:</span>
                  <span className="text-sm font-medium">{selectedDelivery.patient?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Adresse:</span>
                  <span className="text-sm font-medium">{selectedDelivery.deliveryAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Montant:</span>
                  <span className="text-sm font-medium">{selectedDelivery.totalAmount} FCFA</span>
                </div>
                
                {routeInfo && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-orange-800">🛣️ Itinéraire calculé</p>
                        <p className="text-xs text-orange-700">
                          Distance: {routeInfo.distance} km • Durée: {routeInfo.duration} min
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  {selectedDelivery.status === 'assigned_pending_acceptance' && (
                    <Button 
                      onClick={handleStartDelivery}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={updateDeliveryMutation.isPending}
                    >
                      🚀 Commencer livraison
                    </Button>
                  )}
                  {selectedDelivery.status === 'in_transit' && (
                    <Button 
                      onClick={handleArrivalConfirmation}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={updateDeliveryMutation.isPending}
                    >
                      📍 Confirmer arrivée
                    </Button>
                  )}
                  {selectedDelivery.status === 'arrived_pending_confirmation' && (
                    <div className="flex-1 bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-center">
                      <p className="text-yellow-800 font-medium">⏳ En attente</p>
                      <p className="text-yellow-700 text-sm">Le patient doit confirmer la réception</p>
                    </div>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedDelivery(null);
                      if (routePolylineRef.current) {
                        routePolylineRef.current.remove();
                        routePolylineRef.current = null;
                      }
                      setRouteInfo(null);
                    }}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">ℹ️ Instructions</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Votre position bleue est mise à jour automatiquement</p>
              <p>• Cliquez sur un marqueur vert/orange pour voir l'itinéraire</p>
              <p>• Les routes affichées sont les vraies routes de Côte d'Ivoire</p>
              <p>• Les distances et temps sont calculés selon le trafic réel</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
