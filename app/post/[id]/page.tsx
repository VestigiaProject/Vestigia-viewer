'use client';

import { Suspense, useEffect, useState } from 'react';
import { PostContent } from '@/components/post/PostContent';
import { PostComments } from '@/components/post/PostComments';
import { PostSkeleton } from '@/components/post/PostSkeleton';
import { fetchPost } from '@/lib/api/posts';
import { supabase } from '@/lib/supabase';
import type { HistoricalPostWithFigure } from '@/lib/supabase';

export default function PostPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<HistoricalPostWithFigure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`post-${params.id}-content`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'historical_posts',
          filter: `id=eq.${params.id}`,
        },
        async () => {
          await loadPost();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  async function loadPost() {
    try {
      const post = await fetchPost(params.id);
      setPost(post);
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <PostSkeleton />;
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="container max-w-2xl mx-auto py-4">
        <div className="bg-white/95 shadow-sm rounded-lg">
          <Suspense fallback={<PostSkeleton />}>
            <PostContent post={post} />
            <PostComments postId={post.id} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}