'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');

      if (code) {
        try {
          // Exchange the code for a session
          const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          if (sessionError) throw sessionError;

          if (session?.user) {
            // Check if user profile exists
            const { data: profile } = await supabase
              .from('user_profiles')
              .select()
              .eq('id', session.user.id)
              .single();

            // If profile doesn't exist, create it
            if (!profile) {
              const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                  id: session.user.id,
                  username: session.user.email?.split('@')[0],
                  start_date: new Date('1789-06-01').toISOString(),
                });

              if (profileError) {
                console.error('Error creating user profile:', profileError);
              }
            }
          }
        } catch (error) {
          console.error('Error handling auth callback:', error);
        }
      }

      // Redirect to the timeline page
      router.push('/timeline');
    }

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait while we set up your account.</p>
      </div>
    </div>
  );
}