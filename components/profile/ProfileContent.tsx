'use client';

import { ProfileHeader } from './ProfileHeader';
import { ProfilePosts } from './ProfilePosts';
import { useTimeProgress } from '@/lib/hooks/useTimeProgress';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchFigureProfile, fetchFigurePostCount } from '@/lib/api/figures';
import { useEffect, useState } from 'react';
import type { HistoricalFigure } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/hooks/useTranslation';

const START_DATE = '1789-06-01';

export function ProfileContent({ id }: { id: string }) {
  const router = useRouter();
  const { t } = useTranslation();
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
      <div className="container max-w-2xl mx-auto py-4">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/timeline')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('app.back_to_timeline')}
          </Button>
        </div>
      </div>
      <ProfileHeader figure={figure} postCount={postCount} />
      <ProfilePosts figureId={id} currentDate={currentDate} />
    </div>
  );
}