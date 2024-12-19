'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Check } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { fr } from 'date-fns/locale';

interface PostProps {
  post: {
    id: string;
    content: string;
    content_en?: string;
    created_at: string;
    original_date: string;
    media_url?: string;
    historical_figures: {
      id: string;
      name: string;
      profile_image?: string;
      title?: string;
      title_en?: string;
      checkmark?: boolean;
    };
  };
}

export function Post({ post }: PostProps) {
  const { language } = useLanguage();
  const content = language === 'en' && post.content_en ? post.content_en : post.content;
  const title = language === 'en' && post.historical_figures.title_en 
    ? post.historical_figures.title_en 
    : post.historical_figures.title;

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-start space-x-4">
        <Link href={`/profile/${post.historical_figures.id}`}>
          <Avatar className="h-12 w-12">
            <AvatarImage src={post.historical_figures.profile_image} />
            <AvatarFallback>{post.historical_figures.name[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Link
                  href={`/profile/${post.historical_figures.id}`}
                  className="font-semibold hover:underline"
                >
                  {post.historical_figures.name}
                </Link>
                {post.historical_figures.checkmark && (
                  <Check className="h-4 w-4 text-blue-500" />
                )}
              </div>
              {title && (
                <p className="text-sm text-muted-foreground">
                  {title}
                </p>
              )}
            </div>
            <span className="text-sm text-muted-foreground shrink-0 ml-4">
              {formatDistanceToNow(new Date(post.created_at), { 
                addSuffix: true,
                locale: language === 'fr' ? fr : undefined 
              })}
            </span>
          </div>
          <p className="mt-2 text-base whitespace-pre-wrap">{content}</p>
          {post.media_url && (
            <img
              src={post.media_url}
              alt="Post media"
              className="rounded-lg max-h-96 object-cover mt-2"
            />
          )}
        </div>
      </div>
    </div>
  );
} 