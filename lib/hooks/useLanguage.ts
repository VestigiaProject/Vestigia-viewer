'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useUserProfile } from './useUserProfile';
import { supabase } from '../supabase';

type Language = 'fr' | 'en';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useUserProfile();
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    if (profile?.language) {
      setLanguageState(profile.language as Language);
    }
  }, [profile]);

  const setLanguage = async (lang: Language) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ language: lang })
        .eq('id', profile.id);

      if (error) throw error;
      setLanguageState(lang);
    } catch (error) {
      console.error('Error updating language:', error);
    }
  };

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