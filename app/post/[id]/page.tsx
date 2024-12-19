import { Suspense } from 'react';
import { PostSkeleton } from '@/components/post/PostSkeleton';
import { fetchPost, fetchAllPostIds } from '@/lib/api/posts';
import { DynamicPost } from './components/DynamicPost';

// Generate static pages for all posts at build time
export async function generateStaticParams() {
  const ids = await fetchAllPostIds();
  return ids.map((id) => ({ id }));
}

// Enable static generation with dynamic data
export const dynamic = 'force-static';
export const dynamicParams = true;
export const revalidate = 0; // Revalidate on every request

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