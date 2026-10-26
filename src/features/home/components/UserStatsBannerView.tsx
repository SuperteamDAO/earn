'use client';

import { AnimatedDots } from '@/components/shared/AnimatedDots';
import type { Viewer } from '@/server/users';

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

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});

// The welcome banner for a signed-in viewer; UserStatsBanner loads it.
export const UserStatsBannerView = ({
  user,
  stats,
}: {
  user: Pick<Viewer, 'id' | 'photo' | 'isTalentFilled' | 'firstName'> | null;
  stats: {
    wins: number;
    participations: number;
    totalWinnings: number;
  } | null;
}) => {
  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-xl bg-indigo-600 bg-linear-to-r px-6 py-4 text-white md:flex-row md:items-center md:justify-between md:px-8 md:py-6.5">
      <div className="absolute -top-20 -left-40 size-96 rounded-full bg-[#8667FB] blur-[90px]" />

      <AnimatedDots
        dotSize={2}
        colors={['#B18CFF']}
        columns={40}
        rows={6}
        spacing={1.5}
        className="absolute top-0 left-10 z-10 opacity-80"
      />

      <div className="relative z-10 flex items-center gap-4 pt-4 md:pt-0">
        <div className="relative shrink-0">
          <EarnAvatar
            id={user?.id}
            avatar={user?.photo ?? undefined}
            className="h-12 w-12"
          />
        </div>
        <div className="flex flex-col gap-0">
          <div className="flex items-center gap-2">
            <p className="max-w-100 truncate text-lg font-semibold md:text-xl">
              {user?.isTalentFilled
                ? `Welcome back, ${user.firstName}`
                : 'Welcome!'}
            </p>
          </div>
          <p className="text-sm text-indigo-200">
            We&apos;re so glad to have you on Earn
          </p>
        </div>
      </div>

      <div className="z-10 -mx-6 h-px bg-indigo-400 md:hidden" />

      {stats && (stats.wins ?? 0) > 0 && (
        <div className="z-10 flex justify-between gap-4 sm:gap-8 md:justify-start">
          <Stat
            value={currencyFormatter.format(stats.totalWinnings ?? 0)}
            label="Total Earned"
          />
          <Stat value={stats.participations} label="Participated" />
          <Stat value={stats.wins} label="Won" />
        </div>
      )}
    </div>
  );
};
