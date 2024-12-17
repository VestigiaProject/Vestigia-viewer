'use client';

import { ProfileHeader } from './ProfileHeader';
import { ProfilePosts } from './ProfilePosts';
import { useTimeProgress } from '@/lib/hooks/useTimeProgress';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchFigureProfile, fetchFigurePostCount } from '@/lib/api/figures';
import { useEffect, useState } from 'react';
import type { HistoricalFigure } from '@/lib/supabase';

const START_DATE = '1789-06-01';

export function ProfileContent({ id }: { id: string }) {
  const { currentDate } = useTimeProgress(START_DATE);
  const [figure, setFigure] = useState<HistoricalFigure | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [id]);

  async function loadProfile() {
    try {
      const [profile, count] = await Promise.all([
        fetchFigureProfile(id),
        fetchFigurePostCount(id, currentDate)
      ]);
      setFigure(profile);
      setPostCount(count);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!figure && loading) {
    return null; // Let Suspense handle loading state
  }

  if (!figure) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Historical figure not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader figure={figure} postCount={postCount} />
      <ProfilePosts figureId={id} currentDate={currentDate} />
    </div>
  );
}