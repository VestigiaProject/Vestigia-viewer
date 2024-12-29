'use client';

import { HistoricalPost } from '@/components/timeline/HistoricalPost';
import { fetchFigurePosts } from '@/lib/api/figures';
import { fetchPostInteractions } from '@/lib/api/posts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Skeleton } from '@/components/ui/skeleton';
import type { HistoricalPostWithFigure, UserInteraction } from '@/lib/supabase';
import { handleError } from '@/lib/utils/error-handler';
import { useTranslation } from '@/lib/hooks/useTranslation';

export function ProfilePosts({
  figureId,
  currentDate,
}: {
  figureId: string;
  currentDate: Date;
}) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<HistoricalPostWithFigure[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [postInteractions, setPostInteractions] = useState<Record<string, { likes: number; comments: UserInteraction[] }>>({});

  useEffect(() => {
    loadPosts();
    loadUserLikes();
  }, [figureId]);

  async function loadPosts() {
    try {
      const newPosts = await fetchFigurePosts(figureId, currentDate, page);
      setPosts((prev) => [...prev, ...newPosts]);
      setHasMore(newPosts.length === 10);

      // Load interactions for new posts
      const interactions = await Promise.all(
        newPosts.map((post) => fetchPostInteractions(post.id))
      );
      const newInteractions = newPosts.reduce((acc, post, index) => {
        acc[post.id] = interactions[index];
        return acc;
      }, {} as Record<string, { likes: number; comments: UserInteraction[] }>);

      setPostInteractions((prev) => ({ ...prev, ...newInteractions }));
    } catch (error) {
      handleError(error, {
        userMessage: t('error.load_posts_failed'),
        context: { 
          figureId,
          page,
          currentDate: currentDate.toISOString()
        }
      });
    }
  }

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
      <InfiniteScroll
        dataLength={posts.length}
        next={() => {
          setPage((prev) => prev + 1);
          loadPosts();
        }}
        hasMore={hasMore}
        loader={<Skeleton className="h-48 w-full my-4" />}
        endMessage={
          <p className="text-center text-muted-foreground py-4">
            {t('profile.no_more_posts')}
          </p>
        }
      >
        <div className="space-y-4">
          {posts.map((post) => (
            <HistoricalPost
              key={post.id}
              post={post}
            />
          ))}
        </div>
      </InfiniteScroll>
    </main>
  );
}