import { supabase } from '../supabase';
import type { HistoricalPostWithFigure } from '../supabase';

export async function fetchPosts(currentDate: Date, page: number = 1, limit: number = 10) {
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
      figure:historical_figures(*)
    `)
    .lte('original_date', currentDate.toISOString())
    .order('original_date', { ascending: false })
    .range(start, start + limit - 1);

  if (error) throw error;
  return data as HistoricalPostWithFigure[];
}

export async function fetchPost(id: string) {
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
      figure:historical_figures(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as HistoricalPostWithFigure;
}

export async function fetchAllPostIds() {
  const { data, error } = await supabase
    .from('historical_posts')
    .select('id');

  if (error) throw error;
  return data.map(post => post.id);
}

export async function fetchPostInteractions(postId: string) {
  const { data: likes, error: likesError } = await supabase
    .from('user_interactions')
    .select('id')
    .eq('post_id', postId)
    .eq('type', 'like');

  const { data: comments, error: commentsError } = await supabase
    .from('user_interactions')
    .select(`
      *,
      user:user_profiles!user_interactions_user_id_fkey(
        username,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .eq('type', 'comment')
    .order('created_at', { ascending: true });

  if (likesError || commentsError) throw likesError || commentsError;
  
  return {
    likes: likes?.length || 0,
    comments: comments?.map(comment => ({
      ...comment,
      username: comment.user?.username,
      avatar_url: comment.user?.avatar_url
    })) || [],
  };
}