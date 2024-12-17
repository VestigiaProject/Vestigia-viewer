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
        console.log('Starting auth callback...');
        
        // Get the code from URL
        const code = new URL(window.location.href).searchParams.get('code');
        console.log('Auth code present:', !!code);
        
        if (!code) {
          console.error('No auth code found in URL');
          throw new Error('No auth code found');
        }

        // Exchange code for session
        console.log('Exchanging code for session...');
        const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (authError) {
          console.error('Auth error:', authError);
          throw authError;
        }

        if (!session?.user) {
          console.error('No session or user after exchange');
          throw new Error('Authentication failed');
        }

        console.log('Session obtained:', { userId: session.user.id });

        // Check if profile exists
        console.log('Checking for existing profile...');
        const { data: existingProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        console.log('Profile check result:', { existingProfile, error: profileError });

        if (!existingProfile) {
          console.log('Creating new profile...');
          const username = session.user.email?.split('@')[0] || `user_${session.user.id.slice(0, 8)}`;
          
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert([
              {
                id: session.user.id,
                username: username,
                start_date: new Date('1789-06-01').toISOString(),
              },
            ])
            .select()
            .single();

          console.log('Profile creation result:', { newProfile, error: insertError });

          if (insertError) {
            console.error('Failed to create profile:', insertError);
            throw insertError;
          }

          toast({
            title: 'Welcome!',
            description: 'Your account has been created successfully.',
          });
        } else {
          console.log('Existing profile found');
          toast({
            title: 'Welcome back!',
            description: 'You have been signed in successfully.',
          });
        }

        // Redirect to timeline
        console.log('Redirecting to timeline...');
        router.push('/timeline');
      } catch (error) {
        console.error('Error in auth callback:', error);
        toast({
          title: 'Error',
          description: 'There was a problem signing you in. Please try again.',
          variant: 'destructive',
        });
        router.push('/auth');
      }
    };

    handleCallback();
  }, [router, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Setting up your account...</h2>
        <p className="text-muted-foreground">Please wait while we complete your registration.</p>
      </div>
    </div>
  );
}