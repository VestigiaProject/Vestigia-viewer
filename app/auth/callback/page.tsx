'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = new URL(window.location.href).searchParams.get('code');
        
        if (!code) {
          throw new Error('No code provided');
        }

        // Exchange the code for a session
        const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
        if (sessionError) throw sessionError;

        if (!session?.user) {
          throw new Error('No user in session');
        }

        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert(
            {
              id: session.user.id,
              username: session.user.email?.split('@')[0] || `user_${Date.now()}`,
              start_date: new Date('1789-06-01').toISOString()
            },
            {
              onConflict: 'id',
              ignoreDuplicates: true
            }
          );

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          toast({
            title: 'Error',
            description: 'Failed to create user profile. Please try again.',
            variant: 'destructive',
          });
          throw profileError;
        }

        // Redirect to timeline
        router.push('/timeline');
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/auth');
      }
    };

    handleCallback();
  }, [router, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait while we set up your account.</p>
      </div>
    </div>
  );
}