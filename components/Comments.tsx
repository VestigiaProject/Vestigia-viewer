'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import type { UserInteraction } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { fr } from 'date-fns/locale';
import { Trash2, Heart, MessageSquare } from 'lucide-react';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { supabase } from '@/lib/supabase';

interface CommentLikes {
  count: number;
  isLiked: boolean;
}

interface CommentsProps {
  postId: string;
  comments: (UserInteraction & {
    user_profiles: {
      username: string | null;
      avatar_url: string | null;
    };
    likes?: CommentLikes;
    replies?: (UserInteraction & {
      user_profiles: {
        username: string | null;
        avatar_url: string | null;
      };
      likes?: CommentLikes;
    })[];
  })[];
  onComment: (content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onLikeComment?: (commentId: string) => Promise<void>;
  onReply?: (commentId: string, content: string) => Promise<void>;
  onDeleteReply?: (replyId: string) => Promise<void>;
  onLikeReply?: (replyId: string) => Promise<void>;
}

export function Comments({ comments, onComment, onDeleteComment, onLikeComment, onReply, onDeleteReply, onLikeReply }: CommentsProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentLikes, setCommentLikes] = useState<Record<string, CommentLikes>>({});

  useEffect(() => {
    const fetchCommentLikes = async () => {
      if (!comments.length) return;

      const likes = await Promise.all(
        comments.map(async (comment) => {
          const { data: likesData } = await supabase
            .from('user_interactions')
            .select('id')
            .eq('parent_id', comment.id)
            .eq('type', 'comment_like');

          const { data: userLike } = user ? await supabase
            .from('user_interactions')
            .select('id')
            .eq('parent_id', comment.id)
            .eq('user_id', user.id)
            .eq('type', 'comment_like')
            .single() : { data: null };

          // Also fetch likes for replies
          const replyLikes = await Promise.all(
            (comment.replies || []).map(async (reply) => {
              const { data: replyLikesData } = await supabase
                .from('user_interactions')
                .select('id')
                .eq('parent_id', reply.id)
                .eq('type', 'comment_like');

              const { data: userReplyLike } = user ? await supabase
                .from('user_interactions')
                .select('id')
                .eq('parent_id', reply.id)
                .eq('user_id', user.id)
                .eq('type', 'comment_like')
                .single() : { data: null };

              return {
                replyId: reply.id,
                count: replyLikesData?.length || 0,
                isLiked: !!userReplyLike
              };
            })
          );

          const replyLikesMap = replyLikes.reduce((acc, { replyId, count, isLiked }) => ({
            ...acc,
            [replyId]: { count, isLiked }
          }), {});

          return {
            commentId: comment.id,
            count: likesData?.length || 0,
            isLiked: !!userLike,
            replyLikes: replyLikesMap
          };
        })
      );

      const likesMap = likes.reduce((acc, { commentId, count, isLiked, replyLikes }) => ({
        ...acc,
        [commentId]: { count, isLiked },
        ...replyLikes
      }), {});

      setCommentLikes(likesMap);
    };

    fetchCommentLikes();
  }, [comments, user]);

  const handleLikeComment = async (commentId: string) => {
    if (!user || !onLikeComment) return;

    const currentLikes = commentLikes[commentId] || { count: 0, isLiked: false };
    
    // Optimistic update
    setCommentLikes(prev => ({
      ...prev,
      [commentId]: {
        count: currentLikes.isLiked ? currentLikes.count - 1 : currentLikes.count + 1,
        isLiked: !currentLikes.isLiked
      }
    }));

    try {
      await onLikeComment(commentId);
    } catch (error) {
      // Revert on error
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: currentLikes
      }));
      console.error('Error liking comment:', error);
    }
  };

  const handleLikeReply = async (replyId: string) => {
    if (!user || !onLikeReply) return;

    const currentLikes = commentLikes[replyId] || { count: 0, isLiked: false };
    
    // Optimistic update
    setCommentLikes(prev => ({
      ...prev,
      [replyId]: {
        count: currentLikes.isLiked ? currentLikes.count - 1 : currentLikes.count + 1,
        isLiked: !currentLikes.isLiked
      }
    }));

    try {
      await onLikeReply(replyId);
    } catch (error) {
      // Revert on error
      setCommentLikes(prev => ({
        ...prev,
        [replyId]: currentLikes
      }));
      console.error('Error liking reply:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyContent.trim() || isSubmitting || !replyingTo || !onReply) return;

    setIsSubmitting(true);
    try {
      await onReply(replyingTo, replyContent);
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error submitting reply:', error);
      // Keep the reply form open and content intact on error
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('comments.title')}</h2>

      {user && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>
                {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('comments.write')}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? t('comments.posting') : t('comments.post')}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            {t('comments.no_comments')}
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              <div className="flex space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.user_profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {comment.user_profiles?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">
                        {comment.user_profiles?.username || user?.email || ''}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: language === 'fr' ? fr : undefined
                          })}
                        </span>
                        {user && comment.user_id === user.id && onDeleteComment && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => onDeleteComment(comment.id)}
                            title={t('comments.delete.title')}
                            aria-label={t('comments.delete.title')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap">{comment.content}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`space-x-1 ${commentLikes[comment.id]?.isLiked ? 'text-red-500' : ''}`}
                        onClick={() => handleLikeComment(comment.id)}
                        disabled={!user}
                      >
                        <Heart className={`h-4 w-4 ${commentLikes[comment.id]?.isLiked ? 'fill-current' : ''}`} />
                        <span>{commentLikes[comment.id]?.count || 0}</span>
                      </Button>
                      {user && onReply && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="space-x-1"
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>{t('comments.reply')}</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Reply form */}
                  {user && replyingTo === comment.id && (
                    <form onSubmit={handleSubmitReply} className="mt-4 space-y-4">
                      <div className="flex gap-4 pl-8">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={t('comments.write_reply')}
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pl-12">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                          className="mr-2"
                        >
                          {t('comments.cancel')}
                        </Button>
                        <Button
                          type="submit"
                          disabled={!replyContent.trim() || isSubmitting}
                        >
                          {isSubmitting ? t('comments.posting') : t('comments.post_reply')}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-4 pl-8">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex space-x-4">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={reply.user_profiles?.avatar_url || undefined} />
                            <AvatarFallback>
                              {reply.user_profiles?.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-muted/50 rounded-lg p-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">
                                  {reply.user_profiles?.username || user?.email || ''}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(reply.created_at), {
                                      addSuffix: true,
                                      locale: language === 'fr' ? fr : undefined
                                    })}
                                  </span>
                                  {user && reply.user_id === user.id && onDeleteReply && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => onDeleteReply(reply.id)}
                                      title={t('comments.delete.title')}
                                      aria-label={t('comments.delete.title')}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <p className="whitespace-pre-wrap">{reply.content}</p>
                              <div className="mt-2 flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`space-x-1 ${commentLikes[reply.id]?.isLiked ? 'text-red-500' : ''}`}
                                  onClick={() => handleLikeReply(reply.id)}
                                  disabled={!user}
                                >
                                  <Heart className={`h-4 w-4 ${commentLikes[reply.id]?.isLiked ? 'fill-current' : ''}`} />
                                  <span>{commentLikes[reply.id]?.count || 0}</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 