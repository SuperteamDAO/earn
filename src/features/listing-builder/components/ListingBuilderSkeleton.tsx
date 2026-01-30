import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { LocalImage } from '@/components/ui/local-image';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

function HeaderSkeleton() {
  return (
    <div className="bg-background sticky top-0 z-50 hidden border-b md:block">
      <div className={cn('mx-auto flex w-full justify-between px-6 py-2')}>
        <div className="flex items-center gap-6">
          <Link
            href="/earn"
            className="flex items-center gap-3 hover:no-underline"
          >
            <LocalImage
              src="/assets/logo.svg"
              alt="Superteam Earn"
              className="h-[1.4rem] w-auto cursor-pointer object-contain"
              loading="eager"
            />
            <div className="h-6 w-[1.5px] bg-slate-300" />
            <p className="text-sm tracking-[1.5px] text-slate-600">SPONSORS</p>
          </Link>
          <Button variant="outline" disabled>
            <ChevronLeft /> Go Back
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-end gap-4 py-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ListingBuilderSkeleton() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <HeaderSkeleton />
      <div className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-5xl space-y-8 px-8 py-10">
          <div className="grid grid-cols-9 gap-4">
            <div className="col-span-6 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex w-full rounded-md border">
                  <Skeleton className="h-10 w-32 rounded-none border-r" />
                  <Skeleton className="h-10 flex-1 rounded-none" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-28" />
                </div>
                <div className="rounded-md border">
                  <Skeleton className="h-10 w-full rounded-b-none border-b" />
                  <Skeleton className="h-[60vh] w-full rounded-t-none" />
                </div>
              </div>
            </div>

            <div className="sticky top-20 col-span-3 h-fit space-y-6">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-16" />
                <div className="flex w-full items-center rounded-md border border-slate-200 bg-slate-50 py-2.5 pr-2 pl-3">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="ml-1.5 h-4 w-20" />
                  <Skeleton className="ml-auto h-4 w-8" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-full rounded-md border" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-7 w-18" />
                  <Skeleton className="h-7 w-18" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-52" />
                </div>
                <Skeleton className="h-10 w-full rounded-md border" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-7 w-18" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md border" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-10 w-full rounded-md border" />
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex w-full items-center rounded-md border border-slate-200 bg-slate-50 py-2.5 pr-2 pl-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="ml-2 h-4 w-20" />
                  <Skeleton className="ml-auto h-4 w-8" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
