'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Heart, MessageCircle, Check } from 'lucide-react';
import type { HistoricalPostWithFigure, UserInteraction } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { fetchPostInteractions } from '@/lib/api/posts';
import { Markdown } from '@/components/ui/markdown';
import { cn } from '@/lib/utils';

type PostProps = {
  post: HistoricalPostWithFigure;
  onLike: (postId: string) => Promise<void>;
  onComment: (postId: string, content: string) => Promise<void>;
  likes: number;
  isLiked: boolean;
  comments: UserInteraction[];
};

const isVideoUrl = (url: string) => {
  return url?.match(/\.(mp4|webm|ogg)(\?.*)?$/i) !== null;
};

export function HistoricalPost({
  post,
  onLike,
  onComment,
  likes: initialLikes,
  isLiked: initialIsLiked,
  comments: initialComments,
}: PostProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [liked, setLiked] = useState(initialIsLiked);
  const [comments, setComments] = useState(initialComments);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (videoRef.current) {
              videoRef.current.preload = 'auto';
              videoRef.current.play().catch(() => {
                // Autoplay was prevented
              });
            }
          } else {
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.preload = 'none';
              videoRef.current.src = videoRef.current.src;
            }
          }
        });
      },
      { 
        threshold: 0.5,
        rootMargin: '50px 0px'
      }
    );

    observer.observe(videoRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Load initial interactions
  useEffect(() => {
    const loadInitialInteractions = async () => {
      try {
        const interactions = await fetchPostInteractions(post.id, user?.id);
        setLikeCount(interactions.likes);
        setLiked(interactions.isLiked || false);
        setComments(interactions.comments);
      } catch (error) {
        console.error('Error loading initial interactions:', error);
      }
    };

    loadInitialInteractions();
  }, [post.id, user?.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`post-${post.id}-interactions`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_interactions',
          filter: `post_id=eq.${post.id}`,
        },
        async () => {
          try {
            const interactions = await fetchPostInteractions(post.id, user?.id);
            setLikeCount(interactions.likes);
            setLiked(interactions.isLiked || false);
            setComments(interactions.comments);
          } catch (error) {
            console.error('Error updating interactions:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'user_interactions',
          filter: `post_id=eq.${post.id}`,
        },
        async () => {
          try {
            const interactions = await fetchPostInteractions(post.id, user?.id);
            setLikeCount(interactions.likes);
            setLiked(interactions.isLiked || false);
            setComments(interactions.comments);
          } catch (error) {
            console.error('Error updating interactions:', error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to interactions for post ${post.id}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id, user?.id]);

  const handleLike = async () => {
    if (!user || loading) return;
    setLoading(true);

    try {
      if (liked) {
        await supabase
          .from('user_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id)
          .eq('type', 'like');
      } else {
        await supabase
          .from('user_interactions')
          .insert({
            user_id: user.id,
            post_id: post.id,
            type: 'like',
          });
      }

      // Optimistic update
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: t('error.generic'),
        description: t('error.like_failed'),
        variant: 'destructive',
      });
      // Revert optimistic update on error
      const interactions = await fetchPostInteractions(post.id, user.id);
      setLikeCount(interactions.likes);
      setLiked(interactions.isLiked || false);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Store current post data in sessionStorage before navigating
    sessionStorage.setItem('currentPostData', JSON.stringify({
      post,
      likes: likeCount,
      isLiked: liked,
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
                      className="w-full max-w-[1280px] max-h-[720px] object-contain mx-auto"
                      controls
                      muted
                      loop
                      playsInline
                      preload="none"
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
                  liked && "text-red-500"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike();
                }}
                disabled={loading}
              >
                <Heart className={cn("h-4 w-4 mr-2", liked && "fill-current")} />
                <span className="text-sm font-medium">{likeCount}</span>
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