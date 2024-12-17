'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import type { UserInteraction } from '@/lib/supabase';

type PostCommentsProps = {
  postId: string;
};

export function PostComments({ postId }: PostCommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<UserInteraction[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    const { data: comments } = await supabase
      .from('user_interactions')
      .select(`
        *,
        user:user_profiles!user_interactions_user_id_fkey(
          username,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .eq('type', 'comment')
      .order('created_at', { ascending: true });

    if (comments) {
      setComments(comments.map(comment => ({
        ...comment,
        username: comment.user?.username,
        avatar_url: comment.user?.avatar_url
      })));
    }
  }

  const handleSubmit = async () => {
    if (!user || !content.trim() || loading) return;
    
    setLoading(true);
    try {
      const { data: comment, error } = await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          post_id: postId,
          type: 'comment',
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setComments(prev => [...prev, {
        ...comment,
        username: user.user_metadata.username,
        avatar_url: user.user_metadata.avatar_url
      }]);
      setContent('');
      
      toast({
        title: 'Comment posted',
        description: 'Your comment has been added successfully.',
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to post comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="comments" className="space-y-6">
      <h2 className="text-2xl font-semibold">Comments</h2>
      
      <div className="space-y-4">
        <Textarea
          placeholder="Write a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="resize-none"
          rows={3}
          maxLength={500}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {content.length}/500 characters
          </span>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || loading}
          >
            {loading ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.avatar_url} />
                <AvatarFallback>{comment.username?.[0].toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium">{comment.username}</span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(comment.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}