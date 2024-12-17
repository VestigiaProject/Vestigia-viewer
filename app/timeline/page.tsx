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

  async function loadUserLikes() {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('user_interactions')
        .select('post_id')
        .eq('user_id', user.id)
        .eq('type', 'like');

      if (data) {
        setUserLikes(new Set(data.map((like) => like.post_id)));
      }
    } catch (error) {
      console.error('Error loading user likes:', error);
    }
  }

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

  async function handleLike(postId: string) {
    if (!user) return;

    try {
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

      // Update the likes count in postInteractions
      setPostInteractions((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          likes: prev[postId].likes + (isLiked ? -1 : 1),
        },
      }));
    } catch (error) {
      console.error('Error updating like:', error);
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
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TimelineHeader currentDate={currentDate} daysElapsed={daysElapsed} />
      <main className="container max-w-2xl mx-auto py-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : (
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
                No more historical posts to load
              </p>
            }
          >
            <div className="space-y-4">
              {posts.map((post) => (
                <HistoricalPost
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  likes={postInteractions[post.id]?.likes || 0}
                  isLiked={userLikes.has(post.id)}
                  comments={postInteractions[post.id]?.comments || []}
                />
              ))}
            </div>
          </InfiniteScroll>
        )}
      </main>
    </div>
  );
}