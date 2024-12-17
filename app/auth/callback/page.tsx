'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = new URL(window.location.href).searchParams.get('code');
        
        if (code) {
          const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (session) {
            // Redirect to timeline after successful authentication
            // The user profile will be created automatically by the database trigger
            router.push('/timeline');
          }
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.push('/auth');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait while we set up your account.</p>
      </div>
    </div>
  );
}