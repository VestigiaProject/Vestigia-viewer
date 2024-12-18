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
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, Languages } from 'lucide-react';
import { useState } from 'react';
import { ProfileSettingsDialog } from './ProfileSettingsDialog';
import { TimePeriodDialog } from './TimePeriodDialog';
import { LanguageDialog } from './LanguageDialog';

export function Navbar() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showTimePeriod, setShowTimePeriod] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!user) return null;

  return (
    <>
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="font-semibold">Scroll History</div>
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
              <DropdownMenuItem onClick={() => setLanguage(true)}>
                <Languages className="mr-2 h-4 w-4" />
                Language
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowTimePeriod(true)}>
                <Clock className="mr-2 h-4 w-4" />
                Set Time Period
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
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
      <LanguageDialog
        open={showLanguage}
        onOpenChange={setShowLanguage}
      />
    </>
  );
}