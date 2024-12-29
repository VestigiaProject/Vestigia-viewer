'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { UserProfile } from '../supabase';
import { useAuth } from './useAuth';
import { handleError } from '@/lib/utils/error-handler';
import { useTranslation } from '@/lib/hooks/useTranslation';

export function useUserProfile() {
  const { user } = useAuth();
  const { t } = useTranslation();
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
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        handleError(error, {
          userMessage: t('error.load_profile_failed'),
          context: { userId: user.id }
        });
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user, t]);

  return { profile, loading };
}