'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useLanguage } from './useLanguage';
import { handleError } from '@/lib/utils/error-handler';

type Translations = Record<string, { fr: string; en: string }>;

type TranslationContextType = {
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const { data, error } = await supabase
          .from('ui_translations')
          .select('key, fr, en');

        if (error) throw error;

        const translationsMap = data.reduce((acc, { key, fr, en }) => {
          acc[key] = { fr, en };
          return acc;
        }, {} as Translations);

        setTranslations(translationsMap);
      } catch (error) {
        handleError(error, {
          userMessage: 'Failed to load translations',
          context: {}
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, []);

  const t = (key: string, params?: Record<string, string | number>): string => {
    if (!translations[key]) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }

    let text = language === 'en' ? translations[key].en : translations[key].fr;

    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, String(value));
      });
    }

    return text;
  };

  return (
    <TranslationContext.Provider value={{ t, isLoading }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
} 