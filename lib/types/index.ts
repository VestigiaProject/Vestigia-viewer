import type { HistoricalFigure, HistoricalPost, UserProfile, UserInteraction } from '../supabase';

export type {
  HistoricalFigure,
  HistoricalPost,
  UserProfile,
  UserInteraction
};

export type PostWithFigure = HistoricalPost & {
  figure: HistoricalFigure;
};