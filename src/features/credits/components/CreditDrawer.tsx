import { useQuery } from '@tanstack/react-query';
import { Info, X } from 'lucide-react';
import { useRouter } from 'next/router';
import Countdown from 'react-countdown';

import { CountDownRenderer } from '@/components/shared/countdownRenderer';
import { SideDrawer, SideDrawerContent } from '@/components/ui/side-drawer';
import { Tooltip } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { useCreditBalance } from '@/store/credit';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

import { CreditIcon } from '../icon/credit';
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

  const handleClose = () => {
    const currentPath = window.location.hash;

    if (currentPath === '#wallet') {
      router.push(window.location.pathname, undefined, { shallow: true });
    }

    onClose();
  };

  const padding = 'px-6 sm:px-8';

  const { data: creditHistory, isLoading } = useQuery({
    queryKey: ['creditHistory', user?.id],
    queryFn: () => api.get('/api/user/credit/history'),
    enabled: !!user?.id,
  });

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
      <SideDrawerContent className="flex h-full w-screen flex-col sm:w-[30rem]">
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
                  content="See what led to changes in your Submission Credit balances. Bounty or Project submissions, spam reports and wins lead to changes in your Submission Credits."
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
                  <CreditIcon className="text-brand-purple size-6" />
                  <p className="text-lg font-semibold text-slate-800">
                    {creditBalance} Credits
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium tracking-tight text-slate-500">
                  EXPIRES IN
                </p>
                <p className="mt-1.5 text-lg font-medium text-slate-800">
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

          <div className="flex-1 overflow-y-auto bg-white">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p className="text-slate-500">Loading credit history...</p>
              </div>
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
                  />
                )}
                {currentMonthEntries.length > 0 && (
                  <CreditHistoryCard
                    title={<h2 className="text-sm font-medium">This Month</h2>}
                    entries={currentMonthEntries}
                  />
                )}
                {pastMonthEntries.length > 0 && (
                  <CreditHistoryCard
                    title={
                      <h2 className="text-sm font-medium">Past 3 Months</h2>
                    }
                    entries={pastMonthEntries}
                  />
                )}
              </div>
            )}
          </div>

          <div className="w-full border-t border-slate-50 bg-white py-1 shadow-[0_-2px_3px_rgba(0,0,0,0.05)]">
            <p className="mx-auto flex items-center justify-center text-xs text-slate-400 transition-colors sm:text-sm">
              <span className="cursor-pointer underline">
                <a
                  href="https://superteamdao.notion.site/submission-credits"
                  target="_blank"
                >
                  Click here
                </a>
              </span>{' '}
              to learn more
            </p>
          </div>
        </div>
      </SideDrawerContent>
    </SideDrawer>
  );
}
