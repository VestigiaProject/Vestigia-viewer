import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type HistoricalFigure = {
  id: string;
  name: string;
  title: string;
  biography: string;
  profile_image: string;
};

export type HistoricalPost = {
  id: string;
  figure_id: string;
  original_date: string;
  content: string;
  media_url?: string;
  source?: string;
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
};

export type UserInteraction = {
  id: string;
  user_id: string;
  post_id: string;
  type: 'comment' | 'like';
  content?: string;
  created_at: string;
  username?: string;
  avatar_url?: string;
};