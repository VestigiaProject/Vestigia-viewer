import { fetchAllPostIds } from '@/lib/api/posts';

export async function generateStaticParams() {
  const ids = await fetchAllPostIds();
  return ids.map((id) => ({ id }));
} 