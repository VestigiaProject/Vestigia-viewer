import { supabase } from '../supabase';
import type { HistoricalPost } from '../supabase';

export async function fetchPosts(currentDate: Date, page: number = 1, limit: number = 10) {
  const start = (page - 1) * limit;
  
  const { data, error } = await supabase
    .from('historical_posts')
    .select(`
      *,
      figure:historical_figures(*)
    `)
    .lte('original_date', currentDate.toISOString())
    .order('original_date', { ascending: false })
    .range(start, start + limit - 1);

  if (error) throw error;
  return data as (HistoricalPost & { figure: HistoricalFigure })[];
}

export async function fetchPostInteractions(postId: string) {
  const { data: likes, error: likesError } = await supabase
    .from('user_interactions')
    .select('user_id')
    .eq('post_id', postId)
    .eq('type', 'like');

  const { data: comments, error: commentsError } = await supabase
    .from('user_interactions')
    .select('*')
    .eq('post_id', postId)
    .eq('type', 'comment')
    .order('created_at', { ascending: true });

  if (likesError || commentsError) throw likesError || commentsError;
  
  return {
    likes: likes?.length || 0,
    comments: comments || [],
  };
}