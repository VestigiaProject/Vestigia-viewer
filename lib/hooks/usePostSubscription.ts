'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { HistoricalPostWithFigure } from '../supabase';

export function usePostSubscription(initialPost: HistoricalPostWithFigure) {
  const [post, setPost] = useState(initialPost);

  useEffect(() => {
    const channel = supabase
      .channel('post_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'historical_posts',
          filter: `id=eq.${initialPost.id}`,
        },
        async (payload) => {
          if (payload.new) {
            // Fetch the complete post data with figure information
            const { data } = await supabase
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

            if (data) {
              setPost(data as unknown as HistoricalPostWithFigure);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialPost.id]);

  return post;
}