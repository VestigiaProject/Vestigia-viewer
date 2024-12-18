'use client';

import { createContext, useContext } from 'react';

type Language = 'fr' | 'en';

export type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}