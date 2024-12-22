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
    <div className="border rounded-lg p-3 bg-card">
      <div className="flex gap-3">
        <Link href={`/profile/${post.historical_figures.id}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.historical_figures.profile_image} />
            <AvatarFallback>{post.historical_figures.name[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-1 min-w-0">
              <Link
                href={`/profile/${post.historical_figures.id}`}
                className="font-semibold hover:underline truncate"
              >
                {post.historical_figures.name}
              </Link>
              {post.historical_figures.checkmark && (
                <Check className="h-4 w-4 shrink-0 text-blue-500" />
              )}
              {title && (
                <span className="text-muted-foreground text-sm truncate">· {title}</span>
              )}
            </div>
            <span className="text-sm text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(post.created_at), { 
                addSuffix: true,
                locale: language === 'fr' ? fr : undefined 
              })}
            </span>
          </div>
          <div className="text-[15px] break-words">
            <Markdown content={content} className="prose-p:my-1 prose-p:leading-[1.3]" />
          </div>
          {post.media_url && (
            <div className="mt-2 rounded-lg overflow-hidden">
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
          <div className="flex items-center gap-4 mt-3">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 hover:text-red-600",
                isLiked && "text-red-500"
              )}
              onClick={onLike}
            >
              <Heart className={cn("h-4 w-4 mr-2", isLiked && "fill-current")} />
              <span className="text-sm">{likes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 hover:text-blue-600"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">{commentsCount}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 