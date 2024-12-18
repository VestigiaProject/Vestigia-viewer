import { createClient } from '@supabase/supabase-js';
import type { LocalizedContent } from './types/language';

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
  content_en: string | null;
  media_url?: string;
  source?: string | null;
  source_en?: string | null;
  is_significant: boolean;
} & LocalizedContent;

export type HistoricalPostWithFigure = HistoricalPost & {
  figure: HistoricalFigure;
};

// ... rest of the types remain the same