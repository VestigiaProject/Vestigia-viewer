'use client';

import { Button } from '@/components/ui/button';
import { ScrollText, Chrome } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { handleError } from '@/lib/utils/error-handler';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      router.push('/timeline');
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/timeline`,
        },
      });
      if (error) throw error;
    } catch (error) {
      handleError(error, {
        userMessage: t('error.google_login_failed'),
        context: { origin: window.location.origin }
      });
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading || user) {
    return null; // Don't show landing page while checking auth or if user is logged in
  }

  return (
    <div className="min-h-screen relative">
      {/* Background image with overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://ocubfcrajgjmdzymcwbu.supabase.co/storage/v1/object/public/landingpage/landing1.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          width: '100%',
          height: '100%'
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">
            {t('landing.title')}
          </h1>
          <p className="text-xl sm:text-2xl text-gray-200">
            {t('landing.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="bg-white text-black hover:bg-gray-100"
            >
              <Chrome className="mr-2 h-5 w-5" />
              {authLoading ? t('auth.signing_in') : t('auth.sign_in_with_google')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              asChild
            >
              <a href="https://github.com/yourusername/yourproject" target="_blank" rel="noopener noreferrer">
                <ScrollText className="mr-2 h-5 w-5" />
                {t('landing.learn_more')}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}