'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { HistoricalFigure } from '@/lib/supabase';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useTranslation } from '@/lib/hooks/useTranslation';

type ProfileHeaderProps = {
  figure: HistoricalFigure;
  postCount: number;
};

export function ProfileHeader({ figure, postCount }: ProfileHeaderProps) {
  const { language } = useLanguage();
  const { t } = useTranslation();

  const title = language === 'en' && figure.title_en ? figure.title_en : figure.title;
  const biography = language === 'en' && figure.biography_en ? figure.biography_en : figure.biography;

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Card className="rounded-none border-x-0">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-500" />
        <div className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <Avatar className="h-24 w-24 -mt-12 border-4 border-background">
                <AvatarImage src={figure.profile_image} />
                <AvatarFallback>{figure.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{figure.name}</h1>
              <p className="text-muted-foreground">{title}</p>
            </div>
            <p className="text-sm">{biography}</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{postCount} {t('timeline.posts')}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Card className="rounded-none border-x-0">
        <div className="h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
        <div className="p-4">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-24 w-24 rounded-full -mt-12" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32 mt-2" />
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </Card>
    </div>
  );
}