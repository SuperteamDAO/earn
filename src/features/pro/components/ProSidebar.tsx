import { useQuery } from '@tanstack/react-query';

import FaCheck from '@/components/icons/FaCheck';
import { CircularProgress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/store/user';

import { userStatsQuery } from '@/features/home/queries/user-stats';

import { ProIntro } from './ProIntro';
import { ProPerksCards } from './ProPerksCard';

const ProBenefitItem = ({ text }: { text: string }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-6 items-center justify-center rounded-full bg-zinc-200">
        <FaCheck className="size-3 text-zinc-500" />
      </div>
      <span className="text-sm whitespace-nowrap text-slate-500">{text}</span>
    </div>
  );
};

const PerksList = () => {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <ProBenefitItem text="Exclusive listings for Pro members" />
      <ProBenefitItem text="Special perks from the Solana ecosystem" />
      <ProBenefitItem text="One extra credit every month" />
      <ProBenefitItem text="Priority customer support" />
    </div>
  );
};

const ProEligibility = ({ totalWinnings }: { totalWinnings: number }) => {
  const hasWinnings = totalWinnings > 0;

  return (
    <>
      <p className="text-[0.95rem] font-medium text-slate-400">Eligibility</p>
      <div className="mt-4 flex items-center gap-4">
        <CircularProgress
          className="size-6 shrink-0"
          value={hasWinnings ? ((totalWinnings ?? 0) / 1000) * 100 : 0}
          color="#6366f1"
          thickness={2}
        />
        <div className="flex flex-col">
          {hasWinnings ? (
            <p className="text-sm text-slate-500">
              Earn atleast $1,000.{' '}
              <span className="ml-2 text-slate-400">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(totalWinnings ?? 0)}{' '}
                /1000
              </span>
            </p>
          ) : (
            <p className="text-sm text-slate-500">Win $1,000 on Earn</p>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <CircularProgress
          className="size-6 shrink-0"
          value={0}
          color="#6366f1"
          thickness={2}
        />
        <div className="flex flex-col">
          <p className="text-sm text-slate-500">
            Become a Superteam member of your region
          </p>
        </div>
      </div>
    </>
  );
};

export const ProSidebar = () => {
  const { data: stats, isLoading: isStatsLoading } = useQuery(userStatsQuery);
  const { user, isLoading: isUserLoading } = useUser();
  const isPro = user?.isPro;

  const isProEligibilityLoading = isUserLoading || isStatsLoading;

  const isUserEligibleForPro =
    !isPro &&
    ((stats && (stats.totalWinnings ?? 0) >= 1000) ||
      user?.superteamLevel?.includes('Superteam'));

  if (isProEligibilityLoading) {
    return (
      <div className="flex h-full w-full flex-col py-3 lg:w-130 lg:border-l lg:border-slate-100 lg:pl-6">
        <Separator className="mb-4 lg:hidden" />
        <div className="space-y-4">
          <div className="h-4 w-24 rounded bg-slate-100" />
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="size-6 shrink-0 rounded-full bg-slate-100" />
              <div className="h-4 w-48 rounded bg-slate-100" />
            </div>
            <div className="flex items-center gap-4">
              <div className="size-6 shrink-0 rounded-full bg-slate-100" />
              <div className="h-4 w-56 rounded bg-slate-100" />
            </div>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="space-y-4">
          <div className="h-4 w-32 rounded bg-slate-100" />
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-6 shrink-0 rounded-full bg-slate-100" />
              <div className="h-4 w-48 rounded bg-slate-100" />
            </div>
            <div className="flex items-center gap-3">
              <div className="size-6 shrink-0 rounded-full bg-slate-100" />
              <div className="h-4 w-56 rounded bg-slate-100" />
            </div>
            <div className="flex items-center gap-3">
              <div className="size-6 shrink-0 rounded-full bg-slate-100" />
              <div className="h-4 w-52 rounded bg-slate-100" />
            </div>
            <div className="flex items-center gap-3">
              <div className="size-6 shrink-0 rounded-full bg-slate-100" />
              <div className="h-4 w-44 rounded bg-slate-100" />
            </div>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="space-y-4">
          <div className="h-4 w-40 rounded bg-slate-100" />
          <div className="space-y-3">
            <div className="h-20 w-full rounded bg-slate-100" />
            <div className="h-20 w-full rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col py-3 lg:w-130 lg:border-l lg:border-slate-100 lg:pl-6">
      <Separator className="mb-4 lg:hidden" />
      {isPro ? (
        <>
          <p className="text-[0.95rem] font-medium text-slate-400">PERKS</p>
          <PerksList />
          <ProPerksCards />
        </>
      ) : (
        <>
          {isUserEligibleForPro ? (
            <ProIntro origin="sidebar" />
          ) : (
            <ProEligibility totalWinnings={stats?.totalWinnings ?? 0} />
          )}
          <Separator className="my-8" />
          <p className="text-[0.95rem] font-medium text-slate-400">
            Pro Benefits
          </p>
          <PerksList />
          <Separator className="my-8" />
          <p className="text-[0.95rem] font-medium text-slate-400">
            Pro Ecosystem Perks
          </p>
          <ProPerksCards />
        </>
      )}
    </div>
  );
};
