'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface PostProps {
  post: {
    id: string;
    content: string;
    created_at: string;
    historical_figures: {
      id: string;
      name: string;
      avatar_url?: string;
    };
  };
}

export function Post({ post }: PostProps) {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-start space-x-4">
        <Link href={`/profile/${post.historical_figures.id}`}>
          <div className="relative h-12 w-12">
            <Image
              src={post.historical_figures.avatar_url || '/default-avatar.png'}
              alt={post.historical_figures.name}
              className="rounded-full object-cover"
              fill
              sizes="(max-width: 48px) 100vw"
            />
          </div>
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <Link 
              href={`/profile/${post.historical_figures.id}`}
              className="font-semibold hover:underline"
            >
              {post.historical_figures.name}
            </Link>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="mt-2 text-base whitespace-pre-wrap">{post.content}</p>
        </div>
      </div>
    </div>
  );
} 