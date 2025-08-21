
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BottomNavigation from "@/components/bottom-navigation";
import { ArrowLeft, Shield, Eye, Lock, Users, Phone, Mail } from "lucide-react";

export default function PrivacyPolicy() {
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
            Politique de confidentialité
          </h1>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Introduction */}
        <Card className="shadow-sm mb-6">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-pharma-green" />
              <CardTitle className="text-lg">Votre vie privée est importante</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed">
              Chez Pharma Express CI, nous nous engageons à protéger vos données personnelles. 
              Cette politique explique comment nous collectons, utilisons et protégeons vos informations 
              lorsque vous utilisez notre application de livraison de médicaments.
            </p>
            <div className="mt-4 p-3 bg-pharma-green/10 rounded-lg">
              <p className="text-sm text-pharma-green font-medium">
                Dernière mise à jour : 15 août 2025
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card className="shadow-sm mb-6">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Eye className="w-5 h-5 text-pharma-green" />
              <CardTitle className="text-base">Informations que nous collectons</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Informations personnelles</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Nom et prénom</li>
                <li>• Numéro de téléphone</li>
                <li>• Adresse email (optionnelle)</li>
                <li>• Adresses de livraison</li>
                <li>• Photo de profil (optionnelle)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Informations de localisation</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Localisation GPS (avec votre permission)</li>
                <li>• Adresses de livraison sauvegardées</li>
                <li>• Historique des trajets (pour les livreurs)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Informations de commande</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Photos d'ordonnances</li>
                <li>• Historique des achats</li>
                <li>• Préférences de paiement</li>
                <li>• Évaluations et commentaires</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Usage */}
        <Card className="shadow-sm mb-6">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-pharma-green" />
              <CardTitle className="text-base">Comment nous utilisons vos données</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Fourniture du service</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Traitement de vos commandes</li>
                  <li>• Géolocalisation des pharmacies</li>
                  <li>• Coordination des livraisons</li>
                  <li>• Support client personnalisé</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Amélioration du service</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Analyse des tendances d'utilisation</li>
                  <li>• Optimisation des trajets de livraison</li>
                  <li>• Développement de nouvelles fonctionnalités</li>
                  <li>• Prévention des fraudes</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Communication</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Notifications sur le statut des commandes</li>
                  <li>• Alertes importantes de sécurité</li>
                  <li>• Offres promotionnelles (avec consentement)</li>
                  <li>• Enquêtes de satisfaction</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="shadow-sm mb-6">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-pharma-green" />
              <CardTitle className="text-base">Protection de vos données</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Mesures techniques</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Cryptage SSL/TLS pour toutes les transmissions</li>
                  <li>• Bases de données sécurisées avec accès limité</li>
                  <li>• Authentification à deux facteurs pour le personnel</li>
                  <li>• Sauvegarde régulière et sécurisée des données</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Mesures organisationnelles</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Formation du personnel sur la protection des données</li>
                  <li>• Accès aux données sur principe du "besoin de savoir"</li>
                  <li>• Audits de sécurité réguliers</li>
                  <li>• Procédures de notification en cas d'incident</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card className="shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-base">Partage de données</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Nous ne vendons jamais vos données personnelles. Nous partageons uniquement les informations nécessaires avec :
            </p>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Pharmacies partenaires</h4>
                <p className="text-sm text-gray-600">Uniquement les informations nécessaires pour traiter vos commandes</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Livreurs agréés</h4>
                <p className="text-sm text-gray-600">Adresse de livraison et informations de contact pour la livraison</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Prestataires de service</h4>
                <p className="text-sm text-gray-600">Services de paiement et d'hébergement sécurisés uniquement</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Rights */}
        <Card className="shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-base">Vos droits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Accès et rectification</h4>
                <p className="text-sm text-gray-600">Vous pouvez consulter et modifier vos données personnelles dans votre profil</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Suppression</h4>
                <p className="text-sm text-gray-600">Vous pouvez demander la suppression de votre compte et de vos données</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Portabilité</h4>
                <p className="text-sm text-gray-600">Vous pouvez demander une copie de vos données dans un format lisible</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Opposition</h4>
                <p className="text-sm text-gray-600">Vous pouvez vous opposer au traitement de vos données à des fins marketing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card className="shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-base">Cookies et technologies similaires</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Nous utilisons des cookies et technologies similaires pour :
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Maintenir votre session connectée</li>
              <li>• Mémoriser vos préférences</li>
              <li>• Analyser l'utilisation de l'application</li>
              <li>• Personnaliser votre expérience</li>
            </ul>
            <p className="text-sm text-gray-600 mt-3">
              Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-base">Nous contacter</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Pour toute question concernant cette politique ou vos données personnelles :
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-pharma-green" />
                <span className="text-sm text-gray-900">+225 07 67 15 01 56</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-pharma-green" />
                <span className="text-sm text-gray-900">privacy@yahopharma.ci</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">
                Responsable de la protection des données :<br />
                Pharma Express CI<br />
                Abidjan, Côte d'Ivoire
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Updates */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Modifications de cette politique</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Nous pouvons mettre à jour cette politique de confidentialité occasionnellement. 
              Les modifications importantes seront communiquées via l'application ou par email. 
              La date de dernière mise à jour est indiquée en haut de cette page.
            </p>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation currentPage="profile" />
    </div>
  );
}
