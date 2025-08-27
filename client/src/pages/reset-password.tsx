import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  // Extract email and code from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get("email");
    const codeParam = urlParams.get("code");
    
    if (emailParam && codeParam) {
      setEmail(decodeURIComponent(emailParam));
      setCode(decodeURIComponent(codeParam));
    } else {
      // Redirect back to forgot password if missing parameters
      setLocation("/forgot-password");
    }
  }, [setLocation]);

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { email: string; code: string; password: string }) => 
      apiRequest("/api/auth/reset-password", "POST", data),
    onSuccess: () => {
      toast({
        title: "Mot de passe réinitialisé !",
        description: "Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de réinitialiser le mot de passe",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 6 caractères",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Mots de passe différents",
        description: "Les mots de passe ne correspondent pas",
      });
      return;
    }

    resetPasswordMutation.mutate({ email, code, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/verify-reset-code">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <CardTitle className="text-2xl font-bold text-green-800">
              Nouveau mot de passe
            </CardTitle>
          </div>
          <CardDescription>
            Choisissez un nouveau mot de passe sécurisé pour votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Retapez le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  data-testid="input-confirm-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  data-testid="button-toggle-confirm-password"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Password strength indicator */}
            {password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  <div className={`h-1 w-1/4 rounded ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-1 w-1/4 rounded ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-1 w-1/4 rounded ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-1 w-1/4 rounded ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-200'}`} />
                </div>
                <p className="text-xs text-gray-500">
                  Force du mot de passe: {password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'Forte' : 
                    password.length >= 6 ? 'Moyenne' : 'Faible'}
                </p>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={resetPasswordMutation.isPending || password.length < 6 || password !== confirmPassword}
              data-testid="button-reset-password"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                "Réinitialiser le mot de passe"
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
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