'use client';

import { Suspense } from 'react';
import { PostContent } from '@/components/post/PostContent';
import { PostComments } from '@/components/post/PostComments';
import { PostSkeleton } from '@/components/post/PostSkeleton';
import { fetchPost } from '@/lib/api/posts';
import { useEffect, useState } from 'react';
import type { HistoricalPostWithFigure } from '@/lib/supabase';

export default function PostPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<HistoricalPostWithFigure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      try {
        const data = await fetchPost(params.id);
        setPost(data);
      } catch (error) {
        console.error('Error loading post:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [params.id]);

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
        <Suspense fallback={<PostSkeleton />}>
          <PostContent post={post} />
          <PostComments postId={post.id} />
        </Suspense>
      </main>
    </div>
  );
}