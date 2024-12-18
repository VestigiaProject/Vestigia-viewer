'use client';

import { useEffect, useState } from 'react';
import { PostContent } from '@/components/post/PostContent';
import { PostComments } from '@/components/post/PostComments';
import { fetchPost } from '@/lib/api/posts';
import type { HistoricalPostWithFigure } from '@/lib/supabase';

interface DynamicPostProps {
  postId: string;
  initialPost: HistoricalPostWithFigure;
}

export function DynamicPost({ postId, initialPost }: DynamicPostProps) {
  const [post, setPost] = useState<HistoricalPostWithFigure>(initialPost);

  useEffect(() => {
    // Fetch fresh data when component mounts
    async function loadPost() {
      try {
        const data = await fetchPost(postId);
        setPost(data);
      } catch (error) {
        console.error('Error loading post:', error);
      }
    }
    loadPost();
  }, [postId]);

  return (
    <>
      <PostContent post={post} />
      <PostComments postId={post.id} />
    </>
  );
} 