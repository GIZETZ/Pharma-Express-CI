// Système de traduction simple pour Français/Anglais
export const translations = {
  fr: {
    // Navigation et général
    "welcome": "Bienvenue",
    "loading": "Chargement...",
    "error": "Erreur",
    "continue": "Continuer",
    "back": "Retour",
    "next": "Suivant",
    "cancel": "Annuler",
    "confirm": "Confirmer",
    "save": "Enregistrer",
    "edit": "Modifier",
    "delete": "Supprimer",
    
    // Authentification
    "login": "Se connecter",
    "register": "S'inscrire",
    "logout": "Se déconnecter",
    "phone": "Numéro de téléphone",
    "password": "Mot de passe",
    "confirmPassword": "Confirmer le mot de passe",
    "firstName": "Prénom",
    "lastName": "Nom",
    "address": "Adresse de domicile",
    "language": "Langue préférée",
    "alreadyHaveAccount": "Déjà un compte ?",
    "noAccountYet": "Pas encore de compte ?",
    "createAccount": "Créer votre compte",
    "loginToAccount": "Connectez-vous à votre compte",
    
    // Choix de langue
    "chooseLanguage": "Choisir votre langue",
    "languageDescription": "Sélectionnez votre langue préférée pour utiliser l'application",
    "french": "Français",
    "english": "English",
    
    // Onboarding
    "welcome_title": "Bienvenue chez Pharma Express CI",
    "welcome_description": "Votre pharmacie de proximité, livrée directement chez vous en Côte d'Ivoire",
    "getStarted": "Commencer",
    
    // Pages principales
    "home": "Accueil",
    "pharmacies": "Pharmacies",
    "camera": "Ordonnance",
    "delivery": "Livraison",
    "profile": "Profil",
    
    // Pharmacies
    "nearbyPharmacies": "Pharmacies à proximité",
    "searchPharmacies": "Rechercher des pharmacies",
    "openNow": "Ouvert maintenant",
    "closed": "Fermé",
    "deliveryTime": "Temps de livraison",
    "rating": "Note",
    "minutes": "min",
    
    // Ordonnances
    "uploadPrescription": "Télécharger une ordonnance",
    "takePrescriptionPhoto": "Prendre une photo de votre ordonnance",
    "uploadFromGallery": "Choisir depuis la galerie",
    "prescriptionUploaded": "Ordonnance téléchargée",
    "prescriptionProcessing": "Traitement en cours...",
    
    // Profil
    "myProfile": "Mon profil",
    "personalInfo": "Informations personnelles",
    "contactInfo": "Informations de contact",
    "preferences": "Préférences",
    "updateProfile": "Mettre à jour le profil",
    "profileUpdated": "Profil mis à jour avec succès",
    
    // Messages d'erreur et succès
    "loginSuccess": "Connexion réussie",
    "loginError": "Erreur de connexion",
    "registerSuccess": "Inscription réussie",
    "registerError": "Erreur d'inscription",
    "passwordsDontMatch": "Les mots de passe ne correspondent pas",
    "phoneRequired": "Le numéro de téléphone est requis",
    "passwordRequired": "Le mot de passe est requis",
    "fieldRequired": "Ce champ est requis",
    
    // PWA
    "installApp": "Installer l'application",
    "installPrompt": "Ajouter Pharma Express CI à votre écran d'accueil"
  },
  
  en: {
    // Navigation and general
    "welcome": "Welcome",
    "loading": "Loading...",
    "error": "Error",
    "continue": "Continue",
    "back": "Back",
    "next": "Next",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "save": "Save",
    "edit": "Edit",
    "delete": "Delete",
    
    // Authentication
    "login": "Log in",
    "register": "Sign up",
    "logout": "Log out",
    "phone": "Phone number",
    "password": "Password",
    "confirmPassword": "Confirm password",
    "firstName": "First name",
    "lastName": "Last name",
    "address": "Home address",
    "language": "Preferred language",
    "alreadyHaveAccount": "Already have an account?",
    "noAccountYet": "Don't have an account yet?",
    "createAccount": "Create your account",
    "loginToAccount": "Log in to your account",
    
    // Language choice
    "chooseLanguage": "Choose your language",
    "languageDescription": "Select your preferred language to use the app",
    "french": "Français",
    "english": "English",
    
    // Onboarding
    "welcome_title": "Welcome to Pharma Express CI",
    "welcome_description": "Your neighborhood pharmacy, delivered directly to your home in Côte d'Ivoire",
    "getStarted": "Get Started",
    
    // Main pages
    "home": "Home",
    "pharmacies": "Pharmacies",
    "camera": "Prescription",
    "delivery": "Delivery",
    "profile": "Profile",
    
    // Pharmacies
    "nearbyPharmacies": "Nearby Pharmacies",
    "searchPharmacies": "Search pharmacies",
    "openNow": "Open now",
    "closed": "Closed",
    "deliveryTime": "Delivery time",
    "rating": "Rating",
    "minutes": "min",
    
    // Prescriptions
    "uploadPrescription": "Upload prescription",
    "takePrescriptionPhoto": "Take a photo of your prescription",
    "uploadFromGallery": "Choose from gallery",
    "prescriptionUploaded": "Prescription uploaded",
    "prescriptionProcessing": "Processing...",
    
    // Profile
    "myProfile": "My profile",
    "personalInfo": "Personal information",
    "contactInfo": "Contact information",
    "preferences": "Preferences",
    "updateProfile": "Update profile",
    "profileUpdated": "Profile updated successfully",
    
    // Error and success messages
    "loginSuccess": "Login successful",
    "loginError": "Login error",
    "registerSuccess": "Registration successful",
    "registerError": "Registration error",
    "passwordsDontMatch": "Passwords don't match",
    "phoneRequired": "Phone number is required",
    "passwordRequired": "Password is required",
    "fieldRequired": "This field is required",
    
    // PWA
    "installApp": "Install app",
    "installPrompt": "Add Pharma Express CI to your home screen"
  }
};

export type Language = 'fr' | 'en';
export type TranslationKey = keyof typeof translations.fr;

export function getTranslation(key: TranslationKey, language: Language): string {
  return translations[language][key] || translations['fr'][key] || key;
}

// Hook pour utiliser les traductions
export function useTranslation(language: Language = 'fr') {
  return {
    t: (key: TranslationKey) => getTranslation(key, language),
    language
  };
}