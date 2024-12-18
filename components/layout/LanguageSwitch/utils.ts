export function getLanguageLabel(currentLanguage: 'fr' | 'en'): string {
  return currentLanguage === 'fr' ? 'Switch to English' : 'Passer en français';
}