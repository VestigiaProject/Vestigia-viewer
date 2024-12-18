'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';

type Language = 'fr' | 'en';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    if (user) {
      loadUserLanguage();
    }
  }, [user]);

  const loadUserLanguage = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_profiles')
      .select('preferred_language')
      .eq('id', user.id)
      .single();

    if (data?.preferred_language) {
      setLanguageState(data.preferred_language as Language);
    }
  };

  const setLanguage = async (newLanguage: Language) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ preferred_language: newLanguage })
        .eq('id', user.id);

      if (error) throw error;

      setLanguageState(newLanguage);
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