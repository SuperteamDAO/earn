import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

import { Skeleton } from '@/components/ui/skeleton';
import { PROJECT_NAME } from '@/constants/project';
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
      <p className="text-xs font-medium text-gray-500 md:text-sm">{label}</p>
    </div>
  );
};

export const UserStatsBanner = () => {
  const { user } = useUser();
  const { data: session, status } = useSession();
  const { data: stats, isLoading } = useQuery(userStatsQuery);

  if (!user) return <></>;

  if ((!session && status === 'loading') || isLoading) {
    return (
      <Skeleton className="mx-auto mb-8 h-[170px] max-h-[300px] rounded-md p-6 md:h-[100px] md:p-10" />
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-md bg-gradient-to-r from-slate-100 to-slate-50 px-6 py-6 text-black md:flex-row md:items-center md:justify-between md:px-8">
      <div className="flex items-center gap-4">
        <EarnAvatar id={user.id} avatar={user.photo} className="h-12 w-12" />
        <div className="flex flex-col gap-0">
          <p className="max-w-[25rem] truncate text-lg font-semibold md:text-xl">
            {user.isTalentFilled
              ? `Welcome back, ${user.firstName}`
              : 'Welcome!'}
          </p>
          <p className="text-sm text-gray-500">
            We&apos;re so glad to have you on {PROJECT_NAME}
          </p>
        </div>
      </div>

      <div className="h-px bg-black md:hidden" />

      {stats && (stats.wins ?? 0) > 0 && (
        <div className="mx-0.5 -mt-1.5 flex justify-between gap-4 sm:gap-8 md:mt-0 md:justify-start">
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
