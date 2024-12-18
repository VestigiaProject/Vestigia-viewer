'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { HistoricalPostWithFigure } from '../supabase';

export function usePostSubscription(initialPost: HistoricalPostWithFigure) {
  const [post, setPost] = useState(initialPost);

  useEffect(() => {
    // Set initial post
    setPost(initialPost);

    // Enable realtime for the historical_posts table
    const channel = supabase
      .channel('historical_posts_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'historical_posts',
          filter: `id=eq.${initialPost.id}`,
        },
        (payload) => {
          // Merge the new data with existing post data
          if (payload.new) {
            setPost(prev => ({
              ...prev,
              ...payload.new,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [initialPost]);

  return post;
}