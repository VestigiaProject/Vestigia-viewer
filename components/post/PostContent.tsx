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

export function PostContent({ id }: { id: string }) {
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [sourceContent, setSourceContent] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const { language } = useLanguage();

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
          .from(language === 'en' ? 'source_en' : 'historical_posts')
          .select('source')
          .eq('id', id)
          .single();
          
        if (sourceData) {
          setSourceContent(sourceData.source);
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(true);
      }
    };

    fetchPost();

    // Set up realtime subscription for updates
    const channel = supabase
      .channel('post_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'historical_posts',
          filter: `id=eq.${id}`,
        },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            setError(true);
            return;
          }

          // Fetch the complete updated post with relations
          const { data: updatedPost } = await supabase
            .from('historical_posts')
            .select('*, historical_figures(*)')
            .eq('id', id)
            .single();

          if (updatedPost) {
            setPost(updatedPost);
            setError(false);

            // Also update source content
            const { data: sourceData } = await supabase
              .from(language === 'en' ? 'source_en' : 'historical_posts')
              .select('source')
              .eq('id', id)
              .single();
              
            if (sourceData) {
              setSourceContent(sourceData.source);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, language]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-destructive/10 text-destructive rounded-lg p-4">
          This post is no longer available.
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Post post={post} />
      
      <Accordion type="single" collapsible>
        <AccordionItem value="source">
          <AccordionTrigger>View Source Content</AccordionTrigger>
          <AccordionContent>
            <div className="whitespace-pre-wrap p-4 bg-muted rounded-md">
              {sourceContent}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-8">
        <Comments postId={id} />
      </div>
    </div>
  );
} 