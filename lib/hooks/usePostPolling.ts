'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { HistoricalPostWithFigure } from '../supabase';

export function usePostPolling(initialPost: HistoricalPostWithFigure) {
  const [post, setPost] = useState(initialPost);

  useEffect(() => {
    // Set initial post
    setPost(initialPost);

    // Poll for updates every 5 seconds
    const interval = setInterval(async () => {
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
    }, 5000);

    return () => clearInterval(interval);
  }, [initialPost.id]);

  return post;
}