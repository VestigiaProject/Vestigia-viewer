import { Skeleton } from '@/components/ui/skeleton';

export function PostSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-2xl mx-auto py-4">
        <Skeleton className="h-64 w-full mb-8" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </main>
    </div>
  );
}