import type { HistoricalPost } from '../supabase';

export function getLocalizedContent(post: HistoricalPost, language: 'fr' | 'en'): string {
  return language === 'en' && post.content_en ? post.content_en : post.content;
}

export function getLocalizedSource(post: HistoricalPost, language: 'fr' | 'en'): string | null {
  if (!post.source && !post.source_en) return null;
  return language === 'en' && post.source_en ? post.source_en : post.source;
}

export function transformPostContent<T extends HistoricalPost>(post: T, language: 'fr' | 'en'): T {
  return {
    ...post,
    content: getLocalizedContent(post, language),
    source: getLocalizedSource(post, language),
  };
}