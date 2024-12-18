import { supabase } from '../supabase';
import type { HistoricalPostWithFigure, UserInteraction } from '../supabase';

export async function fetchPosts(currentDate: Date, page: number = 1, limit: number = 10) {
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
    .lte('original_date', currentDate.toISOString())
    .order('original_date', { ascending: false })
    .range(start, start + limit - 1);

  if (error) throw error;
  return data as unknown as HistoricalPostWithFigure[];
}

export async function fetchPost(id: string) {
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
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as HistoricalPostWithFigure;
}

export async function fetchAllPostIds() {
  const { data, error } = await supabase
    .from('historical_posts')
    .select('id');

  if (error) throw error;
  return data.map(post => post.id);
}

interface RawComment {
  id: string;
  user_id: string;
  post_id: string;
  type: string;
  content: string | null;
  created_at: string;
  user: {
    username: string;
    avatar_url: string | null;
  };
}

interface RawCommentResponse {
  id: string;
  user_id: string;
  post_id: string;
  type: string;
  content: string | null;
  created_at: string;
  user: {
    username: string;
    avatar_url: string | null;
  }[];
}

interface PostInteractions {
  likes: number;
  comments: UserInteraction[];
  isLiked?: boolean;
}

export async function fetchPostInteractions(postId: string, userId?: string): Promise<PostInteractions> {
  // Get likes count
  const { data: likes, error: likesError } = await supabase
    .from('user_interactions')
    .select('id')
    .eq('post_id', postId)
    .eq('type', 'like');

  if (likesError) throw likesError;

  // Check if current user has liked the post
  let isLiked = false;
  if (userId) {
    const { data: likeData } = await supabase
      .from('user_interactions')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .eq('type', 'like')
      .single();
    
    isLiked = !!likeData;
  }

  // Get comments with user info
  const { data: comments, error: commentsError } = await supabase
    .from('user_interactions')
    .select(`
      id,
      user_id,
      post_id,
      type,
      content,
      created_at,
      user:user_profiles!inner(
        username,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .eq('type', 'comment')
    .order('created_at', { ascending: true });

  if (commentsError) throw commentsError;

  const mappedComments = (comments || []).map(comment => ({
    id: comment.id,
    user_id: comment.user_id,
    post_id: comment.post_id,
    type: 'comment' as const,
    content: comment.content || '',
    created_at: comment.created_at,
    username: comment.user?.[0]?.username || 'Deleted User',
    avatar_url: comment.user?.[0]?.avatar_url || undefined
  }));

  return {
    likes: likes?.length || 0,
    comments: mappedComments,
    isLiked
  };
}