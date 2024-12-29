'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { UserProfile } from '../supabase';
import { useAuth } from './useAuth';

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setProfile(data);
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  return { profile, loading };
}