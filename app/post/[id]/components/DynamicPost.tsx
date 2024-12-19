'use client';

import { useEffect, useState } from 'react';
import { HistoricalPost } from '@/components/timeline/HistoricalPost';
import { PostComments } from '@/components/post/PostComments';
import { fetchPost, fetchPostInteractions } from '@/lib/api/posts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import type { HistoricalPostWithFigure, UserInteraction } from '@/lib/supabase';

interface DynamicPostProps {
  postId: string;
  initialPost: HistoricalPostWithFigure;
}

export function DynamicPost({ postId, initialPost }: DynamicPostProps) {
  const { user } = useAuth();
  const [post, setPost] = useState<HistoricalPostWithFigure>(initialPost);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [postInteractions, setPostInteractions] = useState<{ likes: number; comments: UserInteraction[] }>({ likes: 0, comments: [] });

  // Load initial data and set up real-time subscription
  useEffect(() => {
    loadInitialData();

    // Subscribe to real-time updates for the post
    const channel = supabase
      .channel(`post-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'historical_posts',
          filter: `id=eq.${postId}`,
        },
        async () => {
          try {
            const [newPost, interactions] = await Promise.all([
              fetchPost(postId),
              fetchPostInteractions(postId)
            ]);
            
            if (newPost) {
              setPost(newPost);
              setPostInteractions(interactions);
            }
          } catch (error) {
            console.error('Error updating post:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  async function loadInitialData() {
    try {
      // Load user likes
      if (user) {
        const { data: likes } = await supabase
          .from('user_interactions')
          .select('post_id')
          .eq('user_id', user.id)
          .eq('type', 'like');

        if (likes) {
          setUserLikes(new Set(likes.map(like => like.post_id)));
        }
      }

      // Load post interactions
      const interactions = await fetchPostInteractions(postId);
      setPostInteractions(interactions);
    } catch (error) {
      console.error('Error loading initial data:', error);
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
      setPostInteractions(prev => ({
        ...prev,
        likes: prev.likes - 1
      }));
    } else {
      await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          post_id: postId,
          type: 'like',
        });

      setUserLikes(prev => new Set([...prev, postId]));
      setPostInteractions(prev => ({
        ...prev,
        likes: prev.likes + 1
      }));
    }
  }

  async function handleComment(postId: string, content: string) {
    if (!user) return;

    const { data: comment, error } = await supabase
      .from('user_interactions')
      .insert({
        user_id: user.id,
        post_id: postId,
        type: 'comment',
        content,
      })
      .select()
      .single();

    if (error) throw error;

    setPostInteractions(prev => ({
      ...prev,
      comments: [...prev.comments, comment],
    }));
  }

  return (
    <div className="bg-white/95 shadow-sm rounded-lg">
      <HistoricalPost
        post={post}
        onLike={handleLike}
        onComment={handleComment}
        likes={postInteractions.likes}
        isLiked={userLikes.has(postId)}
        comments={postInteractions.comments}
      />
      <PostComments postId={postId} />
    </div>
  );
} 