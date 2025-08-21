import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Language } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Récupérer la langue sauvegardée dans localStorage
    const saved = localStorage.getItem('pharma-language');
    return (saved as Language) || 'fr';
  });

  useEffect(() => {
    // Sauvegarder la langue dans localStorage
    localStorage.setItem('pharma-language', language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}