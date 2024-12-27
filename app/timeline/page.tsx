'use client';

import { HistoricalPost } from '@/components/timeline/HistoricalPost';
import { useTimeProgress } from '@/lib/hooks/useTimeProgress';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchPosts, fetchPostInteractions } from '@/lib/api/posts';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Skeleton } from '@/components/ui/skeleton';
import type { HistoricalPostWithFigure, UserInteraction } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const START_DATE = '1789-06-04';
const SESSION_KEY = 'timeline_state';

interface UserInteractionPayload {
  post_id: string;
  user_id: string;
  type: 'like' | 'comment';
  content?: string;
}

interface TimelineState {
  posts: HistoricalPostWithFigure[];
  page: number;
  hasMore: boolean;
  postInteractions: Record<string, { likes: number; comments: UserInteraction[] }>;
  userLikes: string[];
  currentDate: string;
  scrollPosition: number;
}

export default function TimelinePage() {
  const { user } = useAuth();
  const { currentDate } = useTimeProgress(START_DATE);
  const currentDateStr = currentDate.toISOString();

  const [posts, setPosts] = useState<HistoricalPostWithFigure[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const state = JSON.parse(saved) as TimelineState;
        if (state.currentDate === currentDateStr) {
          return state.posts;
        }
      }
    }
    return [];
  });
  
  const [page, setPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const state = JSON.parse(saved) as TimelineState;
        if (state.currentDate === currentDateStr) {
          return state.page;
        }
      }
    }
    return 1;
  });

  const [hasMore, setHasMore] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const state = JSON.parse(saved) as TimelineState;
        if (state.currentDate === currentDateStr) {
          return state.hasMore;
        }
      }
    }
    return true;
  });

  const [loading, setLoading] = useState(posts.length === 0);
  const [userLikes, setUserLikes] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const state = JSON.parse(saved) as TimelineState;
        return new Set(state.userLikes);
      }
    }
    return new Set();
  });

  const [postInteractions, setPostInteractions] = useState<Record<string, { likes: number; comments: UserInteraction[] }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const state = JSON.parse(saved) as TimelineState;
        if (state.currentDate === currentDateStr) {
          return state.postInteractions;
        }
      }
    }
    return {};
  });

  const [scrollPosition, setScrollPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const state = JSON.parse(saved) as TimelineState;
        if (state.currentDate === currentDateStr) {
          return state.scrollPosition || 0;
        }
      }
    }
    return 0;
  });

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (posts.length > 0) {
      const state: TimelineState = {
        posts,
        page,
        hasMore,
        postInteractions,
        userLikes: Array.from(userLikes),
        currentDate: currentDateStr,
        scrollPosition
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    }
  }, [posts, page, hasMore, postInteractions, userLikes, currentDateStr, scrollPosition]);

  // Restore scroll position after initial render
  useEffect(() => {
    if (scrollPosition > 0 && !loading) {
      window.scrollTo(0, scrollPosition);
    }
  }, [loading]);

  // Save scroll position before navigating away
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, posts]);

  // Initial load only if we don't have posts
  useEffect(() => {
    if (posts.length === 0) {
      loadUserLikes();
      loadPosts(1, true);
    }
  }, []);

  // Handle date changes
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      const state = JSON.parse(saved) as TimelineState;
      if (state.currentDate !== currentDateStr) {
        setPage(1);
        setHasMore(true);
        loadPosts(1, true);
      }
    } else {
      setPage(1);
      setHasMore(true);
      loadPosts(1, true);
    }
  }, [currentDate]);

  // Set up real-time listeners for interactions only
  useEffect(() => {
    if (!user) return;

    const interactionsChannel = supabase
      .channel('interactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_interactions',
          filter: `post_id=in.(${posts.map(p => p.id).join(',')})`,
        },
        async (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
          const postId = (payload.new as UserInteractionPayload)?.post_id || 
                        (payload.old as UserInteractionPayload)?.post_id;
          if (!postId) return;

          // Refetch interactions for the affected post
          const interactions = await fetchPostInteractions(postId);
          setPostInteractions(prev => ({
            ...prev,
            [postId]: interactions
          }));
        }
      )
      .subscribe();

    return () => {
      interactionsChannel.unsubscribe();
    };
  }, [user, posts]);

  async function loadUserLikes() {
    if (!user) return;
    const { data } = await supabase
      .from('user_interactions')
      .select('post_id')
      .eq('user_id', user.id)
      .eq('type', 'like');

    if (data) {
      setUserLikes(new Set(data.map((like) => like.post_id)));
    }
  }

  async function handleLike(postId: string) {
    if (!user) return;

    const isLiked = userLikes.has(postId);
    if (isLiked) {
      await supabase
        .from('user_interactions')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .eq('type', 'like');

      setUserLikes((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    } else {
      await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          post_id: postId,
          type: 'like',
        });

      setUserLikes((prev) => new Set([...prev, postId]));
    }
  }

  async function handleComment(postId: string, content: string) {
    if (!user) return;

    const { data: comment, error } = await supabase
      .from('user_interactions')
      .insert({
        user_id: user.id,
        post_id: postId,
        type: 'comment',
        content,
      })
      .select()
      .single();

    if (error) throw error;

    setPostInteractions((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        comments: [...prev[postId].comments, comment],
      },
    }));
  }

  return (
    <main className="container max-w-2xl mx-auto py-4">
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/95 rounded-lg shadow-sm">
              <Skeleton className="h-48 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <InfiniteScroll
          dataLength={posts.length}
          next={() => {
            const nextPage = page + 1;
            setPage(nextPage);
            loadPosts(nextPage, false);
          }}
          hasMore={hasMore}
          loader={<div className="bg-white/95 rounded-lg shadow-sm my-4"><Skeleton className="h-48 w-full" /></div>}
          endMessage={
            <p className="text-center text-muted-foreground py-4 bg-white/95 rounded-lg shadow-sm">
              No more historical posts to load
            </p>
          }
          scrollThreshold="200px"
        >
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white/95 rounded-lg shadow-sm">
                <HistoricalPost
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  likes={postInteractions[post.id]?.likes || 0}
                  isLiked={userLikes.has(post.id)}
                  comments={postInteractions[post.id]?.comments || []}
                />
              </div>
            ))}
          </div>
        </InfiniteScroll>
      )}
    </main>
  );
}