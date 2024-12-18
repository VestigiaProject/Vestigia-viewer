'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Heart, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { HistoricalPostWithFigure } from '@/lib/supabase';
import { fetchPostInteractions } from '@/lib/api/posts';
import { PostSource } from './PostSource';
import { usePostPolling } from '@/lib/hooks/usePostPolling';

type PostContentProps = {
  post: HistoricalPostWithFigure;
};

export function PostContent({ post: initialPost }: PostContentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const post = usePostPolling(initialPost);

  useEffect(() => {
    async function loadInteractions() {
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
    }

    loadInteractions();
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
                {post.figure.title}
              </p>
              <span className="text-sm text-muted-foreground">
                {format(new Date(post.original_date), 'MMMM d, yyyy')}
              </span>
            </div>
            <p className="text-lg whitespace-pre-wrap">{post.content}</p>
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
            {post.source && <PostSource source={post.source} />}
          </div>
        </div>
      </Card>
    </>
  );
}