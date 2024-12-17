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
        const code = new URL(window.location.href).searchParams.get('code');
        console.log('Auth code present:', !!code);
        
        if (code) {
          console.log('Exchanging code for session...');
          const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (authError) {
            console.error('Auth error:', authError);
            throw authError;
          }
          
          if (session) {
            console.log('Session obtained:', session.user.id);
            
            // Check if user profile exists
            console.log('Checking for existing profile...');
            const { data: profile, error: profileCheckError } = await supabase
              .from('user_profiles')
              .select()
              .eq('id', session.user.id)
              .single();

            console.log('Profile check result:', { profile, error: profileCheckError });

            if (profileCheckError && profileCheckError.code !== 'PGRST116') {
              console.error('Profile check error:', profileCheckError);
              throw profileCheckError;
            }

            // If profile doesn't exist, create it
            if (!profile) {
              console.log('Creating new profile...');
              const username = session.user.email?.split('@')[0] || `user_${session.user.id.slice(0, 8)}`;
              const newProfile = {
                id: session.user.id,
                username,
                start_date: new Date('1789-06-01').toISOString()
              };
              console.log('New profile data:', newProfile);

              const { data: insertData, error: insertError } = await supabase
                .from('user_profiles')
                .insert([newProfile])
                .select()
                .single();

              console.log('Insert result:', { data: insertData, error: insertError });

              if (insertError) {
                console.error('Insert error:', insertError);
                throw insertError;
              }

              console.log('Profile created successfully');
              toast({
                title: "Welcome!",
                description: "Your account has been set up successfully.",
              });
            } else {
              console.log('Profile already exists');
            }

            console.log('Redirecting to timeline...');
            router.push('/timeline');
          }
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        toast({
          title: "Error",
          description: "There was a problem setting up your account. Please try again.",
          variant: "destructive",
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