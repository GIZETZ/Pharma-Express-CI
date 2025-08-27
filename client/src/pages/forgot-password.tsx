import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import emailjs from '@emailjs/browser';

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const requestResetMutation = useMutation({
    mutationFn: async (email: string) => {
      console.log("🔄 Génération du code pour:", email);
      
      try {
        // Step 1: Generate code on server
        const response = await apiRequest("/api/auth/request-reset", "POST", { email });
        const data = await response.json();
        console.log("✅ Code généré:", data);
        console.log("🔍 Code à envoyer:", data.code);
        
        // Step 2: Initialize EmailJS and send email (client-side)
        console.log("📧 Initialisation EmailJS...");
        
        // Initialize EmailJS with public key
        emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key');
        
        console.log("📧 Envoi email via EmailJS...");
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_1',
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_1',
          {
            passcode: data.code,
            email: email,
            to_email: email,
            to_name: "Utilisateur"
          }
        );
        
        console.log("✅ Email envoyé avec succès");
        return data;
      } catch (error) {
        console.error("❌ Erreur:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("✅ Processus complet réussi");
      toast({
        title: "Code envoyé !",
        description: "Vérifiez votre boîte mail pour le code de récupération.",
      });
      setLocation(`/verify-reset-code?email=${encodeURIComponent(email)}`);
    },
    onError: (error: any) => {
      console.error("❌ Erreur complète:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le code de récupération",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email requis",
        description: "Veuillez entrer votre adresse email",
      });
      return;
    }
    requestResetMutation.mutate(email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <CardTitle className="text-2xl font-bold text-green-800">
              Mot de passe oublié
            </CardTitle>
          </div>
          <CardDescription>
            Entrez votre email pour recevoir un code de récupération
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  data-testid="input-email"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={requestResetMutation.isPending}
              data-testid="button-send-code"
            >
              {requestResetMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Envoyer le code"
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Vous vous souvenez de votre mot de passe ?{" "}
              <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}