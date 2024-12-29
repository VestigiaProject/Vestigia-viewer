'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Check, Heart, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Markdown } from '@/components/ui/markdown';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePostInteractions } from '@/lib/hooks/usePostInteractions';
import type { HistoricalPostWithFigure } from '@/lib/supabase';

interface PostProps {
  post: HistoricalPostWithFigure;
}

const isVideoUrl = (url: string) => {
  return url?.match(/\.(mp4|webm|ogg)(\?.*)?$/i) !== null;
};

export function HistoricalPost({ post }: PostProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLiked, likes, comments, likePost, unlikePost } = usePostInteractions(post.id);

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

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    if (isLiked) {
      unlikePost();
    } else {
      likePost();
    }
  };

  const handlePostClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Store current post data in sessionStorage before navigating
    sessionStorage.setItem('currentPostData', JSON.stringify({
      post,
      likes,
      isLiked,
      comments
    }));
    router.push(`/post/${post.id}`);
  };

  const content = language === 'en' && post.content_en ? post.content_en : post.content;
  const title = language === 'en' && post.figure.title_en ? post.figure.title_en : post.figure.title;

  return (
    <div onClick={handlePostClick}>
      <Card className="p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer shadow-sm">
        <div className="flex gap-4">
          <div className="shrink-0">
            <Link href={`/profile/${post.figure.id}`} onClick={(e) => e.stopPropagation()}>
              <Avatar>
                <AvatarImage src={post.figure.profile_image} />
                <AvatarFallback>{post.figure.name[0]}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${post.figure.id}`}
                  className="font-semibold hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {post.figure.name}
                </Link>
                {post.figure.checkmark && (
                  <Check className="h-4 w-4 shrink-0 text-blue-500" />
                )}
              </div>
              <span className="text-sm text-muted-foreground shrink-0 ml-auto">
                {format(new Date(post.original_date), language === 'fr' ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: language === 'fr' ? fr : undefined })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {title}
            </p>
            <div className="text-[15px] break-words mt-4">
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
                      onClick={(e) => e.stopPropagation()}
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
            <div className="flex items-center space-x-4 pt-3">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20",
                  isLiked && "text-red-500"
                )}
                onClick={handleLike}
              >
                <Heart className={cn("h-4 w-4 mr-2", isLiked && "fill-current")} />
                <span className="text-sm font-medium">{likes}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/post/${post.id}#comments`);
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">{t('post.comments')} ({comments.length})</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}