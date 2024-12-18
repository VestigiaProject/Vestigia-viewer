'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type LanguageStore = {
  language: 'fr' | 'en';
  setLanguage: (language: 'fr' | 'en') => void;
};

export const useLanguage = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'fr',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'language-storage',
    }
  )
);