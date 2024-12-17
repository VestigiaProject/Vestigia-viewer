import { supabase } from '../supabase';
import type { HistoricalPost } from '../supabase';

export async function fetchPosts(currentDate: Date, page: number = 0, limit: number = 10) {
  const { data, error } = await supabase
    .from('historical_posts')
    .select(`
      *,
      figure:historical_figures(*)
    `)
    .lte('original_date', currentDate.toISOString())
    .order('original_date', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (error) throw error;
  return data as (HistoricalPost & { figure: HistoricalFigure })[];
}

export async function likePost(userId: string, postId: string) {
  const { error } = await supabase
    .from('user_interactions')
    .insert({
      user_id: userId,
      post_id: postId,
      type: 'like'
    });

  if (error) throw error;
}

export async function commentOnPost(userId: string, postId: string, content: string) {
  const { error } = await supabase
    .from('user_interactions')
    .insert({
      user_id: userId,
      post_id: postId,
      type: 'comment',
      content
    });

  if (error) throw error;
}