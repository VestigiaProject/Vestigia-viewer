'use client';

import { useUserProfile } from './useUserProfile';

export function useLocalization() {
  const { profile } = useUserProfile();
  const isEnglish = profile?.language === 'en';

  const getLocalizedContent = (content: string | undefined | null, contentEn: string | undefined | null) => {
    if (isEnglish && contentEn) {
      return contentEn;
    }
    return content || '';
  };

  return {
    isEnglish,
    getLocalizedContent
  };
}