// ... previous imports remain the same
import { Languages } from 'lucide-react';
import { useLanguage } from '@/lib/hooks/useLanguage';

export function Navbar() {
  // ... previous state declarations remain the same
  const { language, setLanguage } = useLanguage();

  return (
    <>
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex-1 flex items-center">
            <div className="font-semibold">Scroll History</div>
            {isTimeline && (
              <div className="ml-4 flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(currentDate, 'MMMM d, yyyy')}</span>
                <span className="text-xs">({daysElapsed} days elapsed)</span>
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
              <DropdownMenuItem onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}>
                <Languages className="mr-2 h-4 w-4" />
                {language === 'fr' ? 'Switch to English' : 'Passer en français'}
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
      {/* ... rest of the component remains the same */}
    </>
  );
}