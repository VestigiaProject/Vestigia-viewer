export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <ProfileHeaderSkeleton />
      <main className="container max-w-2xl mx-auto py-4">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </main>
    </div>
  );
}