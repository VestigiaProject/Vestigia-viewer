'use client';

import { useEffect, useState } from 'react';
import { PostContent } from '@/components/post/PostContent';
import { PostComments } from '@/components/post/PostComments';
import { fetchPost } from '@/lib/api/posts';
import { supabase } from '@/lib/supabase';
import type { HistoricalPostWithFigure } from '@/lib/supabase';

interface PostWithLiveUpdatesProps {
  initialPost: HistoricalPostWithFigure;
  postId: string;
}

export function PostWithLiveUpdates({ initialPost, postId }: PostWithLiveUpdatesProps) {
  const [post, setPost] = useState<HistoricalPostWithFigure>(initialPost);

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`post-${postId}-content`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'historical_posts',
          filter: `id=eq.${postId}`,
        },
        async () => {
          try {
            const updatedPost = await fetchPost(postId);
            setPost(updatedPost);
          } catch (error) {
            console.error('Error updating post:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  return (
    <>
      <PostContent post={post} />
      <PostComments postId={post.id} />
    </>
  );
} 