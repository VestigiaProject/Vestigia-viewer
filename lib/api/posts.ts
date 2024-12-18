import { supabase } from '../supabase';
import type { HistoricalPostWithFigure } from '../supabase';

export async function fetchPosts(currentDate: Date, page: number = 1, limit: number = 10, language: string = 'fr') {
  const start = (page - 1) * limit;
  
  const { data, error } = await supabase
    .from('historical_posts')
    .select(`
      id,
      figure_id,
      original_date,
      content,
      media_url,
      source,
      is_significant,
      translations:post_translations!inner(
        content,
        source
      ),
      figure:historical_figures!inner(
        id,
        name,
        title,
        biography,
        profile_image
      )
    `)
    .eq('post_translations.language', language)
    .lte('original_date', currentDate.toISOString())
    .order('original_date', { ascending: false })
    .range(start, start + limit - 1);

  if (error) throw error;

  // Transform the data to use translations if available
  const transformedData = data.map(post => ({
    ...post,
    content: post.translations?.[0]?.content || post.content,
    source: post.translations?.[0]?.source || post.source,
  }));

  return transformedData as unknown as HistoricalPostWithFigure[];
}

export async function fetchPost(id: string, language: string = 'fr') {
  const { data, error } = await supabase
    .from('historical_posts')
    .select(`
      id,
      figure_id,
      original_date,
      content,
      media_url,
      source,
      is_significant,
      translations:post_translations!inner(
        content,
        source
      ),
      figure:historical_figures!inner(
        id,
        name,
        title,
        biography,
        profile_image
      )
    `)
    .eq('post_translations.language', language)
    .eq('id', id)
    .single();

  if (error) throw error;

  // Transform the data to use translations if available
  const transformedData = {
    ...data,
    content: data.translations?.[0]?.content || data.content,
    source: data.translations?.[0]?.source || data.source,
  };

  return transformedData as unknown as HistoricalPostWithFigure;
}