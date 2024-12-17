import { Suspense } from 'react';
import { ProfileContent } from '@/components/profile/ProfileContent';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { supabase } from '@/lib/supabase';

export async function generateStaticParams() {
  const { data: figures } = await supabase
    .from('historical_figures')
    .select('id');

  return (figures || []).map((figure) => ({
    id: figure.id,
  }));
}

export default function ProfilePage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent id={params.id} />
    </Suspense>
  );
}