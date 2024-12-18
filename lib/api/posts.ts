import { supabase } from '../supabase';
import type { HistoricalPostWithFigure } from '../supabase';

export async function fetchPosts(currentDate: Date, page: number = 1, limit: number = 10, language: 'fr' | 'en' = 'fr') {
  const start = (page - 1) * limit;
  
  const contentField = language === 'fr' ? 'content' : 'content_en';
  const sourceField = language === 'fr' ? 'source' : 'source_en';
  
  const { data, error } = await supabase
    .from('historical_posts')
    .select(`
      id,
      figure_id,
      original_date,
      ${contentField} as content,
      media_url,
      ${sourceField} as source,
      is_significant,
      figure:historical_figures!inner(
        id,
        name,
        title,
        biography,
        profile_image
      )
    `)
    .lte('original_date', currentDate.toISOString())
    .order('original_date', { ascending: false })
    .range(start, start + limit - 1);

  if (error) throw error;
  return data as unknown as HistoricalPostWithFigure[];
}

export async function fetchPost(id: string, language: 'fr' | 'en' = 'fr') {
  const contentField = language === 'fr' ? 'content' : 'content_en';
  const sourceField = language === 'fr' ? 'source' : 'source_en';
  
  const { data, error } = await supabase
    .from('historical_posts')
    .select(`
      id,
      figure_id,
      original_date,
      ${contentField} as content,
      media_url,
      ${sourceField} as source,
      is_significant,
      figure:historical_figures!inner(
        id,
        name,
        title,
        biography,
        profile_image
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as HistoricalPostWithFigure;
}

// ... rest of the file remains the same