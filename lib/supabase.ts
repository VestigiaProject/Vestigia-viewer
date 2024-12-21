import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type HistoricalFigure = {
  id: string;
  name: string;
  title: string;
  title_en?: string;
  biography: string;
  biography_en?: string;
  profile_image: string;
  checkmark: boolean;
};

export type HistoricalPost = {
  id: string;
  figure_id: string;
  original_date: string;
  content: string;
  content_en?: string;
  media_url?: string;
  source?: string;
  source_en?: string;
  is_significant: boolean;
};

export type HistoricalPostWithFigure = HistoricalPost & {
  figure: HistoricalFigure;
};

export type UserProfile = {
  id: string;
  username: string;
  avatar_url?: string;
  start_date: string;
  created_at: string;
  language?: 'fr' | 'en';
};

export type UserInteraction = {
  id: string;
  user_id: string;
  post_id: string | null;
  parent_id: string | null;
  type: 'like' | 'comment' | 'comment_like' | 'reply';
  content: string | null;
  created_at: string;
  username?: string;
  avatar_url?: string;
};