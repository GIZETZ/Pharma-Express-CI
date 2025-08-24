
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").optional(),
  phone: z.string().min(8, "Le numéro de téléphone doit contenir au moins 8 chiffres"),
  // Champs spécifiques aux livreurs
  vehicleType: z.string().optional(),
  vehicleBrand: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleColor: z.string().optional(),
  vehicleLicensePlate: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;

export default function EditProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      vehicleType: user?.vehicleType || '',
      vehicleBrand: user?.vehicleBrand || '',
      vehicleModel: user?.vehicleModel || '',
      vehicleColor: user?.vehicleColor || '',
      vehicleLicensePlate: user?.vehicleLicensePlate || '',
      emergencyContactName: user?.emergencyContactName || '',
      emergencyContactPhone: user?.emergencyContactPhone || '',
    },
    values: user ? {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email || '',
      phone: user.phone,
      vehicleType: user.vehicleType || '',
      vehicleBrand: user.vehicleBrand || '',
      vehicleModel: user.vehicleModel || '',
      vehicleColor: user.vehicleColor || '',
      vehicleLicensePlate: user.vehicleLicensePlate || '',
      emergencyContactName: user.emergencyContactName || '',
      emergencyContactPhone: user.emergencyContactPhone || '',
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await apiRequest('PUT', '/api/auth/user', data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
      });
      queryClient.setQueryData(['/api/auth/user'], updatedUser);
      setLocation("/profile");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateProfileData) => {
    updateMutation.mutate(data);
  };

  const goBack = () => {
    setLocation("/profile");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pharma-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-4 border-pharma-green border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

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
            Modifier le profil
          </h1>
        </div>
      </header>

      {/* Form */}
      <div className="px-4 py-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    placeholder="Votre prénom"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    placeholder="Votre nom"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="votre.email@exemple.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="0707070707"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* Champs spécifiques aux livreurs */}
              {user?.role === "livreur" && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold mb-4">🚗 Informations du véhicule</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor="vehicleType">Type de véhicule</Label>
                        <Input
                          id="vehicleType"
                          {...register("vehicleType")}
                          placeholder="Moto, Scooter, Voiture..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicleBrand">Marque</Label>
                        <Input
                          id="vehicleBrand"
                          {...register("vehicleBrand")}
                          placeholder="Yamaha, Honda, Toyota..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor="vehicleModel">Modèle</Label>
                        <Input
                          id="vehicleModel"
                          {...register("vehicleModel")}
                          placeholder="DT 125, Wave 110..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicleColor">Couleur</Label>
                        <Input
                          id="vehicleColor"
                          {...register("vehicleColor")}
                          placeholder="Rouge, Bleu, Noir..."
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label htmlFor="vehicleLicensePlate">Plaque d'immatriculation</Label>
                      <Input
                        id="vehicleLicensePlate"
                        {...register("vehicleLicensePlate")}
                        placeholder="CI-2578-AB"
                        className="font-bold text-lg text-center"
                        data-testid="input-license-plate"
                      />
                      {errors.vehicleLicensePlate && (
                        <p className="text-red-500 text-sm mt-1">{errors.vehicleLicensePlate.message}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        Cette plaque sera visible par les patients pour vous identifier
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold mb-4">📞 Contact d'urgence</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergencyContactName">Nom du contact</Label>
                        <Input
                          id="emergencyContactName"
                          {...register("emergencyContactName")}
                          placeholder="Nom de la personne à contacter"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactPhone">Téléphone d'urgence</Label>
                        <Input
                          id="emergencyContactPhone"
                          {...register("emergencyContactPhone")}
                          placeholder="+225 07 00 00 00"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

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
                    'Sauvegarder'
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
