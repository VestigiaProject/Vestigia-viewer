import { supabase } from '../supabase';
import type { PostWithFigure } from '../types';

export async function searchPosts(query: string, currentDate: Date) {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('historical_posts')
    .select(`
      *,
      figure:historical_figures(*)
    `)
    .or(`content.ilike.%${query}%,figure.name.ilike.%${query}%`)
    .lte('original_date', currentDate.toISOString())
    .order('original_date', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data as PostWithFigure[];
}