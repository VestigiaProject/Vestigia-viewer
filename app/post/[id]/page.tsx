'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchPost, fetchPostInteractions } from '@/lib/api/posts';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { HistoricalPostWithFigure, UserInteraction } from '@/lib/supabase';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';

export default function PostPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [post, setPost] = useState<HistoricalPostWithFigure | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<UserInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadPost();
    setupRealtimeSubscription();
  }, [id]);

  async function loadPost() {
    try {
      // Try to get post data from sessionStorage first
      const storedData = sessionStorage.getItem('currentPostData');
      if (storedData) {
        const { post: storedPost, likes, isLiked, comments: storedComments } = JSON.parse(storedData);
        setPost(storedPost);
        setLikeCount(likes);
        setLiked(isLiked);
        setComments(storedComments);
        sessionStorage.removeItem('currentPostData');
      }

      // Always fetch fresh data from the server
      const [freshPost, interactions] = await Promise.all([
        fetchPost(id as string),
        fetchPostInteractions(id as string, user?.id)
      ]);

      setPost(freshPost);
      setLikeCount(interactions.likes);
      setLiked(interactions.isLiked || false);
      setComments(interactions.comments);
      setLoading(false);
    } catch (error) {
      console.error('Error loading post:', error);
      toast({
        title: t('error.generic'),
        description: t('error.load_failed'),
        variant: 'destructive',
      });
      setLoading(false);
    }
  }

  function setupRealtimeSubscription() {
    const channel = supabase
      .channel(`post-${id}-interactions`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_interactions',
          filter: `post_id=eq.${id}`,
        },
        async () => {
          const interactions = await fetchPostInteractions(id as string, user?.id);
          setLikeCount(interactions.likes);
          setLiked(interactions.isLiked || false);
          setComments(interactions.comments);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function handleLike() {
    if (!user || loading) return;
    setLoading(true);

    try {
      if (liked) {
        await supabase
          .from('user_interactions')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', id)
          .eq('type', 'like');
      } else {
        await supabase
          .from('user_interactions')
          .insert({
            user_id: user.id,
            post_id: id,
            type: 'like',
          });
      }

      // Optimistic update
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: t('error.generic'),
        description: t('error.like_failed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    setSubmittingComment(true);

    try {
      await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          post_id: id,
          type: 'comment',
          content: commentText.trim(),
        });

      setCommentText('');
      toast({
        title: t('success.comment_added'),
        description: t('success.comment_added_desc'),
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: t('error.generic'),
        description: t('error.comment_failed'),
        variant: 'destructive',
      });
    } finally {
      setSubmittingComment(false);
    }
  }

  if (loading || !post) {
    return (
      <div className="container max-w-2xl mx-auto py-4 space-y-4">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const content = language === 'en' && post.content_en ? post.content_en : post.content;
  const source = language === 'en' && post.source_en ? post.source_en : post.source;
  const title = language === 'en' && post.figure.title_en ? post.figure.title_en : post.figure.title;

  return (
    <div className="container max-w-2xl mx-auto py-4 space-y-4">
      <div className="bg-white/95 shadow-sm rounded-lg p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('app.back')}
        </Button>

        <Card className="p-4 bg-white">
          <div className="flex space-x-4">
            <Link href={`/profile/${post.figure.id}`}>
              <Avatar>
                <AvatarImage src={post.figure.profile_image} />
                <AvatarFallback>{post.figure.name[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/profile/${post.figure.id}`}
                      className="font-semibold hover:underline"
                    >
                      {post.figure.name}
                    </Link>
                    {post.figure.checkmark && (
                      <Check className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {title}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground shrink-0 ml-4">
                  {format(new Date(post.original_date), language === 'fr' ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: language === 'fr' ? fr : undefined })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{content}</p>
              {post.media_url && (
                <img
                  src={post.media_url}
                  alt="Post media"
                  className="rounded-lg max-h-96 object-cover mt-2"
                />
              )}
              {source && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="source">
                    <AccordionTrigger className="text-sm">
                      {t('post.view_source')}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {source}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
              <div className="flex items-center space-x-4 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`space-x-1 ${liked ? 'text-red-500' : ''}`}
                  onClick={handleLike}
                  disabled={loading}
                >
                  <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                  <span>{likeCount}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="space-x-1"
                  onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{t('post.comments')} ({comments.length})</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div id="comments" className="bg-white/95 shadow-sm rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold">{t('post.comments')}</h2>
        
        {user ? (
          <form onSubmit={handleComment} className="space-y-2">
            <Textarea
              placeholder={t('post.write_comment')}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full"
            />
            <Button
              type="submit"
              disabled={!commentText.trim() || submittingComment}
            >
              {t('post.post_comment')}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('post.login_to_comment')}
          </p>
        )}

        <div className="space-y-4 mt-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <Avatar>
                <AvatarImage src={comment.avatar_url} />
                <AvatarFallback>{comment.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="font-medium text-sm">{comment.username}</p>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(comment.created_at), language === 'fr' ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: language === 'fr' ? fr : undefined })}
                </p>
              </div>
            </div>
          ))}
          
          {comments.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              {t('post.no_comments')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 