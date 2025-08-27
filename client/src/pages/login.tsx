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
export default function Login() {
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
      const response = await apiRequest('/api/auth/login', 'POST', data);
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
        <CardContent>
          {/* Comptes de test */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Comptes de test :</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <div><strong>Patient:</strong> +225 05 77 88 99 / patient123</div>
              <div><strong>Pharmacien:</strong> +225 07 11 22 33 / pharma123</div>
              <div><strong>Livreur:</strong> +225 07 44 55 66 / livreur123</div>
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

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
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
        </CardContent>
      </Card>
    </div>
  );
}