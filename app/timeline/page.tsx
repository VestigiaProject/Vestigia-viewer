'use client';

import { HistoricalPost } from '@/components/timeline/HistoricalPost';
import { useTimeProgress } from '@/lib/hooks/useTimeProgress';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Skeleton } from '@/components/ui/skeleton';
import { handleError } from '@/lib/utils/error-handler';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useTimelinePosts } from '@/lib/hooks/useTimelinePosts';

const START_DATE = '1789-06-04';

export default function TimelinePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { currentDate } = useTimeProgress(START_DATE);
  const { posts, loading, hasMore, loadMorePosts, setPage } = useTimelinePosts(currentDate);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  // Load user likes
  useEffect(() => {
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
        handleError(error, { userMessage: t('error.load_likes_failed') });
      }
    }

    loadUserLikes();
  }, [user, t]);

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
      handleError(error, { userMessage: t('error.like_failed') });
    }
  }

  async function handleComment(postId: string, content: string) {
    if (!user) return;

    try {
      const { error } = await supabase
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
    } catch (error) {
      handleError(error, { userMessage: t('error.comment_failed') });
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
            setPage(prev => {
              const nextPage = prev + 1;
              loadMorePosts(nextPage);
              return nextPage;
            });
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
                />
              </div>
            ))}
          </div>
        </InfiniteScroll>
      )}
    </main>
  );
}