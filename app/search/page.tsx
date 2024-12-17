'use client';

import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useTimeProgress } from '@/lib/hooks/useTimeProgress';
import { useState } from 'react';
import { PostCard } from '@/components/posts/PostCard';
import { commentOnPost, likePost } from '@/lib/api/posts';
import { useAuth } from '@/lib/hooks/useAuth';
import { PostWithFigure } from '@/lib/types';

const START_DATE = '1789-06-01T00:00:00Z';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PostWithFigure[]>([]);
  const currentDate = useTimeProgress(START_DATE);
  const { user } = useAuth();

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('historical_posts')
      .select(`
        *,
        figure:historical_figures(*)
      `)
      .or(`content.ilike.%${searchQuery}%,figure.name.ilike.%${searchQuery}%`)
      .lte('original_date', currentDate.toISOString())
      .order('original_date', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error searching:', error);
      return;
    }

    setResults(data as PostWithFigure[]);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    await likePost(user.id, postId);
  };

  const handleComment = async (postId: string, content: string) => {
    if (!user) return;
    await commentOnPost(user.id, postId, content);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <div className="max-w-2xl mx-auto">
          <Input
            type="search"
            placeholder="Search historical posts..."
            className="mb-6"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              handleSearch(e.target.value);
            }}
          />
          {results.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLike={() => handleLike(post.id)}
              onComment={(content) => handleComment(post.id, content)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}