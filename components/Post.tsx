'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Check, Heart, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { fr } from 'date-fns/locale';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { Markdown } from '@/components/ui/markdown';
import { cn } from '@/lib/utils';

interface PostProps {
  post: {
    id: string;
    content: string;
    content_en?: string;
    created_at: string;
    original_date: string;
    media_url?: string;
    historical_figures: {
      id: string;
      name: string;
      profile_image?: string;
      title?: string;
      title_en?: string;
      checkmark?: boolean;
    };
  };
  likes: number;
  isLiked: boolean;
  commentsCount: number;
  onLike?: () => void;
}

const isVideoUrl = (url: string) => {
  return url?.match(/\.(mp4|webm|ogg)(\?.*)?$/i) !== null;
};

export function Post({ post, likes, isLiked, commentsCount, onLike }: PostProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { language } = useLanguage();
  const { t } = useTranslation();
  const content = language === 'en' && post.content_en ? post.content_en : post.content;
  const title = language === 'en' && post.historical_figures.title_en 
    ? post.historical_figures.title_en 
    : post.historical_figures.title;

  useEffect(() => {
    if (!videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {
              // Autoplay was prevented
            });
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(videoRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="bg-card rounded-lg border">
      <div className="px-6 py-4">
        <div className="flex gap-4">
          <div className="shrink-0">
            <Link href={`/profile/${post.historical_figures.id}`}>
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.historical_figures.profile_image} />
                <AvatarFallback>{post.historical_figures.name[0]}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/profile/${post.historical_figures.id}`}
                  className="font-semibold hover:underline"
                >
                  {post.historical_figures.name}
                </Link>
                {post.historical_figures.checkmark && (
                  <Check className="h-4 w-4 shrink-0 text-blue-500" />
                )}
              </div>
              <span className="text-sm text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(post.created_at), { 
                  addSuffix: true,
                  locale: language === 'fr' ? fr : undefined 
                })}
              </span>
            </div>
            {title && (
              <p className="text-sm text-muted-foreground mb-2">
                {title}
              </p>
            )}
            <div className="text-[15px] break-words -ml-[52px] sm:ml-0">
              <Markdown content={content} className="prose-p:my-1 prose-p:leading-relaxed" />
              {post.media_url && (
                <div className="mt-3 rounded-lg overflow-hidden">
                  {isVideoUrl(post.media_url) ? (
                    <video
                      ref={videoRef}
                      src={post.media_url}
                      className="w-full object-contain"
                      controls
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      controlsList="nodownload"
                    />
                  ) : (
                    <img
                      src={post.media_url}
                      alt="Post media"
                      className="w-full max-h-[512px] object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t px-6 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20",
              isLiked && "text-red-500"
            )}
            onClick={onLike}
          >
            <Heart className={cn("h-4 w-4 mr-2", isLiked && "fill-current")} />
            <span className="text-sm font-medium">{likes}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">{t('comments.title')} ({commentsCount})</span>
          </Button>
        </div>
      </div>
    </div>
  );
} 