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
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-start space-x-4">
        <Link href={`/profile/${post.historical_figures.id}`}>
          <Avatar className="h-12 w-12">
            <AvatarImage src={post.historical_figures.profile_image} />
            <AvatarFallback>{post.historical_figures.name[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Link
                  href={`/profile/${post.historical_figures.id}`}
                  className="font-semibold hover:underline"
                >
                  {post.historical_figures.name}
                </Link>
                {post.historical_figures.checkmark && (
                  <Check className="h-4 w-4 text-blue-500" />
                )}
              </div>
              {title && (
                <p className="text-sm text-muted-foreground">
                  {title}
                </p>
              )}
            </div>
            <span className="text-sm text-muted-foreground shrink-0 ml-4">
              {formatDistanceToNow(new Date(post.created_at), { 
                addSuffix: true,
                locale: language === 'fr' ? fr : undefined 
              })}
            </span>
          </div>
          <div className="mt-2 text-base">
            <Markdown content={content} />
          </div>
          {post.media_url && (
            isVideoUrl(post.media_url) ? (
              <video
                ref={videoRef}
                src={post.media_url}
                className="rounded-lg w-full object-contain mt-2"
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
                className="rounded-lg max-h-96 object-cover mt-2"
                loading="lazy"
                decoding="async"
              />
            )
          )}
          <div className="flex items-center space-x-4 mt-4">
            <Button
              variant="ghost"
              size="sm"
              className={`space-x-1 ${isLiked ? 'text-red-500' : ''}`}
              onClick={onLike}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="space-x-1"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{t('comments.title')} ({commentsCount})</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 