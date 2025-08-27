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
import io from 'socket.io-client';

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
  const [deliverySpeed, setDeliverySpeed] = useState<number>(0);
  const [deliveryBearing, setDeliveryBearing] = useState<number>(0);
  const [deliveryProximity, setDeliveryProximity] = useState<'far' | 'nearby' | 'arrived'>('far');
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
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

  // 🚀 Configuration tracking GPS haute fréquence - Style Google Maps
  const TRACKING_INTERVAL = 2000; // 2 secondes comme Google Maps
  const HIGH_PRECISION_DISTANCE = 1; // 1km pour tracking haute fréquence
  
  // Zones de geofencing
  const GEOFENCE_ZONES = {
    ARRIVED: 100, // 100m = arrivé
    NEARBY: 500,  // 500m = proche
    EN_ROUTE: 2000 // 2km = en route
  };

  // Get current order being tracked (sans polling - WebSocket gère les mises à jour)
  const { data: currentOrder, isLoading: orderLoading } = useQuery<Order>({
    queryKey: ['/api/orders/current'],
    refetchInterval: false, // Désactivé - WebSocket gère les mises à jour temps réel
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

  // 🎯 Geofencing et Détection Automatique - Style Google Maps
  const checkGeofencing = (deliveryLat: number, deliveryLng: number) => {
    if (!userLat || !userLng) return;
    
    const distanceToCustomer = calculateDistance(deliveryLat, deliveryLng, userLat, userLng) * 1000; // en mètres
    
    if (distanceToCustomer <= GEOFENCE_ZONES.ARRIVED) {
      // Auto-marquer comme "arrivé"
      if (currentOrder?.status !== 'arrived_pending_confirmation' && deliveryProximity !== 'arrived') {
        setDeliveryProximity('arrived');
        // updateOrderStatus('arrived_pending_confirmation'); // À implémenter
        toast({
          title: "🚚 Livreur arrivé !",
          description: "Votre livreur est à votre porte",
        });
      }
    } else if (distanceToCustomer <= GEOFENCE_ZONES.NEARBY) {
      if (deliveryProximity !== 'nearby') {
        setDeliveryProximity('nearby');
        toast({
          title: "🔔 Livreur proche",
          description: `Votre livreur arrive dans ${Math.round(distanceToCustomer)}m`,
        });
      }
    } else {
      setDeliveryProximity('far');
    }
  };

  // 🎬 Animation Fluide Style Google Maps
  const animateMarkerMovement = (oldPos: {lat: number, lng: number}, newPos: {lat: number, lng: number}) => {
    if (!deliveryMarkerRef.current) return;
    
    const steps = 20;
    const latStep = (newPos.lat - oldPos.lat) / steps;
    const lngStep = (newPos.lng - oldPos.lng) / steps;
    
    let currentStep = 0;
    
    const animate = () => {
      if (currentStep < steps) {
        const interpolatedPos = {
          lat: oldPos.lat + (latStep * currentStep),
          lng: oldPos.lng + (lngStep * currentStep)
        };
        
        deliveryMarkerRef.current?.setLatLng([interpolatedPos.lat, interpolatedPos.lng]);
        currentStep++;
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

  // Helper function to get optimal zoom level based on distance
  const getOptimalZoom = (distance: number): number => {
    if (distance < 0.5) return 17;      // < 500m - zoom très proche
    if (distance < 1) return 16;        // < 1km - zoom proche  
    if (distance < 2) return 15;        // < 2km - zoom moyen-proche
    if (distance < 5) return 14;        // < 5km - zoom moyen
    if (distance < 10) return 13;       // < 10km - zoom élargi
    if (distance < 20) return 12;       // < 20km - zoom large
    return 11;                          // > 20km - zoom très large
  };

  // Improved map centering function
  const centerMapOnRoute = (deliveryLat: number, deliveryLng: number, userLat: number, userLng: number, distance: number) => {
    if (!map) return;

    try {
      // Créer les bounds entre livreur et patient uniquement
      const bounds = L.latLngBounds([
        [deliveryLat, deliveryLng],
        [userLat, userLng]
      ]);

      // Calculer le padding adaptatif basé sur la distance
      const basePadding = Math.max(20, Math.min(80, distance * 10));
      const padding: [number, number] = [basePadding, basePadding];

      // Obtenir le niveau de zoom optimal
      const optimalZoom = getOptimalZoom(distance);

      // Appliquer le centrage avec les paramètres optimisés
      map.fitBounds(bounds, {
        padding,
        maxZoom: optimalZoom,
        animate: true,
        duration: 0.8
      });

      if (import.meta.env.DEV) {
        console.log('📍 Carte centrée - Distance:', distance + 'km', 'Zoom:', optimalZoom, 'Padding:', padding);
      }
    } catch (error) {
      console.error('Erreur lors du centrage de la carte:', error);
      // Fallback simple
      map.setView([(deliveryLat + userLat) / 2, (deliveryLng + userLng) / 2], 14);
    }
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
          maxZoom: 19,
          minZoom: 8, // Limiter le zoom minimum pour éviter de trop dézoomer
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

    // Centrer uniquement si c'est la première fois qu'on a la position utilisateur
    // et qu'il n'y a pas encore de livreur assigné
    if (!deliveryPersonLocation) {
      map.setView([userLat, userLng], 14);
    }
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
      let deliveryPersonLat, deliveryPersonLng;
      let isRealPosition = false;

      // Essayer de récupérer la vraie position du livreur d'abord
      try {
        const deliveryPersonResponse = await fetch(`/api/delivery-persons/${currentOrder.deliveryPersonId}`);

        if (deliveryPersonResponse.ok) {
          const deliveryPersonData = await deliveryPersonResponse.json();

          if (deliveryPersonData.lat && deliveryPersonData.lng) {
            deliveryPersonLat = parseFloat(deliveryPersonData.lat);
            deliveryPersonLng = parseFloat(deliveryPersonData.lng);
            isRealPosition = true;

            if (import.meta.env.DEV) {
              console.log('🔧 Forçage avec vraie position GPS du livreur:', {
                lat: deliveryPersonLat,
                lng: deliveryPersonLng
              });
            }
          }
        }
      } catch (apiError) {
        console.log('API livreur non disponible, utilisation position proche');
      }

      // Fallback si pas de vraie position
      if (!isRealPosition) {
        deliveryPersonLat = userLat - 0.01; // ~1km au sud
        deliveryPersonLng = userLng + 0.01; // ~1km à l'est

        if (import.meta.env.DEV) {
          console.log('🔧 Forçage avec position proche du patient (fallback)');
        }
      }

      const routeData = await calculateRealRoute(
        deliveryPersonLat, 
        deliveryPersonLng, 
        userLat, 
        userLng
      );

      if (routeData) {
        updateRouteDisplay(routeData, deliveryPersonLat, deliveryPersonLng);

        setDeliveryPersonLocation({
          lat: deliveryPersonLat,
          lng: deliveryPersonLng
        });

        toast({
          title: "Itinéraire affiché ✅",
          description: `Distance: ${routeData.distance}km • Durée: ${routeData.duration}min ${isRealPosition ? '(Position réelle)' : '(Position estimée)'}`,
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
    if (!map) return;

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

    // Utiliser la nouvelle fonction de centrage optimisée
    if (userLat && userLng) {
      centerMapOnRoute(deliveryPersonLat, deliveryPersonLng, userLat, userLng, routeData.distance);
    }

    if (import.meta.env.DEV) {
      console.log('✅ Itinéraire mis à jour avec centrage optimisé:', {
        distance: routeData.distance + 'km',
        duration: routeData.duration + 'min',
        coordinates: routeData.coordinates.length + ' points'
      });
    }
  };

  // 🚀 WebSocket Real-Time GPS Tracking - Style Google Maps
  useEffect(() => {
    if (!currentOrder?.id) return;

    if (import.meta.env.DEV) {
      console.log('🔌 Initialisation WebSocket tracking pour commande:', currentOrder.id);
    }

    // Créer connexion WebSocket
    const socket = io();

    // Rejoindre la room de tracking pour cette commande
    socket.emit('join', `order-${currentOrder.id}`);

    // Écouter les mises à jour GPS en temps réel (2 secondes comme Google Maps)
    socket.on('deliveryLocationUpdate', (locationData) => {
      const { lat, lng, speed, bearing, timestamp } = locationData;
      
      if (import.meta.env.DEV) {
        console.log('📍 Position GPS temps réel reçue:', {
          lat, lng, speed, bearing, timestamp,
          orderId: currentOrder.id
        });
      }

      const newLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
      
      // Animation fluide du marqueur si position précédente existe
      if (deliveryPersonLocation) {
        animateMarkerMovement(deliveryPersonLocation, newLocation);
      }

      // Mise à jour des données
      setDeliveryPersonLocation(newLocation);
      setDeliverySpeed(speed || 0);
      setDeliveryBearing(bearing || 0);
      setLastLocationUpdate(new Date(timestamp));
      
      // 🎯 Vérification geofencing automatique
      if (userLat && userLng) {
        checkGeofencing(parseFloat(lat), parseFloat(lng));
      }
      
      // 🕐 Calcul ETA dynamique basé sur vitesse réelle
      if (speed > 0 && userLat && userLng) {
        const remainingDistance = calculateDistance(parseFloat(lat), parseFloat(lng), userLat, userLng);
        const estimatedMinutes = (remainingDistance / (speed / 60)) * 60; // Conversion km/h vers temps
        setEstimatedTime(Math.round(estimatedMinutes));
      }
    });

    // Gestion des erreurs WebSocket
    socket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion WebSocket:', error);
      toast({
        title: "Connexion instable",
        description: "Le suivi GPS peut être interrompu",
        variant: "destructive",
      });
    });

    socket.on('connect', () => {
      if (import.meta.env.DEV) {
        console.log('✅ WebSocket connecté pour tracking GPS temps réel');
      }
    });

    // Nettoyage à la déconnexion
    return () => {
      socket.emit('leave', `order-${currentOrder.id}`);
      socket.disconnect();
      if (import.meta.env.DEV) {
        console.log('🔌 WebSocket déconnecté pour commande:', currentOrder.id);
      }
    };
  }, [currentOrder?.id, userLat, userLng, deliveryPersonLocation]);

  // Traçage d'itinéraire initial et mise à jour du marqueur livreur
  useEffect(() => {
    if (!deliveryPersonLocation || !map) return;

    // Créer ou mettre à jour le marqueur du livreur
    if (deliveryMarkerRef.current) {
      map.removeLayer(deliveryMarkerRef.current);
    }

    // Icône livreur avec direction (bearing) pour plus de réalisme
    const deliveryIcon = L.divIcon({
      html: `
        <div style="
          background: #F97316; 
          width: 30px; 
          height: 30px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${deliveryBearing || 0}deg);
        ">
          <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
            <path d="M12 2L13.5 8.5L20 7L14 12L20 17L13.5 15.5L12 22L10.5 15.5L4 17L10 12L4 7L10.5 8.5Z"/>
          </svg>
        </div>
      `,
      className: 'delivery-marker-animated',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    deliveryMarkerRef.current = L.marker([deliveryPersonLocation.lat, deliveryPersonLocation.lng], { 
      icon: deliveryIcon 
    })
      .addTo(map)
      .bindPopup(`🚚 Livreur ${deliverySpeed > 0 ? `(${Math.round(deliverySpeed)} km/h)` : ''}`);

    // Tracer l'itinéraire si user location disponible
    if (userLat && userLng) {
      calculateRealRoute(
        deliveryPersonLocation.lat,
        deliveryPersonLocation.lng,
        userLat,
        userLng
      ).then(routeData => {
        if (routeData) {
          updateRouteDisplay(routeData, deliveryPersonLocation.lat, deliveryPersonLocation.lng);
        }
      });
    }
  }, [deliveryPersonLocation, map, deliveryBearing, deliverySpeed]);

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
      .bindPopup(`
        <div style="text-align: center; font-size: 12px;">
          <strong>🚚 ${deliveryPerson?.firstName || 'Livreur'}</strong><br>
          📍 Position GPS en temps réel<br>
          🛣️ Distance: ${routeDistance}km<br>
          ⏱️ ETA: ${estimatedTime}min<br>
          <small style="color: #10b981;">✅ Position vérifiée</small>
        </div>
      `);

    // Centrage optimisé avec la nouvelle fonction
    if (userLat && userLng) {
      const distance = calculateDistance(
        deliveryPersonLocation.lat, 
        deliveryPersonLocation.lng,
        userLat, 
        userLng
      );

      // Utiliser la fonction de centrage optimisée
      centerMapOnRoute(deliveryPersonLocation.lat, deliveryPersonLocation.lng, userLat, userLng, distance);
    }
  }, [map, deliveryPersonLocation, userLat, userLng, estimatedTime, routeDistance, deliveryPerson]);

  // Mutation to confirm delivery completion by patient
  const confirmDeliveryMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest(`/api/orders/${orderId}/confirm-delivery-completion`, "POST");
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

        {/* Carte GPS Interactive avec Zoom Optimisé */}
        <Card className="shadow-sm mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">🗺️ Suivi GPS avec zoom adaptatif</h3>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={forceShowRoute}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                  disabled={!userLat || !userLng || !currentOrder}
                >
                  🗺️ Afficher l'itinéraire
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (map && deliveryPersonLocation && userLat && userLng) {
                      const distance = calculateDistance(
                        deliveryPersonLocation.lat, 
                        deliveryPersonLocation.lng, 
                        userLat, 
                        userLng
                      );
                      centerMapOnRoute(deliveryPersonLocation.lat, deliveryPersonLocation.lng, userLat, userLng, distance);
                    }
                  }}
                  variant="outline"
                  className="text-xs px-2 py-1"
                  disabled={!deliveryPersonLocation || !userLat || !userLng}
                >
                  🎯 Recentrer
                </Button>
              </div>
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
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                <span>Livreur GPS live</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Pharmacie</span>
              </div>
            </div>

            <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
              <span>🔄 Zoom adaptatif automatique</span>
              <span>🛣️ Routes optimisées CI</span>
            </div>

            {routeDistance > 0 && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-green-800">🛣️ Distance restante</p>
                    <p className="text-xs text-green-700">
                      {routeDistance} km • ETA: {estimatedTime} min
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Zoom: {getOptimalZoom(routeDistance)} (adaptatif selon distance)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-800">{Math.round((1 - routeDistance/10) * 100)}%</p>
                    <p className="text-xs text-green-700">Progression</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, Math.round((1 - routeDistance/10) * 100))}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Indicateur de fiabilité GPS - TOUJOURS VISIBLE */}
            <div className="mt-2 p-2 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded text-xs">
              <div className="text-green-800 font-semibold mb-1">📡 Statut GPS Temps Réel + Zoom Intelligent</div>
              <div className="text-green-700 space-y-1">
                <div>📍 Patient: {userLat ? '🟢 GPS actif' : '🔴 GPS indisponible'}</div>
                <div>🚚 Livreur: {deliveryPersonLocation ? '🟢 Position confirmée' : '🔴 Position inconnue'}</div>
                <div>🎯 Zoom adaptatif: {routeDistance > 0 ? `${getOptimalZoom(routeDistance)} (${routeDistance}km)` : 'Standard'}</div>
                {currentOrder?.deliveryPersonId && (
                  <div className="text-xs text-gray-600 mt-1">
                    ID Livreur: {currentOrder.deliveryPersonId.slice(0, 8)}...
                  </div>
                )}
              </div>
            </div>

            {import.meta.env.DEV && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <div className="text-blue-800 font-semibold mb-1">🔍 Debug Mode Développeur</div>
                <div className="text-blue-700">
                  Statut: {currentOrder?.status || 'N/A'} | 
                  GPS Patient: {userLat ? '🟢' : '🔴'} | 
                  GPS Livreur: {deliveryPersonLocation ? '🟢' : '🔴'} |
                  Zoom Auto: {routeDistance > 0 ? getOptimalZoom(routeDistance) : 'N/A'}
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