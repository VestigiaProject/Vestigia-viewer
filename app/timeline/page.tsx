'use client';

// ... previous imports remain the same
import { useLanguage } from '@/lib/hooks/useLanguage';

export default function TimelinePage() {
  // ... previous state declarations remain the same
  const { language } = useLanguage();

  async function loadPosts() {
    try {
      const newPosts = await fetchPosts(currentDate, page, 10, language);
      // ... rest of the function remains the same
    } catch (error) {
      console.error('Error loading posts:', error);
      setLoading(false);
    }
  }

  // Update posts when language changes
  useEffect(() => {
    setPosts([]);
    setPage(1);
    loadPosts();
  }, [language]);

  // ... rest of the component remains the same
}