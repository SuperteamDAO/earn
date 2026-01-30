import { Skeleton } from '@/components/ui/skeleton';

export const SubmissionsPageSkeleton = () => {
  return (
    <div className="w-full">
      {/* Header skeleton */}
      <div className="mb-2 flex items-center justify-between gap-12 pt-2">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-slate-400">
            <Skeleton className="ml-8 h-4 w-20" />
          </div>
          {/* Title row */}
          <div className="mt-1 mb-2 flex items-center gap-2">
            <div className="ml-1 flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-52" />
            </div>
            <Skeleton className="h-6 w-3 rounded-md" />
            <Skeleton className="ml-2 h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="flex flex-col items-end">
          <Skeleton className="h-9 w-52 rounded-lg" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="mt-3 flex gap-4 pt-9.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-6 rounded-xl" />
        </div>
      </div>
      <div className="my-2 h-[1.5px] w-full bg-slate-200/70" />

      {/* Main content - two column layout */}
      <div className="grid h-160 w-full grid-cols-[23rem_1fr] bg-white">
        {/* Left side - SubmissionList skeleton */}
        <div className="h-full w-full rounded-l-lg border border-slate-200 bg-white">
          {/* Search bar */}
          <div className="flex w-full items-center justify-between gap-2 p-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10 shrink-0" />
          </div>

          {/* Submission list items */}
          <div className="border-t">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 border-b border-slate-200 px-3 py-2"
              >
                <div className="flex items-center">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="ml-2 w-40">
                    <Skeleton className="mb-1 h-3.5 w-28" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right side - SubmissionPanel skeleton */}
        <div className="h-full w-full rounded-r-xl border-t border-r border-b border-slate-200 bg-white">
          {/* Panel header */}
          <div className="border-b border-slate-200 py-1">
            <div className="flex w-full items-center justify-between px-4 pt-3">
              <div className="flex w-full items-center gap-2">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div>
                  <Skeleton className="mb-1 h-4 w-36" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-28 rounded-lg" />
              </div>
            </div>
            {/* Info row */}
            <div className="flex items-center gap-5 px-5 py-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3.5 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-3.5 w-3.5" />
                <Skeleton className="h-3.5 w-3.5" />
                <Skeleton className="h-3.5 w-3.5" />
                <Skeleton className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          {/* Panel content */}
          <div className="p-4">
            <div className="mb-4">
              <Skeleton className="mb-1 h-3 w-24" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="mt-1 h-3.5 w-3/4" />
            </div>
            <div className="mb-4">
              <Skeleton className="mb-1 h-3 w-20" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="mt-1 h-3.5 w-2/3" />
            </div>
            <div className="mb-4">
              <Skeleton className="mb-1 h-3 w-16" />
              <Skeleton className="h-3.5 w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
