'use client';
import { useQuery } from '@tanstack/react-query';
import { Info, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Countdown from 'react-countdown';

import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SideDrawer, SideDrawerContent } from '@/components/ui/side-drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { useCreditBalance } from '@/store/credit';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

import { CreditIcon } from '../icon/credit';
import { canDispute } from '../utils/canDispute';
import { CreditHistoryCard } from './CreditLog';

export function CreditDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useUser();
  const { creditBalance } = useCreditBalance();
  const router = useRouter();
  const [disputeSubmissionId, setDisputeSubmissionId] = useState<string | null>(
    null,
  );

  const { data: creditHistory, isLoading } = useQuery({
    queryKey: ['creditHistory', user?.id],
    queryFn: () => api.get('/api/user/credit/history'),
    enabled: !!user?.id && isOpen,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    const checkForDisputeHash = () => {
      const url = window.location.href;
      const hashIndex = url.indexOf('#');
      const afterHash = hashIndex !== -1 ? url.substring(hashIndex + 1) : '';
      const [hashValue] = afterHash.split('?');

      if (hashValue?.startsWith('dispute-submission-')) {
        const submissionId = hashValue.replace('dispute-submission-', '');

        if (creditHistory?.data) {
          const allEntries = processEntries(creditHistory.data);
          const entryToDispute = allEntries.find(
            (entry) =>
              entry.submission?.id === submissionId &&
              (entry.type === 'SPAM_PENALTY' ||
                entry.type === 'GRANT_SPAM_PENALTY'),
          );

          const dispute = canDispute(entryToDispute, allEntries, true);

          if (entryToDispute && dispute) {
            setDisputeSubmissionId(submissionId);
          } else {
            const pathWithoutHash =
              router.asPath.split('#')[0] || router.pathname;
            router.replace(pathWithoutHash, undefined, { shallow: true });
          }
        }
      } else {
        setDisputeSubmissionId(null);
      }
    };

    if (isOpen) {
      checkForDisputeHash();
    }
  }, [isOpen, creditHistory?.data, router, canDispute]);

  const handleClose = () => {
    const currentPath = window.location.hash;

    if (
      currentPath === '#wallet' ||
      currentPath.startsWith('#dispute-submission-')
    ) {
      router.push(window.location.pathname, undefined, { shallow: true });
    }

    setDisputeSubmissionId(null);
    onClose();
  };

  const padding = 'px-6 sm:px-8';

  const processEntries = (entries: any[] = []) => {
    return entries.map((entry) => ({
      ...entry,
      submission: entry.submission || {
        listing: {
          title:
            entry.type === 'MONTHLY_CREDIT'
              ? 'Monthly Credit Renewal'
              : entry.type === 'CREDIT_EXPIRY'
                ? 'Monthly Credit Expiration'
                : '',
          type: '',
          sponsor: { logo: '' },
        },
      },
    }));
  };

  const currentMonthStart = dayjs().utc().startOf('month');
  const nextMonthStart = currentMonthStart.add(1, 'month');

  const currentMonthEntries = processEntries(
    creditHistory?.data?.filter((entry: any) =>
      dayjs(entry.effectiveMonth).utc().isSame(currentMonthStart, 'month'),
    ),
  );

  const upcomingMonthEntries = processEntries(
    creditHistory?.data?.filter((entry: any) =>
      dayjs(entry.effectiveMonth).utc().isSame(nextMonthStart, 'month'),
    ),
  );

  const pastMonthEntries = processEntries(
    creditHistory?.data?.filter((entry: any) =>
      dayjs(entry.effectiveMonth).utc().isBefore(currentMonthStart, 'month'),
    ),
  );

  return (
    <SideDrawer isOpen={isOpen} onClose={handleClose}>
      <SideDrawerContent className="flex h-full w-screen flex-col overflow-hidden sm:w-[30rem]">
        <X
          className="absolute top-5 right-4 z-10 h-5 w-5 cursor-pointer text-slate-600 sm:hidden"
          onClick={onClose}
        />

        <div className="flex h-full flex-col">
          <div
            className={cn(
              'items-center border-b bg-slate-50 py-5 pb-4',
              padding,
            )}
          >
            <div className="flex items-baseline gap-2">
              <h2 className="flex items-center gap-1 text-lg font-semibold tracking-tight">
                Credit History
                <Tooltip
                  contentProps={{ className: 'z-[200]' }}
                  content="See what led to changes in your submission credit balance. Your credits are affected by bounty and project submissions, as well as wins and spam reports across grants, and listings."
                >
                  <Info className="size-4 text-slate-500" />
                </Tooltip>
              </h2>
            </div>
          </div>
          <div className={cn('bg-slate-50 py-4', padding)}>
            <div className="flex w-full items-baseline justify-between gap-1">
              <div>
                <p className="text-sm font-medium tracking-tight text-slate-500">
                  CURRENT BALANCE
                </p>
                <div className="mt-1.5 flex items-center gap-1">
                  <CreditIcon className="text-brand-purple size-5 sm:size-6" />
                  <p className="text-base font-semibold text-slate-800 sm:text-lg">
                    {creditBalance} Credits
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium tracking-tight text-slate-500">
                  {creditBalance <= 0 ? 'RENEWS IN' : 'EXPIRES IN'}
                </p>
                <p className="mt-1.5 text-base font-medium text-slate-800 sm:text-lg">
                  <Countdown
                    date={
                      new Date(
                        Date.UTC(
                          new Date().getUTCFullYear(),
                          new Date().getUTCMonth() + 1,
                          0,
                          23,
                          59,
                          59,
                        ),
                      )
                    }
                    renderer={CountDownRenderer}
                    zeroPadDays={1}
                  />
                </p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 overflow-y-auto bg-white">
            {isLoading ? (
              <CreditHistorySkeleton />
            ) : creditHistory?.data?.length === 0 ? (
              <div className="flex justify-center py-8">
                <p className="text-slate-500">No credit history available</p>
              </div>
            ) : (
              <div className="mb-4 pb-2">
                {upcomingMonthEntries.length > 0 && (
                  <CreditHistoryCard
                    title={
                      <div className="flex gap-1">
                        <h2 className="text-sm font-medium">Upcoming Month</h2>
                        <p className="mt-0.5 flex items-center gap-0.5 text-xs text-slate-500">
                          (Expected:{' '}
                          <span className="flex items-center gap-1 font-medium">
                            {upcomingMonthEntries.reduce(
                              (sum, entry) => sum + (entry.change ?? 0),
                              0,
                            )}{' '}
                            Credits
                            <CreditIcon className="text-brand-purple size-3.5" />
                          </span>
                          )
                        </p>
                        <Tooltip
                          contentProps={{ className: 'z-[200]' }}
                          content="This shows your win or spam activity for the current month, and how it will affect your Submission Credit balance in the next month."
                        >
                          <Info className="mt-0.5 size-3.5 text-slate-500" />
                        </Tooltip>
                      </div>
                    }
                    entries={upcomingMonthEntries}
                    disputeSubmissionId={disputeSubmissionId}
                  />
                )}
                {currentMonthEntries.length > 0 && (
                  <CreditHistoryCard
                    title={<h2 className="text-sm font-medium">This Month</h2>}
                    entries={currentMonthEntries}
                    disputeSubmissionId={disputeSubmissionId}
                  />
                )}
                {pastMonthEntries.length > 0 && (
                  <CreditHistoryCard
                    title={
                      <h2 className="text-sm font-medium">Past 3 Months</h2>
                    }
                    entries={pastMonthEntries}
                    disputeSubmissionId={disputeSubmissionId}
                  />
                )}
              </div>
            )}
          </ScrollArea>

          <div className="w-full border-t border-slate-50 bg-white py-1 shadow-[0_-2px_3px_rgba(0,0,0,0.05)]">
            <p className="mx-auto flex items-center justify-center text-xs text-slate-400 transition-colors sm:text-sm">
              <span className="mr-1 cursor-pointer underline">
                <a
                  href="https://superteamdao.notion.site/submission-credits"
                  target="_blank"
                >
                  Click here
                </a>
              </span>
              to learn more
            </p>
          </div>
        </div>
      </SideDrawerContent>
    </SideDrawer>
  );
}

function CreditHistorySkeleton() {
  return (
    <div className="mb-4 pb-2">
      <div className="w-full">
        <div className="flex items-center gap-1 px-4 pt-5 pb-3">
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="border-t border-slate-200" />
        <div className="space-y-0">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-4 sm:gap-4"
            >
              <div className="relative">
                <Skeleton className="size-8 rounded-full sm:size-10" />
                <div className="absolute -right-1 -bottom-1">
                  <Skeleton className="size-5 rounded-full" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="flex flex-col items-end space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full">
        <div className="flex items-center gap-1 px-4 pt-5 pb-3">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="border-t border-slate-200" />
        <div className="space-y-0">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-4 sm:gap-4"
            >
              <div className="relative">
                <Skeleton className="size-8 rounded-full sm:size-10" />
                <div className="absolute -right-1 -bottom-1">
                  <Skeleton className="size-5 rounded-full" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <div className="flex flex-col items-end space-y-1">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
