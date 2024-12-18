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

  // Function to fetch the latest post data
  const loadPost = async () => {
    try {
      const updatedPost = await fetchPost(params.id);
      setPost(updatedPost);
      setLoading(false);
    } catch (error) {
      console.error('Error loading post:', error);
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadPost();
  }, [params.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`post-${params.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'historical_posts',
          filter: `id=eq.${params.id}`,
        },
        async () => {
          // Reload the post data when changes occur
          await loadPost();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to updates for post ${params.id}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <main className="container max-w-2xl mx-auto py-4">
          <div className="bg-white/95 shadow-sm rounded-lg">
            <PostSkeleton />
          </div>
        </main>
      </div>
    );
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
          <PostContent post={post} />
          <PostComments postId={post.id} />
        </div>
      </main>
    </div>
  );
}