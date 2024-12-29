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
import { Markdown } from '@/components/ui/markdown';
import { handleError } from '@/lib/utils/error-handler';

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
          .from('historical_posts')
          .select('source, source_en')
          .eq('id', id)
          .single();
          
        if (sourceData) {
          setSourceContent(language === 'en' && sourceData.source_en ? sourceData.source_en : sourceData.source);
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
        handleError(err, {
          userMessage: t('error.post_not_found'),
          context: { postId: id }
        });
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
          try {
            if (payload.eventType === 'DELETE') {
              setError(true);
              return;
            }

            const { data: updatedPost, error: postError } = await supabase
              .from('historical_posts')
              .select('*, historical_figures(*)')
              .eq('id', id)
              .single();

            if (postError) throw postError;

            if (updatedPost) {
              setPost(updatedPost);
              setError(false);

              const { data: sourceData, error: sourceError } = await supabase
                .from('historical_posts')
                .select('source, source_en')
                .eq('id', id)
                .single();
                
              if (sourceError) throw sourceError;
              if (sourceData) {
                setSourceContent(language === 'en' && sourceData.source_en ? sourceData.source_en : sourceData.source);
              }
            }
          } catch (error) {
            handleError(error, {
              userMessage: t('error.update_post_failed'),
              context: { 
                postId: id,
                eventType: payload.eventType
              }
            });
            setError(true);
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
          try {
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

            if (likesData.error) throw likesData.error;
            if (commentsData.error) throw commentsData.error;

            setLikes(likesData.data?.length || 0);
            setComments(commentsData.data || []);
          } catch (error) {
            handleError(error, {
              userMessage: t('error.update_interactions_failed'),
              context: { postId: id }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postChannel);
      supabase.removeChannel(interactionsChannel);
    };
  }, [id, language, user, t]);

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
      handleError(error, {
        userMessage: t('error.like_failed'),
        context: { postId: id, userId: user.id }
      });
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
      handleError(error, {
        userMessage: t('error.comment_failed'),
        context: { postId: id, userId: user.id }
      });
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
      handleError(error, {
        userMessage: t('error.delete_comment_failed'),
        context: { commentId, userId: user.id }
      });
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { data: existingLike } = await supabase
        .from('user_interactions')
        .select('id')
        .eq('parent_id', commentId)
        .eq('user_id', user.id)
        .eq('type', 'comment_like')
        .single();

      if (existingLike) {
        await supabase
          .from('user_interactions')
          .delete()
          .eq('id', existingLike.id);
      } else {
        await supabase
          .from('user_interactions')
          .insert({
            user_id: user.id,
            parent_id: commentId,
            type: 'comment_like',
          });
      }
    } catch (error) {
      handleError(error, {
        userMessage: t('error.like_comment_failed'),
        context: { commentId, userId: user.id }
      });
    }
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-destructive/10 text-destructive rounded-lg p-4">
          {t('error.post_not_available')}
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
      
      <div className="bg-card border rounded-lg">
        <Accordion type="single" collapsible>
          <AccordionItem value="source" className="border-none">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent">
              {t('post.source')}
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-4 text-sm">
                <Markdown content={sourceContent} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="mt-8">
        <Comments 
          postId={id} 
          comments={comments} 
          onComment={handleComment}
          onDeleteComment={handleDeleteComment}
          onLikeComment={handleLikeComment}
        />
      </div>
    </div>
  );
} 