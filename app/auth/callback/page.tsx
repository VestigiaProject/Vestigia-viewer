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
        
        if (code) {
          const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (authError) throw authError;
          
          if (session) {
            // Check if user profile exists
            const { data: profile, error: profileCheckError } = await supabase
              .from('user_profiles')
              .select()
              .eq('id', session.user.id)
              .single();

            if (profileCheckError && profileCheckError.code !== 'PGRST116') {
              throw profileCheckError;
            }

            // If profile doesn't exist, create it
            if (!profile) {
              const { error: insertError } = await supabase
                .from('user_profiles')
                .insert({
                  id: session.user.id,
                  username: session.user.email?.split('@')[0] || `user_${session.user.id.slice(0, 8)}`,
                  start_date: new Date('1789-06-01').toISOString()
                });

              if (insertError) {
                throw insertError;
              }

              toast({
                title: "Welcome!",
                description: "Your account has been set up successfully.",
              });
            }

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