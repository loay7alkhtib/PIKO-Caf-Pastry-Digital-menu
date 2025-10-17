import { Skeleton } from './ui/skeleton';

export function CategoryCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-3 sm:p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-3 sm:p-4 space-y-3">
        <Skeleton className="h-5 w-full" />
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function CategoryGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {[...Array(count)].map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ItemGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(count)].map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
}
