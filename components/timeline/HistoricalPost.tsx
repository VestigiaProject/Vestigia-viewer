'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Heart, MessageCircle } from 'lucide-react';
import type { HistoricalPostWithFigure, UserInteraction } from '@/lib/supabase';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

type PostProps = {
  post: HistoricalPostWithFigure;
  onLike: (postId: string) => Promise<void>;
  onComment: (postId: string, content: string) => Promise<void>;
  likes: number;
  isLiked: boolean;
  comments: UserInteraction[];
};

export function HistoricalPost({
  post,
  onLike,
  onComment,
  likes,
  isLiked,
  comments,
}: PostProps) {
  const [likeCount, setLikeCount] = useState(likes);
  const [liked, setLiked] = useState(isLiked);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onLike(post.id);
      setLiked(!liked);
      setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: 'Error',
        description: 'Failed to like post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={`/post/${post.id}`}>
      <Card className="p-4 hover:bg-accent/50 transition-colors">
        <div className="flex space-x-4">
          <Link href={`/profile/${post.figure.id}`}>
            <Avatar>
              <AvatarImage src={post.figure.profile_image} />
              <AvatarFallback>{post.figure.name[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href={`/profile/${post.figure.id}`}
                  className="font-semibold hover:underline"
                >
                  {post.figure.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {post.figure.title}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                {format(new Date(post.original_date), 'MMM d, yyyy')}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
            {post.media_url && (
              <img
                src={post.media_url}
                alt="Post media"
                className="rounded-lg max-h-96 object-cover mt-2"
              />
            )}
            <div className="flex items-center space-x-4 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className={`space-x-1 ${liked ? 'text-red-500' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleLike();
                }}
                disabled={loading}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="space-x-1"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/post/${post.id}#comments`;
                }}
              >
                <MessageCircle className="h-4 w-4" />
                <span>{comments.length}</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}