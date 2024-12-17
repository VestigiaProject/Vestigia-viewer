'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

interface CommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComment: (content: string) => Promise<void>;
}

export function CommentDialog({ open, onOpenChange, onComment }: CommentDialogProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onComment(content);
      setContent('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Comment</DialogTitle>
        </DialogHeader>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your comment..."
          className="min-h-[100px]"
        />
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
          >
            {loading ? 'Posting...' : 'Post Comment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}