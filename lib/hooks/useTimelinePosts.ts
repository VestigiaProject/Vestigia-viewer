import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { handleError } from '@/lib/utils/handleError';
import { fetchPosts, fetchPostInteractions } from '@/lib/api/posts';
import type { HistoricalPostWithFigure, UserInteraction } from '@/lib/supabase';
import { useTranslation } from './useTranslation';

interface TimelineState {
  posts: HistoricalPostWithFigure[];
  page: number;
  hasMore: boolean;
  postInteractions: Record<string, { likes: number; comments: UserInteraction[] }>;
  scrollPosition: number;
  currentDate: string;
}

const SESSION_KEY = 'timeline_state';

export function useTimelinePosts(currentDate: Date) {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<HistoricalPostWithFigure[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [postInteractions, setPostInteractions] = useState<Record<string, { likes: number; comments: UserInteraction[] }>>({});
  const [scrollPosition, setScrollPosition] = useState(0);

  // Clear session storage if the date has changed
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      const state = JSON.parse(saved) as TimelineState;
      if (state.currentDate !== currentDate.toISOString()) {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, [currentDate]);

  // Save scroll position before navigating away
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position after initial render
  useEffect(() => {
    if (scrollPosition > 0 && !loading) {
      window.scrollTo(0, scrollPosition);
    }
  }, [loading, scrollPosition]);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (posts.length > 0) {
      const state: TimelineState = {
        posts,
        page,
        hasMore,
        postInteractions,
        currentDate: currentDate.toISOString(),
        scrollPosition
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    }
  }, [posts, page, hasMore, postInteractions, currentDate, scrollPosition]);

  const loadPosts = useCallback(async (pageToLoad: number, resetPosts: boolean = false) => {
    // Don't reload if we already have the posts for this page and date
    if (!resetPosts && posts.length >= pageToLoad * 10) {
      return;
    }

    try {
      const newPosts = await fetchPosts(currentDate, pageToLoad);
      
      const existingPostIds = new Set(resetPosts ? [] : posts.map(post => post.id));
      const uniqueNewPosts = newPosts.filter(post => !existingPostIds.has(post.id));
      
      if (uniqueNewPosts.length === 0) {
        setHasMore(false);
        return;
      }

      setPosts(prev => {
        const allPosts = resetPosts ? uniqueNewPosts : [...prev, ...uniqueNewPosts];
        return allPosts.sort((a, b) => 
          new Date(b.original_date).getTime() - new Date(a.original_date).getTime()
        );
      });
      
      setHasMore(newPosts.length === 10);
      
      const interactions = await Promise.all(
        uniqueNewPosts.map((post) => fetchPostInteractions(post.id))
      );
      const newInteractions = uniqueNewPosts.reduce((acc, post, index) => {
        acc[post.id] = interactions[index];
        return acc;
      }, {} as Record<string, { likes: number; comments: UserInteraction[] }>);
      
      setPostInteractions(prev => resetPosts ? newInteractions : { ...prev, ...newInteractions });
    } catch (error) {
      handleError(error, t('error.load_posts_failed'));
    }
  }, [currentDate, posts, t]);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await loadPosts(1, true);
      } catch (error) {
        handleError(error, t('error.load_timeline_failed'));
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [currentDate, loadPosts, t]);

  // Real-time subscription to historical_posts
  useRealtimeSubscription(
    'historical_posts',
    `original_date.lte.${currentDate.toISOString()}`,
    async (payload) => {
      try {
        if (payload.eventType === 'INSERT') {
          const newPost = payload.new as HistoricalPostWithFigure;
          if (new Date(newPost.original_date) <= currentDate) {
            setPosts(prev => {
              if (prev.find(p => p.id === newPost.id)) return prev;
              const updated = [newPost, ...prev];
              return updated.sort((a, b) => 
                new Date(b.original_date).getTime() - new Date(a.original_date).getTime()
              );
            });

            // Fetch interactions for the new post
            const interactions = await fetchPostInteractions(newPost.id);
            setPostInteractions(prev => ({
              ...prev,
              [newPost.id]: interactions
            }));
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedPost = payload.new as HistoricalPostWithFigure;
          setPosts(prev =>
            prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p)
          );
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const deletedId = payload.old.id;
          setPosts(prev => prev.filter(p => p.id !== deletedId));
          setPostInteractions(prev => {
            const { [deletedId]: _, ...rest } = prev;
            return rest;
          });
        }
      } catch (error) {
        handleError(error, t('error.update_timeline_failed'));
      }
    }
  );

  return {
    posts,
    loading,
    hasMore,
    postInteractions,
    loadMorePosts: (nextPage: number) => loadPosts(nextPage, false),
    setPage
  };
} 