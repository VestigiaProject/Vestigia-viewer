'use client';

import { useEffect, useState } from 'react';
import { PostContent } from '@/components/post/PostContent';
import { PostComments } from '@/components/post/PostComments';
import { fetchPost } from '@/lib/api/posts';
import { supabase } from '@/lib/supabase';
import type { HistoricalPostWithFigure } from '@/lib/supabase';

interface LivePostProps {
  initialPost: HistoricalPostWithFigure;
}

export function LivePost({ initialPost }: LivePostProps) {
  const [post, setPost] = useState<HistoricalPostWithFigure>(initialPost);

  // Function to fetch the latest post data
  const loadPost = async () => {
    try {
      const updatedPost = await fetchPost(initialPost.id);
      setPost(updatedPost);
    } catch (error) {
      console.error('Error loading post:', error);
    }
  };

  // Load fresh data on mount
  useEffect(() => {
    loadPost();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`post-${initialPost.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'historical_posts',
          filter: `id=eq.${initialPost.id}`,
        },
        async () => {
          // Reload the post data when changes occur
          await loadPost();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to updates for post ${initialPost.id}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialPost.id]);

  return (
    <>
      <PostContent post={post} />
      <PostComments postId={post.id} />
    </>
  );
} 