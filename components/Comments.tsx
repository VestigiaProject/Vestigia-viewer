'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import type { UserInteraction } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { fr } from 'date-fns/locale';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { supabase } from '@/lib/supabase';

interface CommentsProps {
  postId: string;
  comments: (UserInteraction & {
    user_profiles: {
      username: string | null;
      avatar_url: string | null;
    };
    likes_count: number;
    replies?: (UserInteraction & {
      user_profiles: {
        username: string | null;
        avatar_url: string | null;
      };
      likes_count: number;
    })[];
  })[];
  onComment: (content: string, parentCommentId?: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
}

export function Comments({ comments, onComment, onDeleteComment }: CommentsProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  // Sort comments by likes count
  const sortedComments = [...comments].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));

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

  const handleReply = async (parentCommentId: string) => {
    if (!user || !replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onComment(replyContent, parentCommentId);
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    const isLiked = likedComments.has(commentId);
    try {
      if (isLiked) {
        await supabase
          .from('user_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', commentId)
          .eq('type', 'like');

        setLikedComments(prev => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
      } else {
        await supabase
          .from('user_interactions')
          .insert({
            user_id: user.id,
            post_id: commentId,
            type: 'like',
          });

        setLikedComments(prev => new Set([...prev, commentId]));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
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
        {sortedComments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            {t('comments.no_comments')}
          </p>
        ) : (
          sortedComments.map((comment) => (
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
                            title={t('comments.delete.description')}
                            aria-label={t('comments.delete.description')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap">{comment.content}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`space-x-1 ${likedComments.has(comment.id) ? 'text-red-500' : ''}`}
                        onClick={() => handleLikeComment(comment.id)}
                        title={t('comments.like.title')}
                      >
                        <Heart className={`h-4 w-4 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
                        <span>{comment.likes_count || 0}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="space-x-1"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{t('comments.reply')}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reply form */}
              {replyingTo === comment.id && user && (
                <div className="ml-14 space-y-4">
                  <div className="flex gap-4">
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
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                      }}
                    >
                      {t('comments.cancel')}
                    </Button>
                    <Button
                      onClick={() => handleReply(comment.id)}
                      disabled={!replyContent.trim() || isSubmitting}
                    >
                      {isSubmitting ? t('comments.posting') : t('comments.reply')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-14 space-y-4">
                  {comment.replies
                    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
                    .map((reply) => (
                      <div key={reply.id} className="flex space-x-4">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={reply.user_profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            {reply.user_profiles?.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-muted rounded-lg p-4">
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
                                {user && reply.user_id === user.id && onDeleteComment && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => onDeleteComment(reply.id)}
                                    title={t('comments.delete.description')}
                                    aria-label={t('comments.delete.description')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="whitespace-pre-wrap">{reply.content}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`space-x-1 ${likedComments.has(reply.id) ? 'text-red-500' : ''}`}
                                onClick={() => handleLikeComment(reply.id)}
                                title={t('comments.like.title')}
                              >
                                <Heart className={`h-4 w-4 ${likedComments.has(reply.id) ? 'fill-current' : ''}`} />
                                <span>{reply.likes_count || 0}</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 