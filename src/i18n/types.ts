import { en } from './en';

export type Language = 'en' | 'es';
export type TranslationDictionary = typeof en;

// Helper to get nested keys type safe, though for now we might use string for flexibility in the hook
export type I18nContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
};
