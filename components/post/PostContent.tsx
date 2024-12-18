'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Heart, MessageCircle, ArrowLeft } from 'lucide-react';
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

type PostContentProps = {
  post: HistoricalPostWithFigure;
};

export function PostContent({ post: initialPost }: PostContentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [post, setPost] = useState<HistoricalPostWithFigure>(initialPost);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Function to load fresh post data
  const loadFreshPost = async () => {
    try {
      const freshPost = await fetchPost(initialPost.id);
      if (freshPost) {
        setPost(freshPost);
      }
    } catch (error) {
      console.error('Error loading post:', error);
    }
  };

  // Get current post data from sessionStorage if available
  useEffect(() => {
    const storedData = sessionStorage.getItem('currentPostData');
    if (storedData) {
      const { post: currentPost, likes: currentLikes, isLiked: currentIsLiked } = JSON.parse(storedData);
      setPost(currentPost);
      setLikes(currentLikes);
      setIsLiked(currentIsLiked);
      // Clear the stored data after using it
      sessionStorage.removeItem('currentPostData');
    } else {
      loadFreshPost();
    }
  }, [initialPost.id]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('post-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'historical_posts',
          filter: `id=eq.${post.id}`,
        },
        async (payload) => {
          if (payload.new) {
            const freshPost = await fetchPost(post.id);
            if (freshPost) {
              setPost(freshPost);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id]);

  // Function to load interactions
  const loadInteractions = async () => {
    try {
      const { likes } = await fetchPostInteractions(post.id);
      setLikes(likes);

      if (user) {
        const { data } = await supabase
          .from('user_interactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', post.id)
          .eq('type', 'like')
          .single();

        setIsLiked(!!data);
      }
    } catch (error) {
      console.error('Error loading interactions:', error);
    }
  };

  // Only load interactions if we don't have them from sessionStorage
  useEffect(() => {
    const storedData = sessionStorage.getItem('currentPostData');
    if (!storedData) {
      loadInteractions();
    }
  }, [post.id, user]);

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

      setIsLiked(!isLiked);
      setLikes(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to like post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const content = language === 'en' && post.content_en ? post.content_en : post.content;
  const source = language === 'en' && post.source_en ? post.source_en : post.source;
  const title = language === 'en' && post.figure.title_en ? post.figure.title_en : post.figure.title;

  return (
    <>
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/timeline')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Timeline
        </Button>
      </div>
      <Card className="p-6 mb-8">
        <div className="flex space-x-4">
          <Link href={`/profile/${post.figure.id}`}>
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.figure.profile_image} />
              <AvatarFallback>{post.figure.name[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 space-y-4">
            <div>
              <Link
                href={`/profile/${post.figure.id}`}
                className="font-semibold hover:underline"
              >
                {post.figure.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {title}
              </p>
              <span className="text-sm text-muted-foreground">
                {format(new Date(post.original_date), 'MMMM d, yyyy')}
              </span>
            </div>
            <p className="text-lg whitespace-pre-wrap">{content}</p>
            {post.media_url && (
              <img
                src={post.media_url}
                alt="Post media"
                className="rounded-lg max-h-96 object-cover"
              />
            )}
            <div className="flex items-center space-x-4 pt-4">
              <Button
                variant="ghost"
                size="sm"
                className={`space-x-1 ${isLiked ? 'text-red-500' : ''}`}
                onClick={handleLike}
                disabled={loading}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likes}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="space-x-1"
                onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <MessageCircle className="h-4 w-4" />
                <span>Comments</span>
              </Button>
            </div>
            <PostSource source={source} />
          </div>
        </div>
      </Card>
    </>
  );
}