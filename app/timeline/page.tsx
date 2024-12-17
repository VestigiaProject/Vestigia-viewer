'use client';

import { TimelineHeader } from '@/components/timeline/TimelineHeader';
import { HistoricalPost } from '@/components/timeline/HistoricalPost';
import { useTimeProgress } from '@/lib/hooks/useTimeProgress';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchPosts, fetchPostInteractions } from '@/lib/api/posts';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Skeleton } from '@/components/ui/skeleton';
import type { HistoricalPostWithFigure, UserInteraction } from '@/lib/supabase';

export default function TimelinePage() {
  const { user } = useAuth();
  const { currentDate, daysElapsed } = useTimeProgress();
  const [posts, setPosts] = useState<HistoricalPostWithFigure[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [postInteractions, setPostInteractions] = useState<Record<string, { likes: number; comments: UserInteraction[] }>>({});

  useEffect(() => {
    if (currentDate) {
      loadPosts();
      loadUserLikes();
    }
  }, [currentDate]);

  async function loadPosts() {
    if (!currentDate) return;
    
    try {
      const newPosts = await fetchPosts(currentDate, page);
      setPosts((prev) => [...prev, ...newPosts]);
      setHasMore(newPosts.length === 10);
      
      const interactions = await Promise.all(
        newPosts.map((post) => fetchPostInteractions(post.id))
      );
      const newInteractions = newPosts.reduce((acc, post, index) => {
        acc[post.id] = interactions[index];
        return acc;
      }, {} as Record<string, { likes: number; comments: UserInteraction[] }>);
      
      setPostInteractions((prev) => ({ ...prev, ...newInteractions }));
      setLoading(false);
    } catch (error) {
      console.error('Error loading posts:', error);
      setLoading(false);
    }
  }

  // ... rest of the component remains the same ...
}