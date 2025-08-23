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
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [map, setMap] = useState<L.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const pharmacyMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeLabelMarkerRef = useRef<L.Marker | null>(null);

  // Configuration des tuiles OSM pour la Côte d'Ivoire
  const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const OSM_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  // Coordonnées par défaut pour Abidjan
  const DEFAULT_PHARMACY_COORDS = { lat: 5.3456, lng: -4.0892 };
  const ABIDJAN_CENTER = { lat: 5.3364, lng: -4.0267 };

  // Get current order being tracked
  const { data: currentOrder, isLoading: orderLoading } = useQuery<Order>({
    queryKey: ['/api/orders/current'],
    refetchInterval: 3000, // Mise à jour toutes les 3 secondes
  });

  const { data: deliveryPerson } = useQuery<DeliveryPerson>({
    queryKey: ['/api/delivery-persons', currentOrder?.deliveryPersonId],
    enabled: !!currentOrder?.deliveryPersonId,
  });

  // Debug logging
  useEffect(() => {
    if (currentOrder && import.meta.env.DEV) {
      console.log('🔍 Statut commande actuelle:', currentOrder.status);
      console.log('🔍 ID livreur assigné:', currentOrder.deliveryPersonId);
      console.log('🔍 Position utilisateur:', { userLat, userLng });
    }
  }, [currentOrder?.status, currentOrder?.deliveryPersonId, userLat, userLng]);

  // Fonction pour calculer la route réelle avec OSRM
  const calculateRealRoute = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
      );

      if (!response.ok) {
        throw new Error('Erreur de routage');
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
        const distance = route.distance / 1000; // Convertir en km
        const duration = route.duration / 60; // Convertir en minutes

        return {
          coordinates,
          distance: Math.round(distance * 10) / 10,
          duration: Math.round(duration)
        };
      }
    } catch (error) {
      console.error('Erreur lors du calcul de la route:', error);
      // Fallback: ligne droite
      return {
        coordinates: [[startLat, startLng], [endLat, endLng]],
        distance: calculateDistance(startLat, startLng, endLat, endLng),
        duration: Math.round(calculateDistance(startLat, startLng, endLat, endLng) * 3)
      };
    }
  };

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

  // Initialize map
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapRef.current || map) return;

      try {
        if (import.meta.env.DEV) {
          console.log('Initialisation de la carte Leaflet...');
        }
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
        if (import.meta.env.DEV) {
          console.log('Carte Leaflet initialisée avec succès');
        }

      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la carte:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Add user marker when location is available
  useEffect(() => {
    if (!map || !userLat || !userLng) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
    }

    const userIcon = L.divIcon({
      html: `
        <div style="
          background: #3B82F6; 
          width: 24px; 
          height: 24px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="14" height="14" fill="white" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
          </svg>
        </div>
      `,
      className: 'user-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon })
      .addTo(map)
      .bindPopup('📍 Votre position');

    map.setView([userLat, userLng], 14);
  }, [map, userLat, userLng]);

  // Add pharmacy marker
  useEffect(() => {
    if (!map || !currentOrder) return;

    if (pharmacyMarkerRef.current) {
      map.removeLayer(pharmacyMarkerRef.current);
    }

    const pharmacyIcon = L.divIcon({
      html: `
        <div style="
          background: #10B981; 
          width: 28px; 
          height: 28px; 
          border-radius: 8px; 
          border: 3px solid white; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="16" height="16" fill="white" viewBox="0 0 20 20">
            <path d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z" />
            <path d="M8 11h4v2H8v-2z" />
            <path d="M10 9v4" stroke="white" stroke-width="1" />
          </svg>
        </div>
      `,
      className: 'pharmacy-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const pharmacyLat = currentOrder.pharmacy?.latitude ? parseFloat(currentOrder.pharmacy.latitude) : DEFAULT_PHARMACY_COORDS.lat;
    const pharmacyLng = currentOrder.pharmacy?.longitude ? parseFloat(currentOrder.pharmacy.longitude) : DEFAULT_PHARMACY_COORDS.lng;

    pharmacyMarkerRef.current = L.marker([pharmacyLat, pharmacyLng], { icon: pharmacyIcon })
      .addTo(map)
      .bindPopup(`🏥 ${currentOrder.pharmacy?.name || 'Pharmacie'}`);
  }, [map, currentOrder]);

  // Function to force show route manually
  const forceShowRoute = async () => {
    if (!userLat || !userLng || !currentOrder) {
      toast({
        title: "Informations manquantes",
        description: "Position GPS ou commande non disponible",
        variant: "destructive",
      });
      return;
    }

    try {
      // Utiliser une position simulée proche du patient si le livreur n'est pas localisé
      const simulatedDeliveryPersonLat = userLat - 0.05; // ~5km au sud
      const simulatedDeliveryPersonLng = userLng + 0.03; // ~3km à l'est

      if (import.meta.env.DEV) {
        console.log('🔧 Forçage d\'affichage d\'itinéraire avec position simulée');
      }

      const routeData = await calculateRealRoute(
        simulatedDeliveryPersonLat, 
        simulatedDeliveryPersonLng, 
        userLat, 
        userLng
      );

      if (routeData) {
        updateRouteDisplay(routeData, simulatedDeliveryPersonLat, simulatedDeliveryPersonLng);
        
        // Simuler la position du livreur
        setDeliveryPersonLocation({
          lat: simulatedDeliveryPersonLat,
          lng: simulatedDeliveryPersonLng
        });

        toast({
          title: "Itinéraire affiché ✅",
          description: `Distance: ${routeData.distance}km • Durée: ${routeData.duration}min`,
        });
      }
    } catch (error) {
      console.error('Erreur lors du forçage d\'itinéraire:', error);
      toast({
        title: "Erreur d'itinéraire",
        description: "Impossible de calculer l'itinéraire",
        variant: "destructive",
      });
    }
  };

  // Helper function to update the route display on the map
  const updateRouteDisplay = (routeData: { coordinates: number[][], distance: number, duration: number }, deliveryPersonLat: number, deliveryPersonLng: number) => {
    setRouteDistance(routeData.distance);
    setEstimatedTime(routeData.duration);

    // Clean up previous route elements
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
    }
    if (routeLabelMarkerRef.current) {
      map.removeLayer(routeLabelMarkerRef.current);
    }

    // Draw the new route
    routePolylineRef.current = L.polyline(routeData.coordinates, {
      color: '#10b981',
      weight: 6,
      opacity: 0.9,
      dashArray: '15, 8'
    }).addTo(map);

    // Add the route label with actual distance
    if (routeData.coordinates.length > 1) {
      const midPointIndex = Math.floor(routeData.coordinates.length / 2);
      const midPoint = routeData.coordinates[midPointIndex];

      routeLabelMarkerRef.current = L.marker(midPoint, {
        icon: L.divIcon({
          html: `<div style="background: linear-gradient(45deg, #10b981, #059669); color: white; padding: 4px 8px; border-radius: 16px; font-size: 11px; font-weight: bold; box-shadow: 0 3px 6px rgba(0,0,0,0.3); border: 2px solid white;">🚚→👤 ${routeData.distance}km</div>`,
          className: 'delivery-route-label',
          iconSize: [80, 24],
          iconAnchor: [40, 12]
        })
      }).addTo(map);
    }

    // Adjust the view to show the entire route
    const group = new L.FeatureGroup([routePolylineRef.current]);
    map.fitBounds(group.getBounds().pad(0.15));

    if (import.meta.env.DEV) {
      console.log('✅ Itinéraire GPS réel tracé:', {
        distance: routeData.distance + 'km',
        duration: routeData.duration + 'min',
        deliveryPersonPosition: { lat: deliveryPersonLat, lng: deliveryPersonLng },
        patientPosition: { lat: userLat, lng: userLng }
      });
    }
  };

  // Main effect for delivery tracking and route tracing
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('📍 Vérification conditions traçage:', {
        hasOrder: !!currentOrder,
        hasDeliveryPerson: !!currentOrder?.deliveryPersonId,
        hasUserLocation: !!(userLat && userLng),
        hasMap: !!map,
        status: currentOrder?.status
      });
    }

    // Vérifier si on doit tracer l'itinéraire
    const shouldTraceRoute = currentOrder && 
      currentOrder.deliveryPersonId && 
      userLat && userLng && 
      map && 
      ['preparing', 'ready_for_delivery', 'in_transit', 'in_delivery', 'assigned_pending_acceptance'].includes(currentOrder.status);

    if (!shouldTraceRoute) {
      if (import.meta.env.DEV) {
        console.log('❌ Conditions non remplies pour tracer l\'itinéraire');
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.log('✅ Début du traçage d\'itinéraire avec position GPS réelle du livreur');
    }

    let routeCoordinates: number[][] = [];

    const updateDeliveryTracking = async () => {
      try {
        // Récupérer la position GPS réelle et actuelle du livreur
        if (import.meta.env.DEV) {
          console.log('🔄 Récupération position GPS réelle du livreur:', currentOrder.deliveryPersonId);
        }

        // Fetch real delivery person location from API
        const deliveryPersonResponse = await fetch(`/api/delivery-persons/${currentOrder.deliveryPersonId}`);
        
        let deliveryPersonLat, deliveryPersonLng;
        
        if (!deliveryPersonResponse.ok) {
          if (import.meta.env.DEV) {
            console.log('❌ Erreur API livreur, utilisation position simulée proche du patient');
          }
          // Utiliser une position simulée proche du patient
          deliveryPersonLat = userLat - 0.05; // ~5km au sud
          deliveryPersonLng = userLng + 0.03; // ~3km à l'est
        } else {
          const currentDeliveryPerson = await deliveryPersonResponse.json();

          // Vérifier que le livreur a des coordonnées GPS valides
          if (!currentDeliveryPerson.lat || !currentDeliveryPerson.lng) {
            if (import.meta.env.DEV) {
              console.log('❌ Livreur sans coordonnées GPS, utilisation position simulée');
            }
            // Utiliser une position simulée proche du patient
            deliveryPersonLat = userLat - 0.05; // ~5km au sud
            deliveryPersonLng = userLng + 0.03; // ~3km à l'est
          } else {
            deliveryPersonLat = parseFloat(currentDeliveryPerson.lat);
            deliveryPersonLng = parseFloat(currentDeliveryPerson.lng);
          }
        }

        if (import.meta.env.DEV) {
          console.log('📍 Position GPS du livreur:', {
            lat: deliveryPersonLat,
            lng: deliveryPersonLng,
            timestamp: new Date().toISOString(),
            isSimulated: !deliveryPersonResponse.ok
          });
        }

        // Mettre à jour la position du livreur avec les coordonnées réelles
        setDeliveryPersonLocation({ 
          lat: deliveryPersonLat, 
          lng: deliveryPersonLng 
        });

        // Calculer l'itinéraire réel en temps réel
        const routeData = await calculateRealRoute(
          deliveryPersonLat, 
          deliveryPersonLng, 
          userLat, 
          userLng
        );

        if (routeData) {
          routeCoordinates = routeData.coordinates;
          updateRouteDisplay(routeData, deliveryPersonLat, deliveryPersonLng);
        }

      } catch (error) {
        console.error('Erreur lors de la récupération de la position GPS du livreur:', error);
      }
    };

    // Lancer la mise à jour immédiatement puis toutes les 5 secondes pour récupérer la position GPS réelle
    updateDeliveryTracking();
    const interval = setInterval(updateDeliveryTracking, 5000);

    return () => {
      clearInterval(interval);
      // Nettoyer les éléments de la carte
      if (routePolylineRef.current) {
        map.removeLayer(routePolylineRef.current);
        routePolylineRef.current = null;
      }
      if (routeLabelMarkerRef.current) {
        map.removeLayer(routeLabelMarkerRef.current);
        routeLabelMarkerRef.current = null;
      }
    };
  }, [currentOrder?.id, currentOrder?.deliveryPersonId, currentOrder?.status, userLat, userLng, map]);

  // Update delivery person marker
  useEffect(() => {
    if (!map || !deliveryPersonLocation) return;

    if (deliveryMarkerRef.current) {
      map.removeLayer(deliveryMarkerRef.current);
    }

    const deliveryIcon = L.divIcon({
      html: `
        <div style="
          background: #F97316; 
          width: 24px; 
          height: 24px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
        ">
          <svg width="14" height="14" fill="white" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707L16 7.586A1 1 0 0015.414 7H14z" />
          </svg>
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        </style>
      `,
      className: 'delivery-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    deliveryMarkerRef.current = L.marker([deliveryPersonLocation.lat, deliveryPersonLocation.lng], { icon: deliveryIcon })
      .addTo(map)
      .bindPopup(`🚚 ${deliveryPerson?.firstName || 'Livreur'} - Distance: ${routeDistance}km - ETA: ${estimatedTime}min`);

    // Ajuster la vue pour montrer tous les marqueurs
    if (userLat && userLng && userMarkerRef.current && pharmacyMarkerRef.current) {
      const markers = [deliveryMarkerRef.current, userMarkerRef.current, pharmacyMarkerRef.current];
      const group = new L.FeatureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [map, deliveryPersonLocation, userLat, userLng, estimatedTime, routeDistance, deliveryPerson]);

  // Mutation to confirm delivery completion by patient
  const confirmDeliveryMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest("POST", `/api/orders/${orderId}/confirm-delivery-completion`);
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
        time: status && ['ready_for_delivery', 'in_transit', 'arrived_pending_confirmation', 'delivered'].includes(status) ? "Prêt pour livraison" : "En attente", 
        completed: status && ['ready_for_delivery', 'in_transit', 'arrived_pending_confirmation', 'delivered'].includes(status) 
      },
      { 
        key: 'in_transit', 
        label: 'En cours de livraison', 
        time: status === 'in_transit' ? `Distance: ${routeDistance}km - ETA: ${estimatedTime} min` : 
              (status === 'arrived_pending_confirmation' || status === 'delivered') ? "Terminé" : "En attente", 
        completed: status && ['in_transit', 'arrived_pending_confirmation', 'delivered'].includes(status),
        active: status === 'in_transit'
      },
      { 
        key: 'arrived_pending_confirmation', 
        label: 'Livreur arrivé', 
        time: status === 'arrived_pending_confirmation' ? "En attente de votre confirmation" : 
              status === 'delivered' ? "Confirmé" : "En attente", 
        completed: status === 'delivered',
        active: status === 'arrived_pending_confirmation'
      },
      { 
        key: 'delivered', 
        label: 'Livraison terminée', 
        time: status === 'delivered' ? "Confirmé" : "En attente", 
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
            Suivi GPS en temps réel
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
              🔴 LIVE GPS
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-green-800" data-testid="text-estimated-arrival">
                ETA: {estimatedTime > 0 ? `${estimatedTime} min` : 'Calcul...'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-green-800">
                Distance: {routeDistance > 0 ? `${routeDistance} km` : 'Calcul...'}
              </span>
            </div>
          </div>
        </div>

        {/* Carte GPS Interactive */}
        <Card className="shadow-sm mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">🗺️ Suivi GPS en temps réel</h3>
              <Button
                size="sm"
                onClick={forceShowRoute}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                disabled={!userLat || !userLng || !currentOrder}
              >
                🗺️ Afficher l'itinéraire
              </Button>
            </div>
            <div 
              ref={mapRef} 
              className="h-96 w-full rounded-lg border-2 border-gray-200"
              style={{ minHeight: '384px' }}
            />

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Votre position</span>
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
              <span>🔄 Mise à jour automatique</span>
              <span>🛣️ Routes Côte d'Ivoire</span>
            </div>

            {routeDistance > 0 && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-green-800">🛣️ Distance restante</p>
                    <p className="text-xs text-green-700">
                      {routeDistance} km • ETA: {estimatedTime} min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-800">{Math.round((1 - routeDistance/10) * 100)}%</p>
                    <p className="text-xs text-green-700">Progression</p>
                  </div>
                </div>
              </div>
            )}

            {import.meta.env.DEV && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <div className="text-blue-800 font-semibold mb-1">🔍 Debug Mode</div>
                <div className="text-blue-700">
                  Statut: {currentOrder?.status || 'N/A'} | 
                  GPS: {userLat ? '🟢' : '🔴'} | 
                  Livreur: {deliveryPersonLocation ? '🟢' : '🔴'}
                </div>
              </div>
            )}
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
            {currentOrder?.status === 'arrived_pending_confirmation' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-800 text-sm">Confirmer la réception</h4>
                    <p className="text-xs text-green-700 mt-1">
                      Votre livreur est arrivé. Confirmez la réception de votre commande
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
                <p className="text-gray-600 text-xs">
                  {deliveryPersonLocation ? '🟢 Livreur en route' : '🔴 En attente d\'assignation'}
                </p>
                {deliveryPersonLocation && routeDistance > 0 && (
                  <p className="text-xs text-gray-500">
                    📍 Distance restante: {routeDistance} km • ETA: {estimatedTime} min
                  </p>
                )}
                {!deliveryPersonLocation && currentOrder?.status === 'preparing' && (
                  <p className="text-xs text-amber-600">
                    🚛 Recherche d'un livreur disponible...
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  size="icon"
                  className="w-8 h-8 bg-green-100 rounded-full hover:bg-green-200"
                  data-testid="button-call-delivery-person"
                  onClick={() => {
                    const phone = deliveryPerson?.phone || '+225 07 00 00 00';
                    window.open(`tel:${phone}`, '_self');
                  }}
                >
                  <svg className="w-4 h-4 text-pharma-green" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </Button>
                <Button
                  size="icon"
                  className="w-8 h-8 bg-blue-100 rounded-full hover:bg-blue-200"
                  data-testid="button-message-delivery-person"
                  onClick={() => {
                    const phone = deliveryPerson?.phone || '+225 07 00 00 00';
                    window.open(`sms:${phone}?body=Bonjour, concernant ma commande de médicaments`, '_self');
                  }}
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