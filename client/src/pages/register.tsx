import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type RegisterFormData = z.infer<typeof registerSchema>;
type UserRole = "patient" | "pharmacien" | "livreur";

export default function Register() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "", // Added email to defaultValues
      address: "",
      password: "",
      confirmPassword: "",
      role: selectedRole || "patient",
      language: "fr",
    },
  });

  // Mettre à jour le rôle dans le formulaire quand selectedRole change
  React.useEffect(() => {
    if (selectedRole) {
      form.setValue('role', selectedRole);
    }
  }, [selectedRole, form]);

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData | FormData) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        body: data instanceof FormData ? data : JSON.stringify(data),
        headers: data instanceof FormData ? {} : { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      return response.json();
    },
    onSuccess: (user) => {
      toast({
        title: "Inscription réussie",
        description: `Bienvenue ${user.firstName} ${user.lastName}!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });

      // Redirection selon le rôle après inscription  
      switch (user.role) {
        case "admin":
          window.location.href = '/supervisorlock';
          break;
        case "pharmacien":
          // Les pharmaciens doivent être validés d'abord
          if (user.verificationStatus === 'pending') {
            window.location.href = '/pending-validation';
          } else {
            window.location.href = '/dashboard-pharmacien';
          }
          break;
        case "livreur":
          // Les livreurs doivent être validés d'abord
          if (user.verificationStatus === 'pending') {
            window.location.href = '/pending-validation';
          } else {
            window.location.href = '/dashboard-livreur';
          }
          break;
        case "patient":
        default:
          window.location.href = '/dashboard-patient';
          break;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue lors de l'inscription",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setIsLoading(true);

    // Create FormData for file upload
    const formData = new FormData();

    // Add all form fields including confirmPassword for validation
    Object.keys(data).forEach(key => {
      formData.append(key, (data as any)[key]);
    });

    // Add uploaded files
    const idDocumentInput = document.querySelector('[data-testid="input-id-document"]') as HTMLInputElement;
    const professionalDocumentInput = document.querySelector('[data-testid="input-professional-document"]') as HTMLInputElement;
    const drivingLicenseInput = document.querySelector('[data-testid="input-driving-license"]') as HTMLInputElement;

    if (idDocumentInput?.files?.[0]) {
      formData.append('idDocument', idDocumentInput.files[0]);
    }

    if (professionalDocumentInput?.files?.[0]) {
      formData.append('professionalDocument', professionalDocumentInput.files[0]);
    }

    if (drivingLicenseInput?.files?.[0]) {
      formData.append('drivingLicense', drivingLicenseInput.files[0]);
    }

    registerMutation.mutate(formData as any);
    setIsLoading(false);
  };

  // Render role selection first
  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <img 
                src="/logotype-1563x323.webp" 
                alt="PharmaChape" 
                className="h-12 w-auto"
              />
            </div>
            <CardDescription>
              Choisissez votre profil pour continuer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 mb-4">Sélectionnez votre type de compte :</p>
            </div>

            {/* Role Selection Cards */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-20 flex items-center justify-start space-x-4 hover:bg-green-50 border-2 hover:border-green-300"
                onClick={() => setSelectedRole("patient")}
                data-testid="button-select-patient"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  👥
                </div>
                <div className="text-left">
                  <div className="font-semibold text-green-600">Patient</div>
                  <div className="text-sm text-gray-500">Commander vos médicaments</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-20 flex items-center justify-start space-x-4 hover:bg-green-50 border-2 hover:border-green-300"
                onClick={() => setSelectedRole("pharmacien")}
                data-testid="button-select-pharmacien"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  💊
                </div>
                <div className="text-left">
                  <div className="font-semibold text-green-600">Pharmacien</div>
                  <div className="text-sm text-gray-500">Gérer votre pharmacie</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-20 flex items-center justify-start space-x-4 hover:bg-purple-50 border-2 hover:border-purple-300"
                onClick={() => setSelectedRole("livreur")}
                data-testid="button-select-livreur"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  🚴
                </div>
                <div className="text-left">
                  <div className="font-semibold text-purple-600">Livreur</div>
                  <div className="text-sm text-gray-500">500 FCFA par livraison</div>
                </div>
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Déjà un compte ?{" "}
                <Link
                  href="/login"
                  className="text-green-600 hover:text-green-500 dark:text-green-400 font-medium"
                  data-testid="link-login"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img 
              src="/logotype-1563x323.webp" 
              alt="PharmaChape" 
              className="h-12 w-auto"
            />
          </div>
          <CardDescription>
            Inscription - {selectedRole === "patient" ? "👥 Patient" : selectedRole === "pharmacien" ? "💊 Pharmacien" : "🚴 Livreur"}
          </CardDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedRole(null)}
            className="mt-2"
            data-testid="button-back-to-role-selection"
          >
            ← Changer de profil
          </Button>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Champ caché pour le rôle */}
              <input type="hidden" {...form.register("role")} value={selectedRole} />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Votre prénom"
                          data-testid="input-firstname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Votre nom"
                          data-testid="input-lastname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de téléphone</FormLabel>
                    <FormControl>
                      <PhoneInput
                        {...field}
                        placeholder="XX XX XX XX XX"
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="votre.email@exemple.com"
                        type="email"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {selectedRole === "pharmacien" ? "Adresse de la pharmacie" :
                       selectedRole === "livreur" ? "Adresse de résidence" :
                       "Adresse de domicile"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          selectedRole === "pharmacien" ? "Adresse complète de votre pharmacie" :
                          selectedRole === "livreur" ? "Votre adresse de résidence" :
                          "Votre adresse complète"
                        }
                        data-testid="input-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Champ spécial pour Pharmaciens et Livreurs : Pièce d'identité */}
              {(selectedRole === "pharmacien" || selectedRole === "livreur") && (
                <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm text-yellow-800 font-medium">
                      Vérification d'identité requise
                    </p>
                  </div>
                  <p className="text-xs text-yellow-700">
                    {selectedRole === "pharmacien"
                      ? "Joignez une copie de votre carte d'identité nationale et diplôme de pharmacien. Un admin validera votre compte."
                      : "Joignez une copie de votre carte d'identité nationale et permis de conduire. Un admin validera votre compte."
                    }
                  </p>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Document d'identité *</label>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      data-testid="input-id-document"
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500">Formats acceptés: JPG, PNG, PDF (max 5MB)</p>
                  </div>

                  {selectedRole === "pharmacien" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Diplôme de pharmacien *</label>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        data-testid="input-professional-document"
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-gray-500">Diplôme ou certification professionnelle</p>
                    </div>
                  )}

                  {selectedRole === "livreur" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Permis de conduire *</label>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        data-testid="input-driving-license"
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-gray-500">Permis de conduire valide</p>
                    </div>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Langue préférée</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "fr"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-language">
                          <SelectValue placeholder="Choisir une langue" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Minimum 6 caractères"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Répétez votre mot de passe"
                        data-testid="input-confirm-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-register"
              >
                {isLoading ? "Inscription..." :
                 selectedRole === "patient" ? "Créer mon compte" :
                 `Soumettre pour validation`}
              </Button>

              {(selectedRole === "pharmacien" || selectedRole === "livreur") && (
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-700">
                    ⏳ Votre compte sera activé après validation par notre équipe (24-48h)
                  </p>
                </div>
              )}
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Déjà un compte ?{" "}
              <Link
                href="/login"
                className="text-green-600 hover:text-green-500 dark:text-green-400 font-medium"
                data-testid="link-login"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}