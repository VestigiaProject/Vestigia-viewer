'use client';

import { Header } from '@/components/layout/Header';
import { PostCard } from '@/components/posts/PostCard';
import { commentOnPost, fetchPosts, likePost } from '@/lib/api/posts';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTimeProgress } from '@/lib/hooks/useTimeProgress';
import { HistoricalPost } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

const START_DATE = '1789-06-01T00:00:00Z';

export default function TimelinePage() {
  const [posts, setPosts] = useState<(HistoricalPost & { figure: HistoricalFigure })[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const currentDate = useTimeProgress(START_DATE);
  const { user } = useAuth();

  const loadPosts = async () => {
    try {
      const newPosts = await fetchPosts(currentDate, page);
      if (newPosts.length < 10) setHasMore(false);
      setPosts(prev => [...prev, ...newPosts]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleLike = async (postId: string) => {
    if (!user) return;
    await likePost(user.id, postId);
  };

  const handleComment = async (postId: string, content: string) => {
    if (!user) return;
    await commentOnPost(user.id, postId, content);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 text-center">
            <div className="text-2xl font-bold">
              Current Date: {currentDate.toLocaleDateString()}
            </div>
          </div>
          <InfiniteScroll
            dataLength={posts.length}
            next={loadPosts}
            hasMore={hasMore}
            loader={<div className="text-center py-4">Loading...</div>}
          >
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={() => handleLike(post.id)}
                onComment={(content) => handleComment(post.id, content)}
              />
            ))}
          </InfiniteScroll>
        </div>
      </main>
    </div>
  );
}