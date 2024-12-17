'use client';

import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { generateNonce } from './nonce';
import { CredentialResponse } from './types';

export function GoogleOneTap() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const initializeGoogleOneTap = async () => {
      const [nonce, hashedNonce] = await generateNonce();

      // Check for existing session
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      }
      if (data.session) {
        router.push('/timeline');
        return;
      }

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: async (response: CredentialResponse) => {
          try {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              nonce,
            });

            if (error) throw error;
            router.push('/timeline');
          } catch (error) {
            console.error('Error logging in with Google One Tap:', error);
          }
        },
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        cancel_on_tap_outside: false,
        context: 'signin',
      });
      
      window.google.accounts.id.prompt();
    };

    // Initialize after the script loads
    const scriptLoaded = () => {
      initializeGoogleOneTap();
    };

    if (window.google?.accounts?.id) {
      scriptLoaded();
    }
  }, [router]);

  return (
    <>
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Google Identity Services script loaded');
        }}
      />
      <div id="oneTap" className="fixed top-0 right-0 z-[100]" />
    </>
  );
}