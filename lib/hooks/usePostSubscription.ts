'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase';
import type { HistoricalPostWithFigure } from '../supabase';

export function usePostSubscription(initialPost: HistoricalPostWithFigure) {
  const [post, setPost] = useState(initialPost);
  const isSubscribed = useRef(false);

  useEffect(() => {
    // Set initial post
    setPost(initialPost);

    // Prevent duplicate subscriptions
    if (isSubscribed.current) return;
    isSubscribed.current = true;

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
      .channel(`post-${initialPost.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'historical_posts',
          filter: `id=eq.${initialPost.id}`,
        },
        async (payload) => {
          // Fetch complete post data when any change occurs
          await fetchCompletePost();
        }
      )
      .subscribe();

    return () => {
      isSubscribed.current = false;
      channel.unsubscribe();
    };
  }, [initialPost.id]);

  return post;
}