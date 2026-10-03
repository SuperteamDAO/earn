import { Skeleton } from '@/components/ui/skeleton';

// Same footprint as HomeSideBar, so the column is reserved before it mounts.
export const HomeSideBarSkeleton = () => (
  <div className="flex w-96 flex-col gap-8 py-3 pl-6">
    <Skeleton className="h-40 w-full rounded-xl" />
    <Skeleton className="h-56 w-full rounded-xl" />
    <Skeleton className="h-72 w-full rounded-xl" />
  </div>
);
