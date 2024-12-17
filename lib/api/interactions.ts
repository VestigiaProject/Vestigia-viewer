import { supabase } from '../supabase';
import type { UserInteraction } from '../supabase';

export async function fetchPostComments(postId: string): Promise<UserInteraction[]> {
  const { data, error } = await supabase
    .from('user_interactions')
    .select('*')
    .eq('post_id', postId)
    .eq('type', 'comment')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addComment(userId: string, postId: string, content: string) {
  const { error } = await supabase
    .from('user_interactions')
    .insert({
      user_id: userId,
      post_id: postId,
      type: 'comment',
      content,
    });

  if (error) throw error;
}