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
      *,
      figure:historical_figures(*)
    `)
    .eq('figure_id', figureId)
    .lte('original_date', currentDate.toISOString())
    .order('original_date', { ascending: false })
    .range(start, start + limit - 1);

  if (error) throw error;
  return data as HistoricalPostWithFigure[];
}