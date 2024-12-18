'use client';

import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

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
            console.error('Error setting initial language:', updateError);
            toast({
              title: 'Error',
              description: 'Failed to save language preference. Please try again.',
              variant: 'destructive',
            });
          }
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
        toast({
          title: 'Error',
          description: 'Failed to load language preference. Using default.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguagePreference();
  }, [user, language, toast]);

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
        title: 'Success',
        description: newLanguage === 'en' ? 'Switched to English' : 'Passé en français',
      });
    } catch (error) {
      console.error('Error updating language preference:', error);
      toast({
        title: 'Error',
        description: 'Failed to update language preference. Please try again.',
        variant: 'destructive',
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