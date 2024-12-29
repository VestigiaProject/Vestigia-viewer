import { supabase } from '../supabase';
import type { HistoricalFigure, HistoricalPostWithFigure } from '../supabase';
import { handleError } from '@/lib/utils/error-handler';

export async function fetchFigureProfile(figureId: string): Promise<HistoricalFigure | null> {
  try {
    const { data, error } = await supabase
      .from('historical_figures')
      .select('*')
      .eq('id', figureId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, {
      userMessage: 'Failed to fetch figure profile',
      context: { figureId }
    });
    return null;
  }
}

export async function fetchFigurePostCount(
  figureId: string,
  currentDate: Date
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('historical_posts')
      .select('*', { count: 'exact', head: true })
      .eq('figure_id', figureId)
      .lte('original_date', currentDate.toISOString());

    if (error) throw error;
    return count || 0;
  } catch (error) {
    handleError(error, {
      userMessage: 'Failed to fetch figure post count',
      context: { 
        figureId,
        currentDate: currentDate.toISOString()
      }
    });
    return 0;
  }
}

export async function fetchFigurePosts(
  figureId: string,
  currentDate: Date,
  page: number = 1,
  limit: number = 10
): Promise<HistoricalPostWithFigure[]> {
  try {
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
          title_en,
          biography,
          biography_en,
          profile_image,
          checkmark
        )
      `)
      .eq('figure_id', figureId)
      .lte('original_date', currentDate.toISOString())
      .order('original_date', { ascending: false })
      .range(start, start + limit - 1);

    if (error) throw error;
    return data as unknown as HistoricalPostWithFigure[];
  } catch (error) {
    handleError(error, {
      userMessage: 'Failed to fetch figure posts',
      context: { 
        figureId,
        currentDate: currentDate.toISOString(),
        page,
        limit
      }
    });
    return [];
  }
}