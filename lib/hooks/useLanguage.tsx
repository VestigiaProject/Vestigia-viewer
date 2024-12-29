'use client';

import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';
import { handleError } from '@/lib/utils/error-handler';

export type Language = 'fr' | 'en';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isLoading: boolean;
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Try to get the initial language from localStorage
const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'fr';
  const storedLanguage = localStorage.getItem('language');
  return (storedLanguage === 'en' || storedLanguage === 'fr') ? storedLanguage : 'fr';
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
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
        const { data: profile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('language')
          .eq('id', user.id)
          .single();

        if (fetchError) throw fetchError;

        if (profile?.language) {
          const profileLanguage = profile.language as Language;
          setLanguageState(profileLanguage);
          localStorage.setItem('language', profileLanguage);
        } else {
          // If user has no language preference set, save the current one
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ language })
            .eq('id', user.id);

          if (updateError) {
            handleError(updateError, {
              userMessage: 'Failed to save language preference',
              context: { userId: user.id, language }
            });
          }
        }
      } catch (error) {
        handleError(error, {
          userMessage: 'Failed to load language preference',
          context: { userId: user.id }
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguagePreference();
  }, [user, language]);

  // Save language preference to user profile and localStorage
  const setLanguage = async (newLanguage: Language) => {
    setIsLoading(true);

    try {
      if (!user) {
        setLanguageState(newLanguage);
        localStorage.setItem('language', newLanguage);
        return;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ language: newLanguage })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setLanguageState(newLanguage);
      localStorage.setItem('language', newLanguage);
      
      toast({
        title: 'Language Updated',
        description: newLanguage === 'en' ? 'Switched to English' : 'Passé en français',
      });
    } catch (error) {
      handleError(error, {
        userMessage: 'Failed to update language preference',
        context: { 
          userId: user?.id,
          newLanguage,
          currentLanguage: language
        }
      });
    } finally {
      setIsLoading(false);
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