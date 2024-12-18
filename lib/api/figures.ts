import { supabase } from '../supabase';
import type { HistoricalFigure, HistoricalPostWithFigure } from '../supabase';

export async function fetchFigureProfile(figureId: string): Promise<HistoricalFigure | null> {
  const { data, error } = await supabase
    .from('historical_figures')
    .select('*')
    .eq('id', figureId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchFigurePostCount(
  figureId: string,
  currentDate: Date
): Promise<number> {
  const { count, error } = await supabase
    .from('historical_posts')
    .select('*', { count: 'exact', head: true })
    .eq('figure_id', figureId)
    .lte('original_date', currentDate.toISOString());

  if (error) throw error;
  return count || 0;
}

export async function fetchFigurePosts(
  figureId: string,
  currentDate: Date,
  page: number = 1,
  limit: number = 10
): Promise<HistoricalPostWithFigure[]> {
  const start = (page - 1) * limit;

  const { data, error } = await supabase
    .from('historical_posts')
    .select(`
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
    `)
    .eq('figure_id', figureId)
    .lte('original_date', currentDate.toISOString())
    .order('original_date', { ascending: false })
    .range(start, start + limit - 1);

  if (error) throw error;
  return data as unknown as HistoricalPostWithFigure[];
}