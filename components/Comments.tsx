'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { fr } from 'date-fns/locale';
import { Heart, Trash2 } from 'lucide-react';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { Markdown } from '@/components/ui/markdown';

interface CommentLikes {
  count: number;
  isLiked: boolean;
}

interface CommentsProps {
  postId: string;
  comments: {
    id: string;
    user_id: string;
    content: string | null;
    created_at: string;
    user_profiles: {
      username: string | null;
      avatar_url: string | null;
    };
    likes?: CommentLikes;
  }[];
  onComment: (content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onToggleCommentLike?: (commentId: string) => Promise<void>;
}

export function Comments({ comments, onComment, onDeleteComment, onToggleCommentLike }: CommentsProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onComment(newComment);
      setNewComment('');
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false);
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
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            {t('comments.no_comments')}
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-4">
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
                  <div className="text-sm">
                    <Markdown content={comment.content || ''} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`space-x-1 ${comment.likes?.isLiked ? 'text-red-500' : ''}`}
                      onClick={() => onToggleCommentLike?.(comment.id)}
                      disabled={!user || !onToggleCommentLike}
                    >
                      <Heart className={`h-4 w-4 ${comment.likes?.isLiked ? 'fill-current' : ''}`} />
                      <span>{comment.likes?.count || 0}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 