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
import { handleError } from '@/lib/utils/error-handler';
import { useTranslation } from '@/lib/hooks/useTranslation';

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
  const { t } = useTranslation();
  const { currentDate } = useTimeProgress(START_DATE);
  const currentDateStr = currentDate.toISOString();

  // Clear session storage if the date has changed
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      const state = JSON.parse(saved) as TimelineState;
      if (state.currentDate !== currentDateStr) {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, [currentDateStr]);

  const [posts, setPosts] = useState<HistoricalPostWithFigure[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [postInteractions, setPostInteractions] = useState<Record<string, { likes: number; comments: UserInteraction[] }>>({});
  const [scrollPosition, setScrollPosition] = useState(0);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await loadUserLikes();
        await loadPosts(1, true);
      } catch (error) {
        handleError(error, {
          userMessage: t('error.load_timeline_failed'),
          context: { currentDate: currentDateStr }
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [currentDateStr]); // Reload when date changes

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
  }, [loading, scrollPosition]);

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
      handleError(error, {
        userMessage: t('error.load_posts_failed'),
        context: { 
          page: pageToLoad,
          currentDate: currentDateStr,
          resetPosts 
        }
      });
    } finally {
      setLoading(false);
    }
  }, [currentDate, posts, t, currentDateStr]);

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

          try {
            // Refetch interactions for the affected post
            const interactions = await fetchPostInteractions(postId);
            setPostInteractions(prev => ({
              ...prev,
              [postId]: interactions
            }));
          } catch (error) {
            handleError(error, {
              userMessage: t('error.update_interactions_failed'),
              context: { postId }
            });
          }
        }
      )
      .subscribe();

    return () => {
      interactionsChannel.unsubscribe();
    };
  }, [user, posts, t]);

  async function loadUserLikes() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_interactions')
        .select('post_id')
        .eq('user_id', user.id)
        .eq('type', 'like');

      if (error) throw error;
      if (data) {
        setUserLikes(new Set(data.map((like) => like.post_id)));
      }
    } catch (error) {
      handleError(error, {
        userMessage: t('error.load_likes_failed'),
        context: { userId: user.id }
      });
    }
  }

  async function handleLike(postId: string) {
    if (!user) return;

    try {
      const isLiked = userLikes.has(postId);
      if (isLiked) {
        const { error } = await supabase
          .from('user_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .eq('type', 'like');

        if (error) throw error;

        setUserLikes((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      } else {
        const { error } = await supabase
          .from('user_interactions')
          .insert({
            user_id: user.id,
            post_id: postId,
            type: 'like',
          });

        if (error) throw error;

        setUserLikes((prev) => new Set([...prev, postId]));
      }
    } catch (error) {
      handleError(error, {
        userMessage: t('error.like_failed'),
        context: { 
          postId,
          userId: user.id,
          action: userLikes.has(postId) ? 'unlike' : 'like'
        }
      });
    }
  }

  async function handleComment(postId: string, content: string) {
    if (!user) return;

    try {
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
    } catch (error) {
      handleError(error, {
        userMessage: t('error.comment_failed'),
        context: { 
          postId,
          userId: user.id
        }
      });
    }
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
              {t('timeline.no_more_posts')}
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