import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";

export default function LanguageSelection() {
  const [, setLocation] = useLocation();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(language);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);

  const selectLanguage = (lang: Language) => {
    setSelectedLanguage(lang);
    setLanguage(lang); // Mettre à jour le contexte global
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      setLocation("/onboarding");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-pharma-bg">
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-pharma-green rounded-2xl mb-6">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="app-title">
            Pharma Express CI
          </h1>
          <p className="text-gray-600">Livraison de médicaments à domicile</p>
        </div>
        
        <div className="w-full max-w-sm space-y-4 mb-12">
          <h2 className="text-lg font-semibold text-center text-gray-900 mb-6">
            {t('chooseLanguage').toUpperCase()}
          </h2>
          
          <Button
            variant={selectedLanguage === 'fr' ? 'default' : 'outline'}
            className="w-full py-4 px-6 h-auto text-gray-900 font-medium border-2 rounded-xl hover:border-pharma-green transition-colors"
            onClick={() => selectLanguage('fr')}
            data-testid="button-language-french"
          >
            🇫🇷 {t('french').toUpperCase()}
          </Button>
          
          <Button
            variant={selectedLanguage === 'en' ? 'default' : 'outline'}
            className="w-full py-4 px-6 h-auto text-gray-900 font-medium border-2 rounded-xl hover:border-pharma-green transition-colors"
            onClick={() => selectLanguage('en')}
            data-testid="button-language-english"
          >
            🇬🇧 {t('english').toUpperCase()}
          </Button>
        </div>
        
        <div className="w-full max-w-sm space-y-3">
          <Button
            variant="outline"
            className="w-full py-3 px-6 border border-pharma-green text-pharma-green rounded-xl font-medium hover:bg-pharma-green hover:text-white transition-colors"
            onClick={() => setLocation("/login")}
            data-testid="button-login"
          >
            {t('login')}
          </Button>
          <Button
            variant="ghost"
            className="w-full py-3 px-6 text-pharma-green font-medium"
            onClick={() => setLocation("/register")}
            data-testid="button-register"
          >
            {t('register')}
          </Button>
        </div>
      </div>
    </div>
  );
}
