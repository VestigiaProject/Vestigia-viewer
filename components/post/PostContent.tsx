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

export function PostContent({ id }: { id: string }) {
  const [post, setPost] = useState<any>(null);
  const [sourceContent, setSourceContent] = useState<string>('');
  const { language } = useLanguage();

  useEffect(() => {
    const fetchPost = async () => {
      const { data: postData } = await supabase
        .from('historical_posts')
        .select('*, historical_figures(*)')
        .eq('id', id)
        .single();

      if (postData) {
        setPost(postData);
        
        // Fetch source content based on language
        const { data: sourceData } = await supabase
          .from(language === 'en' ? 'source_en' : 'historical_posts')
          .select('source')
          .eq('id', id)
          .single();
          
        if (sourceData) {
          setSourceContent(sourceData.source);
        }
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
        (payload) => {
          setPost(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, language]);

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