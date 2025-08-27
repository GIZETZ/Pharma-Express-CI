import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type LoginFormData = z.infer<typeof loginSchema>;
type UserRole = "patient" | "pharmacien" | "livreur";

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return response.json();
    },
    onSuccess: (user) => {
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${user.firstName} ${user.lastName}!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });

      // Redirection selon le rôle de l'utilisateur
      switch (user.role) {
        case "admin":
          window.location.href = '/supervisorlock';
          break;
        case "pharmacien":
          window.location.href = '/dashboard-pharmacien';
          break;
        case "livreur":
          window.location.href = '/dashboard-livreur';
          break;
        case "patient":
        default:
          window.location.href = '/dashboard-patient';
          break;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Numéro de téléphone ou mot de passe incorrect",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  // Fonction pour changer de profil
  const handleRoleChange = () => {
    setSelectedRole(null);
    // Réinitialiser le formulaire
    form.reset({
      phone: "",
      password: "",
    });
    // Réinitialiser les erreurs du formulaire
    form.clearErrors();
  };

  // Render role selection first
  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              YahoPharma+
            </CardTitle>
            <CardDescription>
              Connectez-vous à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 mb-4">Sélectionnez votre profil :</p>
            </div>

            {/* Role Selection Cards */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-20 flex items-center justify-start space-x-4 hover:bg-blue-50 border-2 hover:border-blue-300"
                onClick={() => setSelectedRole("patient")}
                data-testid="button-login-patient"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  👥
                </div>
                <div className="text-left">
                  <div className="font-semibold text-blue-600">Patient</div>
                  <div className="text-sm text-gray-500">Commander vos médicaments</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-20 flex items-center justify-start space-x-4 hover:bg-green-50 border-2 hover:border-green-300"
                onClick={() => setSelectedRole("pharmacien")}
                data-testid="button-login-pharmacien"
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
                data-testid="button-login-livreur"
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
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  <Link
                    href="/forgot-password"
                    className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
                    data-testid="link-forgot-password"
                  >
                    Mot de passe oublié ?
                  </Link>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pas encore de compte ?{" "}
                  <Link
                    href="/register"
                    className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
                    data-testid="link-register"
                  >
                    S'inscrire
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            YahoPharma+
          </CardTitle>
          <CardDescription>
            Connexion - {selectedRole === "patient" ? "👥 Patient" : selectedRole === "pharmacien" ? "💊 Pharmacien" : "🚴 Livreur"}
          </CardDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRoleChange}
            className="mt-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            data-testid="button-back-to-role-selection"
          >
            ← Changer de profil
          </Button>
        </CardHeader>
        <CardContent>
          {/* Comptes de test pour le rôle sélectionné */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Compte de test {selectedRole} :</h3>
            <div className="text-sm text-blue-800">
              {selectedRole === "patient" && <div><strong>Patient:</strong> +225 05 77 88 99 / patient123</div>}
              {selectedRole === "pharmacien" && <div><strong>Pharmacien:</strong> +225 07 11 22 33 / pharma123</div>}
              {selectedRole === "livreur" && <div><strong>Livreur:</strong> +225 07 44 55 66 / livreur123</div>}
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de téléphone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+225 XX XX XX XX XX"
                        type="tel"
                        data-testid="input-phone"
                      />
                    </FormControl>
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
                        placeholder="Votre mot de passe"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pas encore de compte ?{" "}
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
                data-testid="link-register"
              >
                S'inscrire
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}