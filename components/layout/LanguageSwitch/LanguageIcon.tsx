type LanguageIconProps = {
  language: 'fr' | 'en';
};

export function LanguageIcon({ language }: LanguageIconProps) {
  return (
    <span className="mr-2">
      {language === 'fr' ? '🇫🇷' : '🇬🇧'}
    </span>
  );
}