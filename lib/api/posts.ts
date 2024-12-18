import { supabase } from '../supabase';
import type { HistoricalPostWithFigure } from '../supabase';

export async function fetchPosts(currentDate: Date, page: number = 1, limit: number = 10, language: 'fr' | 'en' = 'fr') {
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
    .lte('original_date', currentDate.toISOString())
    .order('original_date', { ascending: false })
    .range(start, start + limit - 1);

  if (error) throw error;

  // Transform the data to use the correct language content
  const transformedData = data.map(post => ({
    ...post,
    content: language === 'en' && post.content_en ? post.content_en : post.content,
    source: language === 'en' && post.source_en ? post.source_en : post.source,
  }));

  return transformedData as unknown as HistoricalPostWithFigure[];
}

export async function fetchPost(id: string, language: 'fr' | 'en' = 'fr') {
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
    .eq('id', id)
    .single();

  if (error) throw error;

  // Transform the data to use the correct language content
  const transformedData = {
    ...data,
    content: language === 'en' && data.content_en ? data.content_en : data.content,
    source: language === 'en' && data.source_en ? data.source_en : data.source,
  };

  return transformedData as unknown as HistoricalPostWithFigure;
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