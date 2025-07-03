import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';

import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/store/user';

import { userStatsQuery } from '@/features/home/queries/user-stats';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

interface StatProps {
  value: number | string;
  label: string;
}

const Stat = ({ value, label }: StatProps) => {
  return (
    <div>
      <p className="font-semibold">{value}</p>
      <p className="text-xs text-indigo-200 md:text-sm">{label}</p>
    </div>
  );
};

export const UserStatsBanner = () => {
  const { user, isLoading: isUserLoading } = useUser();
  const { ready } = usePrivy();
  const { data: stats, isLoading } = useQuery(userStatsQuery);

  if (!ready || isLoading || isUserLoading) {
    return (
      <Skeleton className="from-brand-purple mx-auto h-[170px] max-h-[300px] rounded-xl bg-linear-to-r to-indigo-600 p-6 md:h-[100px] md:p-10"></Skeleton>
    );
  }

  return (
    <div className="from-brand-purple flex flex-col gap-4 rounded-xl bg-linear-to-r to-indigo-600 px-6 py-6 text-white md:flex-row md:items-center md:justify-between md:px-8">
      <div className="flex items-center gap-4">
        <EarnAvatar id={user?.id} avatar={user?.photo} className="h-12 w-12" />
        <div className="flex flex-col gap-0">
          <p className="max-w-[25rem] truncate text-lg font-semibold md:text-xl">
            {user?.isTalentFilled
              ? `Welcome back, ${user.firstName}`
              : 'Welcome!'}
          </p>
          <p className="text-sm text-indigo-200">
            We&apos;re so glad to have you on Earn
          </p>
        </div>
      </div>

      <div className="-mx-6 h-px bg-indigo-400 md:hidden" />

      {stats && (stats.wins ?? 0) > 0 && (
        <div className="flex justify-between gap-4 sm:gap-8 md:justify-start">
          <Stat
            value={new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
              notation: 'compact',
            }).format(stats.totalWinnings ?? 0)}
            label="Total Earned"
          />
          <Stat value={stats.participations} label="Participated" />
          <Stat value={stats.wins} label="Won" />
        </div>
      )}
    </div>
  );
};
