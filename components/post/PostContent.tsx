'use client';

import { useLanguage } from '@/lib/hooks/useLanguage';
import { useLanguage } from '@/lib/contexts/language';

export function PostContent({ post: initialPost }: PostContentProps) {
  // ... previous state declarations remain the same
  const { language } = useLanguage();

  // Function to load fresh post data
  const loadFreshPost = async () => {
    try {
      const freshPost = await fetchPost(initialPost.id, language);
      if (freshPost) {
        setPost(freshPost);
      }
    } catch (error) {
      console.error('Error loading post:', error);
    }
  };

  // Update post when language changes
  useEffect(() => {
    loadFreshPost();
  }, [language]);

  // ... rest of the component remains the same
}