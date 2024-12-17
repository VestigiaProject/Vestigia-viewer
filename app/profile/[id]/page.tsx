import { supabase } from '@/lib/supabase';

export async function generateStaticParams() {
  const { data: figures } = await supabase
    .from('historical_figures')
    .select('id');

  return (figures || []).map((figure) => ({
    id: figure.id,
  }));
}

'use client';

import { ProfileHeader, ProfileHeaderSkeleton } from '@/components/profile/ProfileHeader';
import { HistoricalPost } from '@/components/timeline/HistoricalPost';
import { useTimeProgress } from '@/lib/hooks/useTimeProgress';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchFigureProfile, fetchFigurePosts } from '@/lib/api/figures';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Skeleton } from '@/components/ui/skeleton';
import type { HistoricalFigure, HistoricalPostWithFigure } from '@/lib/supabase';

const START_DATE = '1789-06-01';

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { currentDate } = useTimeProgress(START_DATE);
  const [figure, setFigure] = useState<HistoricalFigure | null>(null);
  const [posts, setPosts] = useState<HistoricalPostWithFigure[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProfile();
    loadPosts();
    loadUserLikes();
  }, [id]);

  async function loadProfile() {
    try {
      const profile = await fetchFigureProfile(id as string);
      setFigure(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  async function loadPosts() {
    try {
      const newPosts = await fetchFigurePosts(id as string, currentDate, page);
      setPosts(prev => [...prev, ...newPosts]);
      setHasMore(newPosts.length === 10);
      setLoading(false);
    } catch (error) {
      console.error('Error loading posts:', error);
      setLoading(false);
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

  if (!figure && loading) {
    return (
      <div className="min-h-screen bg-background">
        <ProfileHeaderSkeleton />
        <main className="container max-w-2xl mx-auto py-4">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!figure) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Historical figure not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader figure={figure} postCount={posts.length} />
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
                likes={0} // TODO: Implement likes count
                isLiked={userLikes.has(post.id)}
              />
            ))}
          </div>
        </InfiniteScroll>
      </main>
    </div>
  );
}