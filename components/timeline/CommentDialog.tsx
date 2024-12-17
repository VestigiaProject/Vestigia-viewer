import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useState } from 'react';
import type { UserInteraction } from '@/lib/supabase';

type CommentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  comments: UserInteraction[];
  onAddComment: (content: string) => Promise<void>;
};

export function CommentDialog({
  open,
  onOpenChange,
  postId,
  comments,
  onAddComment,
}: CommentDialogProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      await onAddComment(content);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <ScrollArea className="h-[300px] pr-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-2 mb-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">User</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
          <div className="flex flex-col space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none"
            />
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || loading}
              className="self-end"
            >
              {loading ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}