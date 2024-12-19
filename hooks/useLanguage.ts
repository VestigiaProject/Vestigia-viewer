'use client';

import { useState, useEffect } from 'react';

export function useLanguage() {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // Get language from localStorage or default to 'en'
    const storedLanguage = localStorage.getItem('language') || 'en';
    setLanguage(storedLanguage);
  }, []);

  const changeLanguage = (newLanguage: string) => {
    localStorage.setItem('language', newLanguage);
    setLanguage(newLanguage);
  };

  return { language, changeLanguage };
} 