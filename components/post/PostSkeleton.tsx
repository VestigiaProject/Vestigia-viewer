import { Skeleton } from '@/components/ui/skeleton';

export function PostSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
        <Skeleton className="h-[200px] w-full" />
      </div>

      <Skeleton className="h-12 w-full" />
      
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
} 