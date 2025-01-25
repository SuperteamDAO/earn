import { Skeleton } from '@/components/ui/skeleton';

export function TokenSkeleton() {
  return (
    <div className="overflow-hidden">
      <div className="px-8 py-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="mt-1 h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
