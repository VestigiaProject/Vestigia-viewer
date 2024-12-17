'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuthState } from '@/lib/types/auth';
import { START_DATE } from '@/lib/constants';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          try {
            // Get or create user profile
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .upsert({
                id: session?.user?.id,
                start_date: START_DATE,
              })
              .select('*')
              .single();

            if (profileError) throw profileError;

            setAuthState({
              user: {
                id: session?.user?.id!,
                email: session?.user?.email!,
                username: profile?.username,
                startDate: profile?.start_date,
              },
              loading: false,
              error: null,
            });
          } catch (error) {
            setAuthState({
              user: null,
              loading: false,
              error: error as Error,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return authState;
}