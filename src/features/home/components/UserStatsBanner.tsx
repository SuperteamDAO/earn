import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';

import { AnimatedDots } from '@/components/shared/AnimatedDots';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { userStatsQuery } from '@/features/home/queries/user-stats';
import { ProBadge } from '@/features/pro/components/ProBadge';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

interface StatProps {
  value: number | string;
  label: string;
  isPro: boolean;
}

const Stat = ({ value, label, isPro }: StatProps) => {
  return (
    <div>
      <p className="font-semibold">{value}</p>
      <p
        className={cn(
          'text-xs md:text-sm',
          isPro ? 'text-zinc-400' : 'text-indigo-200',
        )}
      >
        {label}
      </p>
    </div>
  );
};

export const UserStatsBanner = () => {
  const { user, isLoading: isUserLoading } = useUser();
  const { ready } = usePrivy();
  const { data: stats, isLoading } = useQuery(userStatsQuery);

  const isPro = user?.isPro;

  if (!ready || isLoading || isUserLoading) {
    return (
      <Skeleton className="mx-auto h-[170px] max-h-[300px] rounded-xl bg-indigo-600 p-6 md:h-[100px] md:p-10"></Skeleton>
    );
  }

  return (
    <div
      className={cn(
        'relative flex flex-col gap-4 overflow-hidden rounded-xl bg-indigo-600 bg-linear-to-r px-6 py-6.5 text-white md:flex-row md:items-center md:justify-between md:px-8',
        isPro && 'bg-black',
      )}
    >
      <div className="absolute -top-20 -left-40 size-96 rounded-full bg-[#3F4041] blur-[90px]" />

      <AnimatedDots
        dotSize={isPro ? 4 : 3}
        colors={isPro ? ['#939393'] : ['#B18CFF']}
        columns={30}
        rows={3}
        spacing={1.5}
        className="absolute top-0 left-10 z-10 opacity-80"
      />

      <div className="relative z-10 flex items-center gap-4">
        <EarnAvatar id={user?.id} avatar={user?.photo} className="h-12 w-12" />
        <div className="flex flex-col gap-0">
          <div className="flex items-center gap-2">
            <p className="max-w-100 truncate text-lg font-semibold md:text-xl">
              {user?.isTalentFilled
                ? `Welcome back, ${user.firstName}`
                : 'Welcome!'}
            </p>
            {isPro && (
              <ProBadge
                containerClassName="bg-zinc-700 px-2.5 py-0.5 gap-1"
                iconClassName="size-3 text-zinc-400"
                textClassName="text-xs font-medium text-white"
              />
            )}
          </div>
          <p
            className={cn(
              'text-sm',
              isPro ? 'text-zinc-400' : 'text-indigo-200',
            )}
          >
            We&apos;re so glad to have you on Earn
          </p>
        </div>
      </div>

      <div
        className={cn(
          'z-10 -mx-6 h-px bg-indigo-400 md:hidden',
          isPro && 'bg-zinc-700',
        )}
      />

      {stats && (stats.wins ?? 0) > 0 && (
        <div className="z-10 flex justify-between gap-4 sm:gap-8 md:justify-start">
          <Stat
            value={new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
              notation: 'compact',
            }).format(stats.totalWinnings ?? 0)}
            label="Total Earned"
            isPro={isPro ?? false}
          />
          <Stat
            value={stats.participations}
            label="Participated"
            isPro={isPro ?? false}
          />
          <Stat value={stats.wins} label="Won" isPro={isPro ?? false} />
        </div>
      )}
    </div>
  );
};
