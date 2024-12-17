'use client';

import { useEffect, useState } from 'react';
import { PostContent } from '@/components/post/PostContent';
import { PostComments } from '@/components/post/PostComments';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import type { HistoricalPostWithFigure } from '@/lib/supabase';

export default function PostPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<HistoricalPostWithFigure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [params.id]);

  async function loadPost() {
    try {
      const { data } = await supabase
        .from('historical_posts')
        .select(`
          *,
          figure:historical_figures(*)
        `)
        .eq('id', params.id)
        .single();

      setPost(data);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-2xl mx-auto py-4">
        <PostContent post={post} />
        <PostComments postId={post.id} />
      </main>
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-2xl mx-auto py-4">
        <Skeleton className="h-64 w-full mb-8" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </main>
    </div>
  );
}