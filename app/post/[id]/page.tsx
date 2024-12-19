import { Suspense } from 'react';
import { PostSkeleton } from '@/components/post/PostSkeleton';
import { fetchPost, fetchAllPostIds } from '@/lib/api/posts';
import { DynamicPost } from './components/DynamicPost';
import { notFound } from 'next/navigation';

// Generate static pages for all posts at build time
export async function generateStaticParams() {
  try {
    const ids = await fetchAllPostIds();
    return ids.map((id) => ({ id }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Enable static generation with fallback
export const dynamicParams = true; // true -> fallback to SSR
export const dynamic = 'auto'; // auto -> allow both static and dynamic
export const revalidate = 0; // revalidate on every request

export default async function PostPage({ params }: { params: { id: string } }) {
  try {
    // Get initial post data
    const initialPost = await fetchPost(params.id);

    if (!initialPost) {
      notFound();
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
  } catch (error) {
    console.error('Error loading post:', error);
    notFound();
  }
}