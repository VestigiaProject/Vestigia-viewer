'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/hooks/useLanguage';

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
      className="w-full justify-start"
    >
      <span className="mr-2">{language === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
      {language === 'fr' ? 'Switch to English' : 'Passer en français'}
    </Button>
  );
}