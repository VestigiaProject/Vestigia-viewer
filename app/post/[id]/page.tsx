'use client';

import { useEffect, useState } from 'react';
import { PostContent } from '@/components/post/PostContent';
import { PostComments } from '@/components/post/PostComments';
import { PostSkeleton } from '@/components/post/PostSkeleton';
import { fetchPost } from '@/lib/api/posts';
import type { HistoricalPostWithFigure } from '@/lib/supabase';

// For static export
export const dynamic = 'force-static';
export const dynamicParams = false;

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