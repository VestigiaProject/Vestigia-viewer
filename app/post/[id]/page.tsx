import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { PostContent } from '@/components/post/PostContent';
import { PostSkeleton } from '@/components/post/PostSkeleton';

export async function generateStaticParams() {
  const { data: posts } = await supabase
    .from('historical_posts')
    .select('id');

  return (posts || []).map((post) => ({
    id: post.id,
  }));
}

export default function PostPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostContent id={params.id} />
    </Suspense>
  );
} 