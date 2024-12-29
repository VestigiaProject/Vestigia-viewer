'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/hooks/useLanguage';
import { Post } from '@/components/Post';
import { Comments } from '@/components/Comments';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { Markdown } from '@/components/ui/markdown';
import { handleError } from '@/lib/utils/error-handler';
import { usePostInteractions } from '@/lib/hooks/usePostInteractions';

interface HistoricalPost {
  id: string;
  content: string;
  content_en?: string;
  source: string;
  source_en?: string;
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
}

export function PostContent({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [post, setPost] = useState<HistoricalPost | null>(null);
  const [sourceContent, setSourceContent] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const { language } = useLanguage();
  const { isLiked, likes, comments, likePost, unlikePost, addComment, deleteComment, toggleCommentLike } = usePostInteractions(id);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data: postData, error: postError } = await supabase
          .from('historical_posts')
          .select('*, historical_figures(*)')
          .eq('id', id)
          .single();

        if (postError) throw postError;
        if (!postData) throw new Error('Post not found');

        setPost(postData);
        setError(false);
        
        // Fetch source content based on language
        const { data: sourceData } = await supabase
          .from('historical_posts')
          .select('source, source_en')
          .eq('id', id)
          .single();
          
        if (sourceData) {
          setSourceContent(language === 'en' && sourceData.source_en ? sourceData.source_en : sourceData.source);
        }
      } catch (err) {
        handleError(err, {
          userMessage: t('error.post_not_found'),
          context: { postId: id }
        });
        setError(true);
      }
    }

    fetchPost();
  }, [id, language, t]);

  const handleLike = () => {
    if (!user) return;
    if (isLiked) {
      unlikePost();
    } else {
      likePost();
    }
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-destructive/10 text-destructive rounded-lg p-4">
          {t('error.post_not_available')}
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Post 
        post={post}
        likes={likes}
        isLiked={isLiked}
        commentsCount={comments.length}
        onLike={handleLike}
      />
      
      <div className="bg-card border rounded-lg">
        <Accordion type="single" collapsible>
          <AccordionItem value="source" className="border-none">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent">
              {t('post.source')}
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-4 text-sm">
                <Markdown content={sourceContent} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="mt-8">
        <Comments 
          postId={id} 
          comments={comments} 
          onComment={addComment}
          onDeleteComment={deleteComment}
          onToggleCommentLike={toggleCommentLike}
        />
      </div>
    </div>
  );
} 