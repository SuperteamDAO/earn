import { Skeleton } from '@/components/ui/skeleton';

import { HelpBanner } from './HelpBanner';

export const BannerSkeleton = () => {
  return (
    <div className="mb-6 flex w-full flex-col gap-4 xl:flex-row xl:items-center">
      <div className="w-full rounded-md border border-slate-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex shrink-0 items-center gap-3 pb-1 lg:pb-0">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-2 h-5 w-[170px]" />
            </div>
          </div>

          <div className="block h-0.5 w-full border-t border-slate-200 lg:h-14 lg:w-0.5 lg:border-r" />

          <div className="flex gap-6 xl:gap-4 2xl:gap-6">
            <div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="mt-2 h-5 w-[72px]" />
            </div>
            <div>
              <Skeleton className="h-4 w-14" />
              <Skeleton className="mt-2 h-5 w-[72px]" />
            </div>
            <div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-5 w-[72px]" />
            </div>
          </div>
        </div>
      </div>

      <div className="xl:w-[60%] xl:max-w-[400px]">
        <HelpBanner />
      </div>
    </div>
  );
};
