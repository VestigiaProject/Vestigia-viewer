'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/hooks/useLanguage';
import { Post } from '@/components/Post';
import { Comments } from '@/components/Comments';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import type { UserInteraction } from '@/lib/supabase';
import { useTranslation } from '@/lib/hooks/useTranslation';

type CommentWithUser = UserInteraction & {
  user_profiles: {
    username: string | null;
    avatar_url: string | null;
  };
};

export function PostContent({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [post, setPost] = useState<any>(null);
  const [sourceContent, setSourceContent] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const { language } = useLanguage();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data: postData, error: postError } = await supabase
          .from('historical_posts')
          .select('*, historical_figures(*)')
          .eq('id', id)
          .single();

        if (postError) throw postError;
        if (!postData) throw new Error('Post not found');

        setPost(postData);
        setError(false);
        
        // Fetch source content based on language
        const { data: sourceData } = await supabase
          .from(language === 'en' ? 'source_en' : 'historical_posts')
          .select('source')
          .eq('id', id)
          .single();
          
        if (sourceData) {
          setSourceContent(sourceData.source);
        }

        // Fetch interactions
        const [likesData, commentsData] = await Promise.all([
          supabase
            .from('user_interactions')
            .select('*')
            .eq('post_id', id)
            .eq('type', 'like'),
          supabase
            .from('user_interactions')
            .select(`
              *,
              user_profiles (
                username,
                avatar_url
              )
            `)
            .eq('post_id', id)
            .eq('type', 'comment')
            .order('created_at', { ascending: true })
        ]);

        setLikes(likesData.data?.length || 0);
        setComments(commentsData.data || []);

        // Check if user has liked the post
        if (user) {
          const { data: userLike } = await supabase
            .from('user_interactions')
            .select('*')
            .eq('post_id', id)
            .eq('user_id', user.id)
            .eq('type', 'like')
            .single();

          setIsLiked(!!userLike);
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(true);
      }
    };

    fetchPost();

    // Set up realtime subscription for post updates
    const postChannel = supabase
      .channel('post_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'historical_posts',
          filter: `id=eq.${id}`,
        },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            setError(true);
            return;
          }

          const { data: updatedPost } = await supabase
            .from('historical_posts')
            .select('*, historical_figures(*)')
            .eq('id', id)
            .single();

          if (updatedPost) {
            setPost(updatedPost);
            setError(false);

            const { data: sourceData } = await supabase
              .from(language === 'en' ? 'source_en' : 'historical_posts')
              .select('source')
              .eq('id', id)
              .single();
              
            if (sourceData) {
              setSourceContent(sourceData.source);
            }
          }
        }
      )
      .subscribe();

    // Set up realtime subscription for interactions
    const interactionsChannel = supabase
      .channel('interactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_interactions',
          filter: `post_id=eq.${id}`,
        },
        async () => {
          // Refetch all interactions
          const [likesData, commentsData] = await Promise.all([
            supabase
              .from('user_interactions')
              .select('*')
              .eq('post_id', id)
              .eq('type', 'like'),
            supabase
              .from('user_interactions')
              .select(`
                *,
                user_profiles (
                  username,
                  avatar_url
                )
              `)
              .eq('post_id', id)
              .eq('type', 'comment')
              .order('created_at', { ascending: true })
          ]);

          setLikes(likesData.data?.length || 0);
          setComments(commentsData.data || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postChannel);
      supabase.removeChannel(interactionsChannel);
    };
  }, [id, language, user]);

  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        await supabase
          .from('user_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', id)
          .eq('type', 'like');

        setIsLiked(false);
        setLikes(prev => prev - 1);
      } else {
        await supabase
          .from('user_interactions')
          .insert({
            user_id: user.id,
            post_id: id,
            type: 'like',
          });

        setIsLiked(true);
        setLikes(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleComment = async (content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { data: comment, error } = await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          post_id: id,
          type: 'comment',
          content: content.trim(),
        })
        .select(`
          *,
          user_profiles (
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      setComments(prev => [...prev, comment as CommentWithUser]);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_interactions')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Extra safety check

      if (error) throw error;

      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-destructive/10 text-destructive rounded-lg p-4">
          This post is no longer available.
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Post 
        post={post}
        likes={likes}
        isLiked={isLiked}
        commentsCount={comments.length}
        onLike={handleLike}
      />
      
      <Accordion type="single" collapsible>
        <AccordionItem value="source">
          <AccordionTrigger>{t('post.source')}</AccordionTrigger>
          <AccordionContent>
            <div className="whitespace-pre-wrap p-4 bg-muted rounded-md">
              {sourceContent}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-8">
        <Comments 
          postId={id} 
          comments={comments} 
          onComment={handleComment}
          onDeleteComment={handleDeleteComment}
        />
      </div>
    </div>
  );
} 