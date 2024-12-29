import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { handleError } from '../utils/handleError';

// Types
interface UserProfile {
  username: string;
  avatar_url: string;
}

interface CommentWithUser {
  id: string;
  user_id: string;
  content: string | null;
  created_at: string;
  user_profiles: UserProfile;
  likes?: {
    count: number;
    isLiked: boolean;
  };
}

interface DatabaseComment {
  id: string;
  user_id: string;
  content: string | null;
  created_at: string;
  user_profiles: {
    username: string;
    avatar_url: string;
  };
}

export function usePostInteractions(postId: string) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [commentLikes, setCommentLikes] = useState<Record<string, { count: number; isLiked: boolean }>>({});

  const transformComment = (data: unknown): CommentWithUser => {
    const comment = data as DatabaseComment;
    return {
      id: comment.id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      user_profiles: comment.user_profiles,
      likes: commentLikes[comment.id]
    };
  };

  // Load initial data and set up real-time subscriptions
  useEffect(() => {
    async function loadPostInteractions() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch likes count
        const { data: likesData, error: likesError } = await supabase
          .from('user_interactions')
          .select('id')
          .eq('post_id', postId)
          .eq('type', 'like');
        if (likesError) throw likesError;
        setLikes(likesData?.length || 0);

        // Check if current user has liked
        const { data: userLike } = await supabase
          .from('user_interactions')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .eq('type', 'like')
          .single();
        setIsLiked(!!userLike);

        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('user_interactions')
          .select(`
            id,
            user_id,
            content,
            created_at,
            user_profiles (username, avatar_url)
          `)
          .eq('post_id', postId)
          .eq('type', 'comment')
          .order('created_at', { ascending: true });
        if (commentsError) throw commentsError;

        // Fetch comment likes
        const commentLikesData = await Promise.all(
          (commentsData || []).map(async (comment) => {
            const [likesCount, userLike] = await Promise.all([
              supabase
                .from('user_interactions')
                .select('id')
                .eq('parent_id', comment.id)
                .eq('type', 'comment_like'),
              user ? supabase
                .from('user_interactions')
                .select('id')
                .eq('parent_id', comment.id)
                .eq('user_id', user.id)
                .eq('type', 'comment_like')
                .single() : { data: null }
            ]);

            return {
              commentId: comment.id,
              count: likesCount.data?.length || 0,
              isLiked: !!userLike.data
            };
          })
        );

        // Build comment likes map
        const likesMap = commentLikesData.reduce((acc, { commentId, count, isLiked }) => ({
          ...acc,
          [commentId]: { count, isLiked }
        }), {});
        setCommentLikes(likesMap);

        // Transform comments with likes data
        const transformedComments = (commentsData || []).map(transformComment);
        setComments(transformedComments);
      } catch (error) {
        handleError(error, 'Failed to load interactions.');
      }
    }

    // Initial load
    loadPostInteractions();

    // Set up real-time subscription for interactions
    const channel = supabase
      .channel(`post-${postId}-interactions`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_interactions',
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Refetch all interactions
            const [likesData, commentsData] = await Promise.all([
              supabase
                .from('user_interactions')
                .select('id')
                .eq('post_id', postId)
                .eq('type', 'like'),
              supabase
                .from('user_interactions')
                .select(`
                  id,
                  user_id,
                  content,
                  created_at,
                  user_profiles (username, avatar_url)
                `)
                .eq('post_id', postId)
                .eq('type', 'comment')
                .order('created_at', { ascending: true })
            ]);

            if (likesData.error) throw likesData.error;
            if (commentsData.error) throw commentsData.error;

            // Update likes count
            setLikes(likesData.data?.length || 0);

            // Check if current user's like status has changed
            const { data: userLike } = await supabase
              .from('user_interactions')
              .select('id')
              .eq('post_id', postId)
              .eq('user_id', user.id)
              .eq('type', 'like')
              .single();
            setIsLiked(!!userLike);

            // Fetch comment likes
            const commentLikesData = await Promise.all(
              (commentsData.data || []).map(async (comment) => {
                const [likesCount, userLike] = await Promise.all([
                  supabase
                    .from('user_interactions')
                    .select('id')
                    .eq('parent_id', comment.id)
                    .eq('type', 'comment_like'),
                  user ? supabase
                    .from('user_interactions')
                    .select('id')
                    .eq('parent_id', comment.id)
                    .eq('user_id', user.id)
                    .eq('type', 'comment_like')
                    .single() : { data: null }
                ]);

                return {
                  commentId: comment.id,
                  count: likesCount.data?.length || 0,
                  isLiked: !!userLike.data
                };
              })
            );

            // Build comment likes map
            const likesMap = commentLikesData.reduce((acc, { commentId, count, isLiked }) => ({
              ...acc,
              [commentId]: { count, isLiked }
            }), {});
            setCommentLikes(likesMap);

            // Update comments with likes data
            const transformedComments = (commentsData.data || []).map(transformComment);
            setComments(transformedComments);
          } catch (error) {
            handleError(error, 'Failed to update interactions in real-time.');
          }
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  // Like post
  const likePost = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          post_id: postId,
          type: 'like',
        });

      if (error) throw error;

      // Optimistic update
      setIsLiked(true);
      setLikes(prev => prev + 1);
    } catch (error) {
      handleError(error, 'Could not like the post.');
    }
  }, [postId]);

  // Unlike post
  const unlikePost = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_interactions')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .eq('type', 'like');

      if (error) throw error;

      // Optimistic update
      setIsLiked(false);
      setLikes(prev => prev - 1);
    } catch (error) {
      handleError(error, 'Could not unlike the post.');
    }
  }, [postId]);

  // Add comment
  const addComment = useCallback(async (content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          post_id: postId,
          type: 'comment',
          content: content.trim(),
        })
        .select(`
          id,
          user_id,
          content,
          created_at,
          user_profiles (username, avatar_url)
        `)
        .single();

      if (error) throw error;
      if (data) {
        // Optimistic update
        const newComment = transformComment(data);
        setComments(prev => [...prev, newComment]);
      }
    } catch (error) {
      handleError(error, 'Failed to post comment.');
    }
  }, [postId]);

  // Delete comment
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_interactions')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Extra safety check

      if (error) throw error;

      // Optimistic update
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      // Remove comment likes from state
      setCommentLikes(prev => {
        const { [commentId]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      handleError(error, 'Failed to delete comment.');
    }
  }, []);

  // Toggle comment like
  const toggleCommentLike = useCallback(async (commentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentLikes = commentLikes[commentId] || { count: 0, isLiked: false };
      
      // Optimistic update
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: {
          count: currentLikes.isLiked ? currentLikes.count - 1 : currentLikes.count + 1,
          isLiked: !currentLikes.isLiked
        }
      }));

      if (currentLikes.isLiked) {
        // Unlike comment
        const { data: existingLike } = await supabase
          .from('user_interactions')
          .select('id')
          .eq('parent_id', commentId)
          .eq('user_id', user.id)
          .eq('type', 'comment_like')
          .single();

        if (existingLike) {
          const { error } = await supabase
            .from('user_interactions')
            .delete()
            .eq('id', existingLike.id);

          if (error) throw error;
        }
      } else {
        // Like comment
        const { error } = await supabase
          .from('user_interactions')
          .insert({
            user_id: user.id,
            parent_id: commentId,
            type: 'comment_like',
          });

        if (error) throw error;
      }
    } catch (error) {
      // Revert optimistic update on error
      const currentLikes = commentLikes[commentId] || { count: 0, isLiked: false };
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: currentLikes
      }));
      handleError(error, 'Failed to toggle comment like.');
    }
  }, [commentLikes]);

  return {
    isLiked,
    likes,
    comments,
    likePost,
    unlikePost,
    addComment,
    deleteComment,
    toggleCommentLike,
  };
} 