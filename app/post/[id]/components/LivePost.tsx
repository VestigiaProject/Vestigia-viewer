'use client';

import { useEffect, useState } from 'react';
import { PostContent } from '@/components/post/PostContent';
import { PostComments } from '@/components/post/PostComments';
import { fetchPost } from '@/lib/api/posts';
import type { HistoricalPostWithFigure } from '@/lib/supabase';

interface LivePostProps {
  initialPost: HistoricalPostWithFigure;
}

const POLLING_INTERVAL = 5000; // Poll every 5 seconds

export function LivePost({ initialPost }: LivePostProps) {
  const [post, setPost] = useState<HistoricalPostWithFigure>(initialPost);

  // Function to fetch the latest post data
  const loadPost = async () => {
    try {
      const updatedPost = await fetchPost(initialPost.id);
      // Only update if the content has changed
      if (JSON.stringify(updatedPost) !== JSON.stringify(post)) {
        setPost(updatedPost);
        console.log('Post updated:', new Date().toISOString());
      }
    } catch (error) {
      console.error('Error loading post:', error);
    }
  };

  // Set up polling
  useEffect(() => {
    // Initial load
    loadPost();

    // Set up polling interval
    const intervalId = setInterval(loadPost, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [initialPost.id]);

  return (
    <>
      <PostContent post={post} />
      <PostComments postId={post.id} />
    </>
  );
} 