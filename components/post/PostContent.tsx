'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Heart, MessageCircle, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { HistoricalPostWithFigure } from '@/lib/supabase';
import { fetchPost, fetchPostInteractions } from '@/lib/api/posts';
import { PostSource } from './PostSource';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { fr } from 'date-fns/locale';

type PostContentProps = {
  post: HistoricalPostWithFigure;
};

export function PostContent({ post: initialPost }: PostContentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [post, setPost] = useState(initialPost);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load initial interactions
  useEffect(() => {
    const loadInitialInteractions = async () => {
      try {
        const storedData = sessionStorage.getItem('currentPostData');
        if (storedData) {
          const { likes: storedLikes, isLiked: storedIsLiked } = JSON.parse(storedData);
          setLikes(storedLikes);
          setIsLiked(storedIsLiked);
          sessionStorage.removeItem('currentPostData');
        } else {
          const interactions = await fetchPostInteractions(post.id, user?.id);
          setLikes(interactions.likes);
          setIsLiked(interactions.isLiked || false);
        }
      } catch (error) {
        console.error('Error loading initial interactions:', error);
      }
    };

    loadInitialInteractions();
  }, [post.id, user?.id]);

  // Subscribe to real-time updates for post content and interactions
  useEffect(() => {
    const channel = supabase
      .channel(`post-${post.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'historical_posts',
          filter: `id=eq.${post.id}`,
        },
        async () => {
          try {
            const updatedPost = await fetchPost(post.id);
            if (updatedPost) {
              setPost(updatedPost);
            }
          } catch (error) {
            console.error('Error updating post:', error);
          }
        }
      )
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
            setLikes(interactions.likes);
            setIsLiked(interactions.isLiked || false);
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
            setLikes(interactions.likes);
            setIsLiked(interactions.isLiked || false);
          } catch (error) {
            console.error('Error updating interactions:', error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to post ${post.id} updates`);
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
      if (isLiked) {
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
      setIsLiked(!isLiked);
      setLikes(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t('error.generic'),
        description: t('error.like_failed'),
        variant: 'destructive',
      });
      // Revert optimistic update on error
      const interactions = await fetchPostInteractions(post.id, user?.id);
      setLikes(interactions.likes);
      setIsLiked(interactions.isLiked || false);
    } finally {
      setLoading(false);
    }
  };

  const content = language === 'en' && post.content_en ? post.content_en : post.content;
  const source = language === 'en' && post.source_en ? post.source_en : post.source;
  const title = language === 'en' && post.figure.title_en ? post.figure.title_en : post.figure.title;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/timeline')}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('app.back_to_timeline')}
        </Button>
      </div>
      <div className="flex flex-col md:flex-row md:space-x-4">
        <Link href={`/profile/${post.figure.id}`} className="mb-4 md:mb-0">
          <Avatar className="h-12 w-12">
            <AvatarImage src={post.figure.profile_image} />
            <AvatarFallback>{post.figure.name[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${post.figure.id}`}
                className="font-semibold hover:underline"
              >
                {post.figure.name}
              </Link>
              {post.figure.checkmark && (
                <Check className="h-4 w-4 text-blue-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {title}
            </p>
            <span className="text-sm text-muted-foreground block">
              {format(new Date(post.original_date), language === 'fr' ? 'd MMMM yyyy' : 'MMMM d, yyyy', { locale: language === 'fr' ? fr : undefined })}
            </span>
          </div>
          <p className="text-base whitespace-pre-wrap leading-relaxed">{content}</p>
          {post.media_url && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={post.media_url}
                alt="Post media"
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}
          <div className="flex items-center space-x-4 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              className={`space-x-1 ${isLiked ? 'text-red-500' : ''}`}
              onClick={handleLike}
              disabled={loading}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{t('post.like')} ({likes})</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="space-x-1"
              onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{t('post.comments')}</span>
            </Button>
          </div>
          {source && <PostSource source={source} />}
        </div>
      </div>
    </div>
  );
}