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
            // Check if user profile exists
            const { data: profile } = await supabase
              .from('user_profiles')
              .select()
              .eq('id', session.user.id)
              .single();

            // If profile doesn't exist, create it
            if (!profile) {
              await supabase
                .from('user_profiles')
                .insert({
                  id: session.user.id,
                  username: session.user.email?.split('@')[0] || `user_${session.user.id.slice(0, 8)}`,
                  start_date: new Date('1789-06-01').toISOString()
                });
            }
          }
        }
        
        // Redirect to timeline after successful authentication
        router.push('/timeline');
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