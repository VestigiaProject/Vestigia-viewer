import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/useAuth';
import { PostWithFigure } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { CommentDialog } from './CommentDialog';

interface PostCardProps {
  post: PostWithFigure;
  onLike: () => Promise<void>;
  onComment: (content: string) => Promise<void>;
}

export function PostCard({ post, onLike, onComment }: PostCardProps) {
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const { user } = useAuth();

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center space-x-4 p-4">
        <Avatar>
          <AvatarImage src={post.figure.profile_image} />
          <AvatarFallback>{post.figure.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Link href={`/profile/${post.figure_id}`}>
            <div className="font-semibold hover:underline">{post.figure.name}</div>
          </Link>
          <div className="text-sm text-muted-foreground">{post.figure.title}</div>
        </div>
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(post.original_date), { addSuffix: true })}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.media_url && (
          <img
            src={post.media_url}
            alt="Post media"
            className="mt-4 rounded-lg max-h-96 w-full object-cover"
          />
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex space-x-4">
          <Button variant="ghost" size="sm" onClick={onLike}>
            <Heart className="mr-2 h-4 w-4" />
            Like
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsCommentOpen(true)}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Comment
          </Button>
        </div>
      </CardFooter>
      <CommentDialog
        open={isCommentOpen}
        onOpenChange={setIsCommentOpen}
        onComment={onComment}
      />
    </Card>
  );
}