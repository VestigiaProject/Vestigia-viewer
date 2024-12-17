import type { Database } from './database';

export type Tables = Database['public']['Tables'];
export type HistoricalFigure = Tables['historical_figures']['Row'];
export type HistoricalPost = Tables['historical_posts']['Row'];
export type UserProfile = Tables['user_profiles']['Row'];
export type UserInteraction = Tables['user_interactions']['Row'];

export type PostWithFigure = HistoricalPost & {
  figure: HistoricalFigure;
};

export type { Database };