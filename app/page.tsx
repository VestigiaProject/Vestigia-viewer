'use client';

import { Button } from '@/components/ui/button';
import { ScrollText, Chrome } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/lib/hooks/useTranslation';

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
      console.error('Error:', error);
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
      <div className="relative min-h-screen flex items-center">
        <div className="w-full px-4 py-8 md:py-16">
          <div className="flex flex-col items-center justify-center space-y-8 text-center max-w-4xl mx-auto">
            <ScrollText className="h-16 w-16 md:h-20 md:w-20 text-blue-400" />
            <h1 className="text-3xl md:text-6xl font-bold text-white bg-clip-text">{t('landing.title')}</h1>
            <p className="text-lg md:text-2xl text-blue-400 font-medium">
              {t('landing.tagline')}
            </p>
            <p className="text-lg md:text-2xl text-gray-200 max-w-2xl">
              {t('landing.subtitle')}
            </p>
            <div className="space-y-4">
              <Button
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleGoogleLogin}
                disabled={authLoading}
              >
                <Chrome className="mr-2 h-5 w-5" />
                {authLoading ? t('landing.signing_in') : t('landing.signin_google')}
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 w-full">
              <FeatureCard
                title={t('landing.feature.timeline.title')}
                description={t('landing.feature.timeline.desc')}
              />
              <FeatureCard
                title={t('landing.feature.interactive.title')}
                description={t('landing.feature.interactive.desc')}
              />
              <FeatureCard
                title={t('landing.feature.realtime.title')}
                description={t('landing.feature.realtime.desc')}
              />
            </div>
            
            {/* Logo section */}
            <div className="mt-16 flex flex-col items-center space-y-4">
              <p className="text-gray-300 text-sm">{t('landing.logo')}</p>
              <img 
                src="/vestigialogo.png" 
                alt="Vestigia Logo" 
                className="h-16 w-auto opacity-70 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 rounded-lg border border-gray-600 bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-colors">
      <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
}