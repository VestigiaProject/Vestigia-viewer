'use client';

import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

type Language = 'fr' | 'en';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isLoading: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Try to get the initial language from localStorage
const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'fr';
  const storedLanguage = localStorage.getItem('language');
  return (storedLanguage === 'en' || storedLanguage === 'fr') ? storedLanguage : 'fr';
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [isLoading, setIsLoading] = useState(true);

  // Sync with localStorage whenever language changes
  useEffect(() => {
    if (language) {
      localStorage.setItem('language', language);
    }
  }, [language]);

  // Load language preference from user profile
  useEffect(() => {
    const loadLanguagePreference = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('language')
          .eq('id', user.id)
          .single();

        if (profile?.language) {
          const profileLanguage = profile.language as Language;
          setLanguageState(profileLanguage);
          localStorage.setItem('language', profileLanguage);
        } else {
          // If user has no language preference set, save the current one
          const { error } = await supabase
            .from('user_profiles')
            .update({ language })
            .eq('id', user.id);

          if (error) throw error;
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguagePreference();
  }, [user, language]);

  // Save language preference to user profile and localStorage
  const setLanguage = async (newLanguage: Language) => {
    // Always update state and localStorage immediately
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);

    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ language: newLanguage })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating language preference:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
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