import { Suspense } from 'react';
import { PostContent } from '@/components/post/PostContent';
import { PostComments } from '@/components/post/PostComments';
import { PostSkeleton } from '@/components/post/PostSkeleton';
import { fetchAllPostIds, fetchPost } from '@/lib/api/posts';

export async function generateStaticParams() {
  const ids = await fetchAllPostIds();
  return ids.map((id) => ({ id }));
}

export default async function PostPage({ params }: { params: { id: string } }) {
  const initialPost = await fetchPost(params.id);

  if (!initialPost) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-2xl mx-auto py-4">
        <Suspense fallback={<PostSkeleton />}>
          <PostContent post={initialPost} />
          <PostComments postId={initialPost.id} />
        </Suspense>
      </main>
    </div>
  );
}