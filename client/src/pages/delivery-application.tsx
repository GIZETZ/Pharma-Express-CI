
import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Upload, FileText, Briefcase } from "lucide-react";

const applicationSchema = z.object({
  pharmacyId: z.string().min(1, "ID de pharmacie requis"),
  motivationLetter: z.string().min(50, "La lettre de motivation doit contenir au moins 50 caractères"),
  experience: z.string().min(10, "Veuillez décrire votre expérience"),
  availability: z.string().min(5, "Veuillez indiquer vos disponibilités"),
  phone: z.string().min(10, "Numéro de téléphone requis"),
  idDocument: z.any().optional(),
  drivingLicense: z.any().optional(),
  cvDocument: z.any().optional(),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

export default function DeliveryApplication() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get pharmacy from localStorage (passed from pharmacies page)
  const selectedPharmacy = JSON.parse(localStorage.getItem('selectedPharmacyForApplication') || '{}');

  const form = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      pharmacyId: selectedPharmacy.id || '',
      motivationLetter: '',
      experience: '',
      availability: '',
      phone: '',
    },
  });

  const applicationMutation = useMutation({
    mutationFn: async (data: ApplicationForm) => {
      const formData = new FormData();
      formData.append('pharmacyId', data.pharmacyId);
      formData.append('motivationLetter', data.motivationLetter);
      formData.append('experience', data.experience);
      formData.append('availability', data.availability);
      formData.append('phone', data.phone);
      
      if (data.idDocument?.[0]) {
        formData.append('idDocument', data.idDocument[0]);
      }
      if (data.drivingLicense?.[0]) {
        formData.append('drivingLicense', data.drivingLicense[0]);
      }
      if (data.cvDocument?.[0]) {
        formData.append('cvDocument', data.cvDocument[0]);
      }

      const response = await fetch('/api/delivery/apply', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = (await response.text()) || response.statusText;
        throw new Error(`${response.status}: ${text}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Candidature envoyée ✅",
        description: "Votre candidature a été envoyée avec succès. La pharmacie vous contactera bientôt.",
      });
      localStorage.removeItem('selectedPharmacyForApplication');
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setLocation('/pharmacies');
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'envoi",
        description: error.message || "Une erreur est survenue lors de l'envoi de votre candidature.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ApplicationForm) => {
    setIsSubmitting(true);
    applicationMutation.mutate(data);
  };

  if (!selectedPharmacy.id) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto pt-8">
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Pharmacie non sélectionnée</h3>
              <p className="text-gray-600 mb-4">Vous devez sélectionner une pharmacie depuis la liste pour postuler.</p>
              <Button onClick={() => setLocation('/pharmacies')}>
                Retour aux pharmacies
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-md mx-auto flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/pharmacies')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">Candidature livreur</h1>
            <p className="text-sm text-gray-600">{selectedPharmacy.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Pharmacy Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-pharma-green rounded-full flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{selectedPharmacy.name}</h3>
                <p className="text-sm text-gray-600">{selectedPharmacy.address}</p>
                <p className="text-xs text-pharma-green font-medium">Recherche livreur</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Formulaire de candidature</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Lettre de motivation */}
                <FormField
                  control={form.control}
                  name="motivationLetter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lettre de motivation *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Expliquez pourquoi vous souhaitez travailler pour cette pharmacie..."
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-motivation"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expérience */}
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expérience en livraison *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez votre expérience en livraison (moto, scooter, etc.)..."
                          {...field}
                          data-testid="textarea-experience"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Disponibilités */}
                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponibilités *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Lundi-Vendredi 8h-18h, Weekend disponible"
                          {...field}
                          data-testid="input-availability"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Téléphone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone de contact *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+225 XX XX XX XX"
                          {...field}
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Documents */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Documents à joindre</h4>
                  
                  <FormField
                    control={form.control}
                    name="idDocument"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>Carte d'identité *</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => field.onChange(e.target.files)}
                            data-testid="input-id-document"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="drivingLicense"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>Permis de conduire *</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => field.onChange(e.target.files)}
                            data-testid="input-driving-license"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cvDocument"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Upload className="h-4 w-4" />
                          <span>CV (optionnel)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={(e) => field.onChange(e.target.files)}
                            data-testid="input-cv"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-pharma-green hover:bg-pharma-green/90" 
                  disabled={isSubmitting || applicationMutation.isPending}
                  data-testid="button-submit-application"
                >
                  {isSubmitting || applicationMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Envoi en cours...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Upload className="h-4 w-4" />
                      <span>Envoyer la candidature</span>
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500 pb-8">
          Votre candidature sera examinée par la pharmacie sous 24-48h
        </div>
      </div>
    </div>
  );
}
