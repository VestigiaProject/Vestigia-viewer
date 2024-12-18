'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/context/LanguageContext';
import { cn } from '@/lib/utils';

type LanguageOption = {
  code: 'fr' | 'en';
  label: string;
  name: string;
};

const languages: LanguageOption[] = [
  {
    code: 'fr',
    label: '🇫🇷',
    name: 'Français',
  },
  {
    code: 'en',
    label: '🇬🇧',
    name: 'English',
  },
];

type LanguageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LanguageDialog({ open, onOpenChange }: LanguageDialogProps) {
  const { language, setLanguage } = useLanguage();

  const handleSelectLanguage = async (lang: 'fr' | 'en') => {
    await setLanguage(lang);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Choose Language</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                language === lang.code && "border-2 border-primary"
              )}
              onClick={() => handleSelectLanguage(lang.code)}
            >
              <span className="mr-2 text-lg">{lang.label}</span>
              {lang.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}