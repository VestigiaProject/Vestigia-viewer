'use client';

import { Button } from '@/components/ui/button';
import { ScrollText, Chrome } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <ScrollText className="h-20 w-20 text-blue-400" />
          <h1 className="text-4xl md:text-6xl font-bold">Scroll History</h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl">
            Experience history as it happened, through the lens of social media.
            Start your journey with the French Revolution.
          </p>
          <div className="space-y-4">
            <Button
              size="lg"
              className="bg-blue-500 hover:bg-blue-600"
              onClick={handleGoogleLogin}
              disabled={authLoading}
            >
              <Chrome className="mr-2 h-5 w-5" />
              {authLoading ? 'Signing in...' : 'Sign in with Google'}
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
            <FeatureCard
              title="Historical Timeline"
              description="Experience history chronologically through social media posts from historical figures."
            />
            <FeatureCard
              title="Interactive Experience"
              description="Like and comment on historical events as they unfold in your timeline."
            />
            <FeatureCard
              title="Real-time Progression"
              description="Time moves forward from your start date, revealing new historical content."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}