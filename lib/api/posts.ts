import { supabase } from '../supabase';
import { transformPostContent } from '../utils/content';
import { useLanguage } from '../hooks/useLanguage';
import type { HistoricalPostWithFigure } from '../supabase';

const POST_FIELDS = `
  id,
  figure_id,
  original_date,
  content,
  content_en,
  media_url,
  source,
  source_en,
  is_significant,
  figure:historical_figures!inner(
    id,
    name,
    title,
    biography,
    profile_image
  )
`;

export async function fetchPosts(currentDate: Date, page: number = 1, limit: number = 10) {
  const { language } = useLanguage.getState();
  const start = (page - 1) * limit;
  
  const { data, error } = await supabase
    .from('historical_posts')
    .select(POST_FIELDS)
    .lte('original_date', currentDate.toISOString())
    .order('original_date', { ascending: false })
    .range(start, start + limit - 1);

  if (error) throw error;

  return data?.map(post => 
    transformPostContent(post, language)
  ) as HistoricalPostWithFigure[];
}

export async function fetchPost(id: string) {
  const { language } = useLanguage.getState();

  const { data, error } = await supabase
    .from('historical_posts')
    .select(POST_FIELDS)
    .eq('id', id)
    .single();

  if (error) throw error;

  return transformPostContent(data, language) as HistoricalPostWithFigure;
}