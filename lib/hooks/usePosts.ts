'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Post, PostsResponse } from '@/lib/types/post';
import { ITEMS_PER_PAGE } from '@/lib/constants';

export function usePosts(startDate: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const supabase = createClient();

  const fetchPosts = async (currentCursor?: string) => {
    try {
      let query = supabase
        .from('historical_posts')
        .select(`
          *,
          figure:historical_figures(name, title, profile_image)
        `)
        .lt('original_date', startDate)
        .order('original_date', { ascending: false })
        .limit(ITEMS_PER_PAGE);

      if (currentCursor) {
        query = query.lt('id', currentCursor);
      }

      const { data, error } = await query;

      if (error) throw error;

      const newPosts = data.map((post): Post => ({
        id: post.id,
        figureId: post.figure_id,
        originalDate: post.original_date,
        content: post.content,
        mediaUrl: post.media_url,
        isSignificant: post.is_significant,
        figure: post.figure ? {
          name: post.figure.name,
          title: post.figure.title,
          profileImage: post.figure.profile_image,
        } : undefined,
      }));

      setPosts(currentPosts => 
        currentCursor ? [...currentPosts, ...newPosts] : newPosts
      );
      setHasMore(data.length === ITEMS_PER_PAGE);
      if (data.length > 0) {
        setCursor(data[data.length - 1].id);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [startDate]);

  return {
    posts,
    loading,
    error,
    hasMore,
    fetchMore: () => fetchPosts(cursor),
  };
}