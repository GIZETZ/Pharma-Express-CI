
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import BottomNavigation from "@/components/bottom-navigation";
import { ArrowLeft, Phone, Mail, Clock, MessageCircle } from "lucide-react";

export default function HelpCenter() {
  const [, setLocation] = useLocation();

  const goBack = () => {
    setLocation("/profile");
  };

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
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">
            Centre d'aide
          </h1>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Quick Actions */}
        <Card className="shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Besoin d'aide immédiate ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => window.location.href = 'tel:+2250767150156'}
              className="w-full bg-pharma-green hover:bg-pharma-green/90 h-12"
            >
              <Phone className="w-5 h-5 mr-2" />
              Appeler le support: +225 07 67 15 01 56
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = 'mailto:support@yahopharma.ci'}
                className="h-12"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://wa.me/2250767150156', '_blank')}
                className="h-12"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-pharma-green" />
              <div>
                <p className="font-medium text-gray-900">Heures d'ouverture du support</p>
                <p className="text-sm text-gray-600">Lundi - Vendredi : 8h00 - 18h00</p>
                <p className="text-sm text-gray-600">Samedi : 9h00 - 16h00</p>
                <p className="text-sm text-gray-600">Dimanche : Service d'urgence uniquement</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Questions fréquemment posées</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Comment passer une commande ?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p>1. Localisez une pharmacie près de chez vous</p>
                    <p>2. Prenez une photo de votre ordonnance ou choisissez vos produits</p>
                    <p>3. Confirmez votre adresse de livraison</p>
                    <p>4. Validez votre commande et suivez la livraison</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>Combien de temps dure la livraison ?</AccordionTrigger>
                <AccordionContent>
                  La livraison prend généralement entre 20 à 45 minutes selon la pharmacie et votre localisation. Vous pouvez suivre votre livreur en temps réel une fois la commande confirmée.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Quels sont les modes de paiement acceptés ?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p>• Paiement à la livraison (espèces)</p>
                    <p>• Mobile Money (Orange Money, MTN Money, Moov Money)</p>
                    <p>• Carte bancaire (Visa, Mastercard)</p>
                    <p>• Virement bancaire</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>Comment modifier mon adresse de livraison ?</AccordionTrigger>
                <AccordionContent>
                  Allez dans "Mon Profil" puis "Adresses de livraison" pour ajouter, modifier ou supprimer vos adresses. Vous pouvez utiliser la géolocalisation pour une localisation précise.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>Puis-je annuler ma commande ?</AccordionTrigger>
                <AccordionContent>
                  Vous pouvez annuler votre commande gratuitement tant qu'elle n'a pas été confirmée par la pharmacie. Une fois confirmée, contactez le support pour l'annulation.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>Comment devenir livreur partenaire ?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p>1. Créez un compte livreur dans l'application</p>
                    <p>2. Postulez auprès d'une pharmacie</p>
                    <p>3. Attendez la validation de votre candidature</p>
                    <p>4. Une fois accepté, commencez à recevoir des missions</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>Que faire si je reçois un mauvais produit ?</AccordionTrigger>
                <AccordionContent>
                  Contactez immédiatement le support via l'application ou par téléphone. Nous organiserons un échange gratuit dans les plus brefs délais. Gardez le produit et l'emballage original.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8">
                <AccordionTrigger>Comment fonctionne le programme de fidélité ?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p>• Gagnez des points à chaque commande</p>
                    <p>• 1 CFA dépensé = 1 point</p>
                    <p>• 100 points = 50 CFA de réduction</p>
                    <p>• Les points sont automatiquement ajoutés à votre compte</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9">
                <AccordionTrigger>Comment signaler un problème avec un livreur ?</AccordionTrigger>
                <AccordionContent>
                  Utilisez l'option "Signaler un problème" dans le suivi de commande ou contactez directement le support. Nous prenons tous les signalements au sérieux et agissons rapidement.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10">
                <AccordionTrigger>Mes données personnelles sont-elles sécurisées ?</AccordionTrigger>
                <AccordionContent>
                  Oui, nous utilisons un cryptage de niveau bancaire pour protéger vos données. Consultez notre politique de confidentialité pour plus de détails sur la protection de vos informations personnelles.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation currentPage="profile" />
    </div>
  );
}
