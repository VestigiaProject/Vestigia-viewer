'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useTimeProgress } from '@/lib/hooks/useTimeProgress';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { Settings, LogOut, Clock, Calendar, Languages } from 'lucide-react';
import { useState } from 'react';
import { ProfileSettingsDialog } from './ProfileSettingsDialog';
import { TimePeriodDialog } from './TimePeriodDialog';
import { format } from 'date-fns';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { fr } from 'date-fns/locale';

const START_DATE = '1789-06-01';

export function Navbar() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { language, setLanguage, isLoading } = useLanguage();
  const { t } = useTranslation();
  const { currentDate, daysElapsed } = useTimeProgress(START_DATE);
  const router = useRouter();
  const pathname = usePathname();
  const [showSettings, setShowSettings] = useState(false);
  const [showTimePeriod, setShowTimePeriod] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const toggleLanguage = async () => {
    await setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  if (!user) return null;

  const isTimeline = pathname === '/timeline';

  return (
    <>
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex-1 flex items-center">
            <div className="font-semibold">{t('app.title')}</div>
            {isTimeline && (
              <div className="ml-4 flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(currentDate, language === 'fr' ? 'd MMMM yyyy' : 'MMMM d, yyyy', { locale: language === 'fr' ? fr : undefined })}</span>
                <span className="text-xs">({daysElapsed} {t('timeline.days_elapsed')})</span>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>
                    {profile?.username?.[0].toUpperCase() || user.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={toggleLanguage} disabled={isLoading}>
                <Languages className="mr-2 h-4 w-4" />
                {language === 'fr' ? t('language.switch_to_english') : t('language.switch_to_french')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowTimePeriod(true)}>
                <Clock className="mr-2 h-4 w-4" />
                {t('timeline.set_time_period')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                <Settings className="mr-2 h-4 w-4" />
                {t('settings.title')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('auth.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
      <ProfileSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
      <TimePeriodDialog
        open={showTimePeriod}
        onOpenChange={setShowTimePeriod}
      />
    </>
  );
}