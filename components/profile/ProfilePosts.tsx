'use client';

import { HistoricalPost } from '@/components/timeline/HistoricalPost';
import { fetchFigurePosts } from '@/lib/api/figures';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Skeleton } from '@/components/ui/skeleton';
import type { HistoricalPostWithFigure } from '@/lib/supabase';

export function ProfilePosts({ 
  figureId, 
  currentDate 
}: { 
  figureId: string;
  currentDate: Date;
}) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<HistoricalPostWithFigure[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPosts();
    loadUserLikes();
  }, [figureId]);

  async function loadPosts() {
    try {
      const newPosts = await fetchFigurePosts(figureId, currentDate, page);
      setPosts(prev => [...prev, ...newPosts]);
      setHasMore(newPosts.length === 10);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  }

  async function loadUserLikes() {
    if (!user) return;
    const { data } = await supabase
      .from('user_interactions')
      .select('post_id')
      .eq('user_id', user.id)
      .eq('type', 'like');
    
    if (data) {
      setUserLikes(new Set(data.map(like => like.post_id)));
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
      
      setUserLikes(prev => {
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
      
      setUserLikes(prev => new Set([...prev, postId]));
    }
  }

  function handleComment(postId: string) {
    // TODO: Implement comment dialog
    console.log('Comment on post:', postId);
  }

  return (
    <main className="container max-w-2xl mx-auto py-4">
      <InfiniteScroll
        dataLength={posts.length}
        next={() => {
          setPage(prev => prev + 1);
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
          {posts.map(post => (
            <HistoricalPost
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              likes={0}
              isLiked={userLikes.has(post.id)}
            />
          ))}
        </div>
      </InfiniteScroll>
    </main>
  );
}