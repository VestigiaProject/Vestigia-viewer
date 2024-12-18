'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Heart, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { HistoricalPostWithFigure } from '@/lib/supabase';
import { fetchPostInteractions } from '@/lib/api/posts';
import { PostSource } from './PostSource';
import { usePostSubscription } from '@/lib/hooks/usePostSubscription';

type PostContentProps = {
  post: HistoricalPostWithFigure;
};

export function PostContent({ post: initialPost }: PostContentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const post = usePostSubscription(initialPost);

  useEffect(() => {
    async function loadInteractions() {
      try {
        const { likes } = await fetchPostInteractions(post.id);
        setLikes(likes);

        if (user) {
          const { data } = await supabase
            .from('user_interactions')
            .select('id')
            .eq('user_id', user.id)
            .eq('post_id', post.id)
            .eq('type', 'like')
            .single();

          setIsLiked(!!data);
        }
      } catch (error) {
        console.error('Error loading interactions:', error);
      }
    }

    loadInteractions();
  }, [post.id, user]);

  // ... rest of the component remains the same