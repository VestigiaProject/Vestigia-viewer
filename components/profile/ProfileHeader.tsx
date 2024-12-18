'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { HistoricalFigure } from '@/lib/supabase';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { Check } from 'lucide-react';

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
    <div>
      <Card>
        <div className="p-6">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
                <AvatarImage src={figure.profile_image} />
                <AvatarFallback>{figure.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <h1 className="text-2xl font-bold">{figure.name}</h1>
                {figure.checkmark && (
                  <Check className="h-5 w-5 text-blue-500" />
                )}
              </div>
              <p className="text-muted-foreground font-medium">{title}</p>
            </div>
            <div className="prose prose-sm max-w-none text-gray-600">
              <p className="whitespace-pre-wrap leading-relaxed">{biography}</p>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground border-t pt-4">
              <span className="font-medium">{postCount} {t('timeline.posts')}</span>
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
        <div className="p-4">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
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