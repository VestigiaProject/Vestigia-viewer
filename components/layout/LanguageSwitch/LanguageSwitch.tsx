'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { LanguageIcon } from './LanguageIcon';
import { getLanguageLabel } from './utils';

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="w-full justify-start"
    >
      <LanguageIcon language={language} />
      <span>{getLanguageLabel(language)}</span>
    </Button>
  );
}