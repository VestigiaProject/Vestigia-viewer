'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { HistoricalPostWithFigure } from '../supabase';

export function usePostSubscription(initialPost: HistoricalPostWithFigure) {
  const [post, setPost] = useState(initialPost);

  useEffect(() => {
    // Set initial post
    setPost(initialPost);

    // Function to fetch complete post data
    const fetchCompletePost = async () => {
      const { data, error } = await supabase
        .from('historical_posts')
        .select(`
          id,
          figure_id,
          original_date,
          content,
          media_url,
          source,
          is_significant,
          figure:historical_figures!inner(
            id,
            name,
            title,
            biography,
            profile_image
          )
        `)
        .eq('id', initialPost.id)
        .single();

      if (!error && data) {
        setPost(data as unknown as HistoricalPostWithFigure);
      }
    };

    // Enable realtime for the historical_posts table
    const channel = supabase
      .channel('historical_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes
          schema: 'public',
          table: 'historical_posts',
          filter: `id=eq.${initialPost.id}`,
        },
        async () => {
          // Fetch complete post data when any change occurs
          await fetchCompletePost();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [initialPost.id]);

  return post;
}