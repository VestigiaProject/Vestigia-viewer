import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

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
  is_significant: boolean;
  figure?: HistoricalFigure;
};

export type UserProfile = {
  id: string;
  username: string;
  start_date: string;
};

export type UserInteraction = {
  id: string;
  user_id: string;
  post_id: string;
  type: 'comment' | 'like';
  content?: string;
  created_at: string;
};