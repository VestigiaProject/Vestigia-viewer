export type Language = 'fr' | 'en';

export interface LocalizedContent {
  content: string;
  content_en?: string | null;
  source?: string | null;
  source_en?: string | null;
}