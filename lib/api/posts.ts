import { supabase } from '../supabase';
import type { HistoricalPostWithFigure } from '../supabase';

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
  return data as HistoricalPostWithFigure[];
}

export async function fetchPost(id: string) {
  const { data, error } = await supabase
    .from('historical_posts')
    .select(`
      *,
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
  try {
    const [likesResponse, commentsResponse] = await Promise.all([
      supabase
        .from('user_interactions')
        .select('id')
        .eq('post_id', postId)
        .eq('type', 'like'),
      supabase
        .from('user_interactions')
        .select(`
          id,
          user_id,
          post_id,
          type,
          content,
          created_at,
          user:user_profiles!user_interactions_user_id_fkey(
            username,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .eq('type', 'comment')
        .order('created_at', { ascending: true })
    ]);

    if (likesResponse.error) throw likesResponse.error;
    if (commentsResponse.error) throw commentsResponse.error;

    return {
      likes: likesResponse.data?.length || 0,
      comments: (commentsResponse.data || []).map(comment => ({
        ...comment,
        username: comment.user?.username,
        avatar_url: comment.user?.avatar_url
      }))
    };
  } catch (error) {
    console.error('Error fetching post interactions:', error);
    return { likes: 0, comments: [] };
  }
}

export async function updatePostSource(postId: string, source: string) {
  const { error } = await supabase
    .from('historical_posts')
    .update({ source })
    .eq('id', postId);

  if (error) throw error;
}