import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';

import SuperteamIcon from '@/components/icons/SuperteamIcon';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/progress';
import { type BountyType } from '@/generated/prisma/enums';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useUser } from '@/store/user';
import styles from '@/styles/listing-description.module.css';
import { cn } from '@/utils/cn';

import { userStatsQuery } from '@/features/home/queries/user-stats';
import { ProBadge } from '@/features/pro/components/ProBadge';
import { ProIntro } from '@/features/pro/components/ProIntro';

const DescriptionSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="space-y-2">
      <div className="h-4 w-full rounded bg-slate-100" />
      <div className="h-4 w-[95%] rounded bg-slate-100" />
      <div className="h-4 w-[88%] rounded bg-slate-100" />
      <div className="h-4 w-[70%] rounded bg-slate-100" />
    </div>
    <div className="space-y-2">
      <div className="h-4 w-full rounded bg-slate-100" />
      <div className="h-4 w-[92%] rounded bg-slate-100" />
      <div className="h-4 w-[85%] rounded bg-slate-100" />
      <div className="h-4 w-full rounded bg-slate-100" />
      <div className="h-4 w-[60%] rounded bg-slate-100" />
    </div>
    <div className="space-y-2">
      <div className="h-4 w-[90%] rounded bg-slate-100" />
      <div className="h-4 w-full rounded bg-slate-100" />
      <div className="h-4 w-[75%] rounded bg-slate-100" />
    </div>
  </div>
);

const HtmlContent = dynamic(() => import('./HtmlContent'), {
  ssr: false,
  loading: () => <DescriptionSkeleton />,
});

interface Props {
  description?: string;
  type: BountyType | 'grant';
  sponsorId: string;
  isPro?: boolean;
}

export function DescriptionUI({
  description,
  type,
  sponsorId,
  isPro = false,
}: Props) {
  const { user, isLoading: isUserLoading } = useUser();
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    ...userStatsQuery,
    enabled: isPro,
  });

  const [showMore, setShowMore] = useState(true);
  const [showCollapser, setShowCollapser] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const isNotMD = useMediaQuery('(max-width: 767px)');

  const decideCollapser = useCallback(() => {
    if (descriptionRef.current) {
      const fiftyVH = window.innerHeight / 2;
      if (isNotMD && descriptionRef.current.clientHeight > fiftyVH) {
        setShowCollapser(true);
        setShowMore(false);
      }
    }
  }, [isNotMD]);

  useEffect(() => {
    const timer = setTimeout(() => {
      decideCollapser();
    }, 0);
    return () => clearTimeout(timer);
  }, [decideCollapser]);

  const isUserSponsor = user?.currentSponsorId === sponsorId;
  const isProEligibilityLoading =
    isPro && !isUserSponsor && (isUserLoading || isStatsLoading);
  const shouldShowProGate =
    isPro && !isUserSponsor && !user?.isPro && !isProEligibilityLoading;
  const shouldShowDescriptionSkeleton = isProEligibilityLoading;

  if (shouldShowProGate) {
    const randomText =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

    const isUserEligibleForPro =
      (stats && (stats.totalWinnings ?? 0) >= 1000) ||
      user?.superteamLevel?.includes('Superteam');

    return (
      <div className="relative h-180 w-full overflow-hidden border-b-2 border-slate-200 md:border-0">
        <div className="absolute inset-0 p-4">
          <div className="mx-auto max-w-4xl text-lg leading-relaxed font-medium text-slate-600 blur-sm select-none">
            {randomText}
          </div>
          <div className="mx-auto max-w-4xl text-lg leading-relaxed font-medium text-slate-600 blur-sm select-none">
            {randomText}
          </div>
          <div className="mx-auto max-w-4xl text-lg leading-relaxed font-medium text-slate-600 blur-sm select-none">
            {randomText}
          </div>
        </div>
        <div className="absolute inset-0 bg-white/0 backdrop-blur-sm" />
        <div className="absolute right-1/2 bottom-1/2 translate-x-1/2 translate-y-1/2 shadow-lg">
          {!isUserEligibleForPro ? (
            <div className="w-100 rounded-xl bg-white px-8 pt-6 pb-10">
              <ProBadge
                containerClassName="bg-zinc-200 w-fit px-2 py-0.5 gap-1"
                iconClassName="size-3 text-zinc-500"
                textClassName="text-sm text-zinc-800 text-medium"
              />
              <p className="mt-4 text-xl font-medium text-zinc-800">
                This {type} is only eligible for PRO members
              </p>
              <p className="text-md mt-4 mb-4 font-medium text-slate-500">
                To be eligible for Pro, you need to:
              </p>
              <div className="mt-4 flex items-center gap-3">
                <CircularProgress
                  className="size-7 shrink-0"
                  value={stats ? ((stats.totalWinnings ?? 0) / 1000) * 100 : 0}
                  color="#6366f1"
                />
                <div className="flex flex-col">
                  {stats ? (
                    <p className="text-md text-slate-500">
                      Earn{' '}
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      }).format(1000 - (stats.totalWinnings ?? 0))}{' '}
                      more, or
                    </p>
                  ) : (
                    <p className="text-md text-slate-500">Win $1,000 on Earn</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <SuperteamIcon className="text-brand-purple ml-0.5 size-9" />
                <div className="flex flex-col">
                  <p className="text-md text-slate-500">
                    Become a Superteam member of your region
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <ProIntro origin="sidebar" className="w-80" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full overflow-visible border-b-2 border-slate-200 md:border-0',
        showMore && 'pb-4',
      )}
    >
      <div
        ref={descriptionRef}
        className="relative w-full overflow-visible rounded-xl bg-white"
      >
        <div
          className={cn(
            'transition-all duration-200',
            !showMore && 'h-[50vh] overflow-hidden',
          )}
        >
          <div
            className={`${styles.content} mt-4 w-full overflow-visible pb-7`}
          >
            {shouldShowDescriptionSkeleton ? (
              <DescriptionSkeleton />
            ) : (
              <HtmlContent description={description} />
            )}
          </div>
          {!showMore && (
            <div
              className="pointer-events-none absolute right-0 bottom-0 left-0 h-[40%]"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.9))',
              }}
            />
          )}
        </div>
        {showCollapser && (
          <Button
            className={cn(
              'absolute -bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md border-slate-300 bg-white text-sm font-medium text-slate-500',
              showMore && '-bottom-8',
            )}
            onClick={() => setShowMore(!showMore)}
            size="sm"
            variant="outline"
          >
            <span>Read {showMore ? <span>Less</span> : <span>More</span>}</span>
            <ChevronDown
              className={`ml-0 h-5 w-5 text-slate-500 transition-transform duration-200 ${
                showMore ? 'rotate-180' : ''
              }`}
            />
          </Button>
        )}
      </div>
    </div>
  );
}
