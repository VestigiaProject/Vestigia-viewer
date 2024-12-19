import { Suspense } from 'react';
import { PostSkeleton } from '@/components/post/PostSkeleton';
import { fetchPost, fetchAllPostIds } from '@/lib/api/posts';
import { DynamicPost } from './components/DynamicPost';

// Add generateStaticParams back for static export
export async function generateStaticParams() {
  const ids = await fetchAllPostIds();
  return ids.map((id) => ({ id }));
}

// Use ISR with a short revalidation period
export const revalidate = 60; // Revalidate every minute

export default async function PostPage({ params }: { params: { id: string } }) {
  // Get initial post data
  const initialPost = await fetchPost(params.id);

  if (!initialPost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="container max-w-2xl mx-auto py-4">
        <div className="bg-white/95 shadow-sm rounded-lg">
          <Suspense fallback={<PostSkeleton />}>
            <DynamicPost postId={params.id} initialPost={initialPost} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}