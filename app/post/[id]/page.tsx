import { Suspense } from 'react';
import { PostContent } from '@/components/post/PostContent';
import { PostComments } from '@/components/post/PostComments';
import { PostSkeleton } from '@/components/post/PostSkeleton';
import { fetchPost } from '@/lib/api/posts';

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await fetchPost(params.id);

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-2xl mx-auto">
        <div className="bg-white/95 shadow-sm rounded-lg my-4">
          <Suspense fallback={<PostSkeleton />}>
            <PostContent post={post} />
            <div id="comments">
              <PostComments postId={post.id} />
            </div>
          </Suspense>
        </div>
      </main>
    </div>
  );
} 