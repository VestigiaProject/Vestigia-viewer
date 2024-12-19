'use client';

import { useEffect, useState } from 'react';
import { PostContent } from '@/components/post/PostContent';
import { PostComments } from '@/components/post/PostComments';
import { fetchPost } from '@/lib/api/posts';
import { supabase } from '@/lib/supabase';
import type { HistoricalPostWithFigure } from '@/lib/supabase';

interface DynamicPostProps {
  postId: string;
  initialPost: HistoricalPostWithFigure;
}

export function DynamicPost({ postId, initialPost }: DynamicPostProps) {
  const [post, setPost] = useState<HistoricalPostWithFigure>(initialPost);

  useEffect(() => {
    // Set initial post when it changes
    setPost(initialPost);
  }, [initialPost]);

  useEffect(() => {
    // Subscribe to real-time updates for the post
    const channel = supabase
      .channel(`post-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'historical_posts',
          filter: `id=eq.${postId}`,
        },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            // Handle post deletion if needed
            return;
          }
          
          try {
            const data = await fetchPost(postId);
            if (data) {
              setPost(data);
            }
          } catch (error) {
            console.error('Error updating post:', error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to updates for post ${postId}`);
        }
      });

    // Periodically check for updates (as a fallback)
    const intervalId = setInterval(async () => {
      try {
        const data = await fetchPost(postId);
        if (data && JSON.stringify(data) !== JSON.stringify(post)) {
          setPost(data);
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    }, 60000); // Check every minute

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, [postId, post]);

  return (
    <>
      <PostContent post={post} />
      <PostComments postId={post.id} />
    </>
  );
} 