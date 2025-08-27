import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyResetCode() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");

  // Extract email from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else {
      // Redirect back to forgot password if no email
      setLocation("/forgot-password");
    }
  }, [setLocation]);

  const verifyCodeMutation = useMutation({
    mutationFn: (data: { email: string; code: string }) => 
      apiRequest("/api/auth/verify-reset-code", "POST", data),
    onSuccess: () => {
      toast({
        title: "Code vérifié !",
        description: "Vous pouvez maintenant créer un nouveau mot de passe.",
      });
      setLocation(`/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Code incorrect",
        description: error.message || "Le code saisi est incorrect ou a expiré",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast({
        variant: "destructive",
        title: "Code invalide",
        description: "Veuillez entrer un code à 6 chiffres",
      });
      return;
    }
    verifyCodeMutation.mutate({ email, code });
  };

  const formatCode = (value: string) => {
    // Only allow digits and limit to 6 characters
    return value.replace(/\D/g, '').slice(0, 6);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/forgot-password">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <CardTitle className="text-2xl font-bold text-green-800">
              Vérification du code
            </CardTitle>
          </div>
          <CardDescription>
            Entrez le code à 6 chiffres envoyé à {email && (
              <span className="font-medium text-green-600">{email}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code de vérification</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(formatCode(e.target.value))}
                  className="pl-10 text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                  required
                  data-testid="input-code"
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                Code valable pendant 15 minutes
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={verifyCodeMutation.isPending || code.length !== 6}
              data-testid="button-verify-code"
            >
              {verifyCodeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Vérifier le code"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Vous n'avez pas reçu le code ?{" "}
              <Link href="/forgot-password" className="text-green-600 hover:text-green-700 font-medium">
                Renvoyer un code
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                Retour à la connexion
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}