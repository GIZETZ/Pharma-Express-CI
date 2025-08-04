
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";

const addressSchema = z.object({
  street: z.string().min(1, "L'adresse est requise"),
  city: z.string().min(1, "La ville est requise"),
  postalCode: z.string().min(1, "Le code postal est requis"),
  country: z.string().min(1, "Le pays est requis"),
  details: z.string().optional(),
});

type AddressData = z.infer<typeof addressSchema>;

export default function DeliveryAddress() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { latitude, longitude, error: geoError, loading: geoLoading, refetch } = useGeolocation();
  const [addressFromLocation, setAddressFromLocation] = useState<string>("");
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<AddressData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      city: "",
      postalCode: "",
      country: "Côte d'Ivoire",
      details: "",
    },
  });

  // Reverse geocoding pour obtenir l'adresse depuis les coordonnées
  useEffect(() => {
    if (latitude && longitude && !isReverseGeocoding) {
      setIsReverseGeocoding(true);
      
      // Utiliser un service de géocodage inverse (ici on simule)
      const reverseGeocode = async () => {
        try {
          // En production, vous utiliseriez un service comme Google Maps API
          // Pour cette démo, on simule une adresse
          setTimeout(() => {
            const mockAddress = "Rue des Pharmacies, Abidjan";
            setAddressFromLocation(mockAddress);
            setValue("street", mockAddress);
            setValue("city", "Abidjan");
            setValue("postalCode", "00225");
            setIsReverseGeocoding(false);
            
            toast({
              title: "Position détectée",
              description: "Votre adresse a été automatiquement remplie. Vous pouvez la modifier si nécessaire.",
            });
          }, 2000);
        } catch (error) {
          console.error('Erreur géocodage inverse:', error);
          setIsReverseGeocoding(false);
        }
      };
      
      reverseGeocode();
    }
  }, [latitude, longitude, setValue, toast]);

  const handleGetLocation = () => {
    refetch();
  };

  const onSubmit = (data: AddressData) => {
    // Sauvegarder l'adresse
    localStorage.setItem('deliveryAddress', JSON.stringify({
      ...data,
      coordinates: latitude && longitude ? { latitude, longitude } : null
    }));
    
    toast({
      title: "Adresse sauvegardée",
      description: "Votre adresse de livraison a été enregistrée avec succès.",
    });
    
    setLocation("/profile");
  };

  const goBack = () => {
    setLocation("/profile");
  };

  return (
    <div className="min-h-screen bg-pharma-bg">
      {/* Header */}
      <header className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="w-10 h-10"
          >
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Button>
          <h1 className="text-xl font-bold text-gray-900">
            Adresse de livraison
          </h1>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Geolocation Card */}
        <Card className="shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-pharma-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>Localisation automatique</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {geoError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">{geoError}</p>
              </div>
            )}
            
            <Button
              onClick={handleGetLocation}
              disabled={geoLoading || isReverseGeocoding}
              className="w-full bg-pharma-green hover:bg-pharma-green/90"
            >
              {geoLoading || isReverseGeocoding ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isReverseGeocoding ? 'Récupération de l\'adresse...' : 'Localisation en cours...'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Utiliser ma position actuelle
                </>
              )}
            </Button>

            {latitude && longitude && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">
                  📍 Position détectée: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address Form */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Informations d'adresse</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="street">Adresse complète</Label>
                <Input
                  id="street"
                  {...register("street")}
                  placeholder="Numéro, rue, quartier"
                />
                {errors.street && (
                  <p className="text-red-500 text-sm mt-1">{errors.street.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    {...register("city")}
                    placeholder="Votre ville"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input
                    id="postalCode"
                    {...register("postalCode")}
                    placeholder="Code postal"
                  />
                  {errors.postalCode && (
                    <p className="text-red-500 text-sm mt-1">{errors.postalCode.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  {...register("country")}
                  placeholder="Votre pays"
                />
                {errors.country && (
                  <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="details">Détails supplémentaires (optionnel)</Label>
                <Textarea
                  id="details"
                  {...register("details")}
                  placeholder="Étage, appartement, point de repère..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-pharma-green hover:bg-pharma-green/90"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sauvegarde...
                    </>
                  ) : (
                    'Sauvegarder l\'adresse'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
