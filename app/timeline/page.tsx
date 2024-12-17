'use client';

import { TimelineHeader } from '@/components/timeline/TimelineHeader';
import { HistoricalPost } from '@/components/timeline/HistoricalPost';
import { CommentDialog } from '@/components/timeline/CommentDialog';
import { useTimeProgress } from '@/lib/hooks/useTimeProgress';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchPosts } from '@/lib/api/posts';
import { fetchPostComments, addComment } from '@/lib/api/interactions';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import type { HistoricalPostWithFigure, UserInteraction } from '@/lib/supabase';

const START_DATE = '1789-06-01';

export default function TimelinePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentDate, daysElapsed } = useTimeProgress(START_DATE);
  const [posts, setPosts] = useState<HistoricalPostWithFigure[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<HistoricalPostWithFigure | null>(null);
  const [comments, setComments] = useState<UserInteraction[]>([]);

  useEffect(() => {
    loadPosts();
    loadUserLikes();
  }, []);

  async function loadPosts() {
    try {
      const newPosts = await fetchPosts(currentDate, page);
      setPosts(prev => [...prev, ...newPosts]);
      setHasMore(newPosts.length === 10);
      setLoading(false);
    } catch (error) {
      console.error('Error loading posts:', error);
      setLoading(false);
    }
  }

  async function loadUserLikes() {
    if (!user) return;
    const { data } = await supabase
      .from('user_interactions')
      .select('post_id')
      .eq('user_id', user.id)
      .eq('type', 'like');
    
    if (data) {
      setUserLikes(new Set(data.map(like => like.post_id)));
    }
  }

  async function handleLike(postId: string) {
    if (!user) return;

    const isLiked = userLikes.has(postId);
    if (isLiked) {
      await supabase
        .from('user_interactions')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .eq('type', 'like');
      
      setUserLikes(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    } else {
      await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          post_id: postId,
          type: 'like',
        });
      
      setUserLikes(prev => new Set([...prev, postId]));
    }
  }

  async function handleComment(postId: string) {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      const comments = await fetchPostComments(postId);
      setComments(comments);
      setSelectedPost(post);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleAddComment(content: string) {
    if (!user || !selectedPost) return;

    try {
      await addComment(user.id, selectedPost.id, content);
      const updatedComments = await fetchPostComments(selectedPost.id);
      setComments(updatedComments);
      toast({
        title: 'Success',
        description: 'Comment added successfully!',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TimelineHeader currentDate={currentDate} daysElapsed={daysElapsed} />
      <main className="container max-w-2xl mx-auto py-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : (
          <InfiniteScroll
            dataLength={posts.length}
            next={() => {
              setPage(prev => prev + 1);
              loadPosts();
            }}
            hasMore={hasMore}
            loader={<Skeleton className="h-48 w-full my-4" />}
            endMessage={
              <p className="text-center text-muted-foreground py-4">
                No more historical posts to load
              </p>
            }
          >
            <div className="space-y-4">
              {posts.map(post => (
                <HistoricalPost
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  likes={0}
                  isLiked={userLikes.has(post.id)}
                />
              ))}
            </div>
          </InfiniteScroll>
        )}
      </main>
      {selectedPost && (
        <CommentDialog
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          onComment={handleAddComment}
          comments={comments}
        />
      )}
    </div>
  );
}