import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { IBM_Plex_Serif } from 'next/font/google';

import { AnimatedDots } from '@/components/shared/AnimatedDots';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';
import { userStatsQuery } from '@/features/home/queries/user-stats';

import { ProBadge } from './ProBadge';
import { ProUpgradeButton } from './ProUpgradeButton';

interface ProBannerProps {
  readonly totalEarnings?: number | null;
}

const plex = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['italic'],
  display: 'swap',
});

const EligibleUser = () => {
  return (
    <div className="z-20 w-72">
      <p className="text-2xl font-medium text-white md:text-3xl md:font-semibold">
        You&apos;re now eligible for Earn Pro
      </p>
      <p className="mt-4 text-base text-zinc-400">
        Upgrade to Earn Pro to get access to exclusive opportunities and perks
      </p>
      <div className="mt-5 w-full sm:w-auto">
        <ProUpgradeButton origin="banner" className="w-auto">
          Upgrade to Pro
        </ProUpgradeButton>
      </div>
    </div>
  );
};

const NotProUser = ({ totalEarnings }: { totalEarnings: number }) => {
  return (
    <div className="z-20 w-72">
      <p className="text-2xl font-medium text-white md:text-3xl md:font-semibold">
        You’re very close to being eligible
      </p>
      <p className="mt-4 text-base text-zinc-400">
        You need to earn $
        {(1000 - totalEarnings).toLocaleString('en-US', {
          maximumFractionDigits: 0,
        })}{' '}
        more, or become a Superteam member
      </p>
      <div className="mt-5 flex items-center gap-4">
        <Progress
          value={(totalEarnings / 1000) * 100}
          className="w-20 bg-zinc-600"
          indicatorClassName="bg-white"
        />
        <p className="text-base text-zinc-500">
          $
          {totalEarnings.toLocaleString('en-US', {
            maximumFractionDigits: 0,
          })}{' '}
          /{' '}
          <span className="text-white">
            $
            {(1000).toLocaleString('en-US', {
              maximumFractionDigits: 0,
            })}
          </span>
        </p>
      </div>
    </div>
  );
};

const NotLoggedInUser = () => {
  return (
    <div className="z-20 w-72">
      <p className="text-2xl font-medium text-white md:text-3xl md:font-semibold">
        You’re very close to being eligible
      </p>
      <p className="mt-4 text-base text-zinc-400">Sign in to see your status</p>
      <AuthWrapper className="mt-5 w-full sm:w-auto">
        <Button className="ph-no-capture h-9 w-auto bg-white px-9 py-1 text-sm font-semibold text-zinc-900 hover:bg-white/90 sm:w-auto md:h-10 md:py-3">
          Sign In
        </Button>
      </AuthWrapper>
    </div>
  );
};

const ProUser = ({ name }: { name: string }) => {
  return (
    <div className="z-20 w-80">
      <p className="text-3xl text-white">
        An elite club for the{' '}
        <span className={cn(plex.className, 'font-4xl text-white italic')}>
          top 1%
        </span>{' '}
        in Solana
      </p>
      <p className="mt-4 text-base text-zinc-400">
        Welcome to the club, {name}
      </p>
    </div>
  );
};

const ProBannerSkeleton = () => {
  return (
    <div className="z-10 w-72">
      <Skeleton className="h-9 w-full bg-zinc-800" />
      <Skeleton className="mt-4 h-5 w-3/4 bg-zinc-800" />
      <div className="mt-5 flex items-center gap-4">
        <Skeleton className="h-2 w-20 bg-zinc-800" />
        <Skeleton className="h-5 w-32 bg-zinc-800" />
      </div>
    </div>
  );
};

export function ProBanner({ totalEarnings }: ProBannerProps) {
  const { user, isLoading: isUserLoading } = useUser();
  const { data: stats, isLoading: isStatsLoading } = useQuery(userStatsQuery);
  const isPro = user?.isPro ?? false;
  const { authenticated } = usePrivy();

  const isLoading = isUserLoading || isStatsLoading;

  const isUserEligibleForPro =
    !isPro &&
    authenticated &&
    user &&
    ((stats && (stats.totalWinnings ?? 0) >= 1000) ||
      user?.superteamLevel?.includes('Superteam'));

  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-xl bg-zinc-800 px-6 pb-8 text-white sm:pb-10 md:px-11">
      <AnimatedDots
        dotSize={2}
        colors={['#939393']}
        columns={40}
        rows={6}
        spacing={1.5}
        className="z-10"
      />
      <ProBadge
        containerClassName="bg-zinc-600 px-2 py-1 gap-1 w-fit z-10"
        iconClassName="size-3 text-zinc-400"
        textClassName="text-xs font-medium text-white"
      />
      {isLoading ? (
        <ProBannerSkeleton />
      ) : !authenticated ? (
        <NotLoggedInUser />
      ) : isPro ? (
        <ProUser name={user?.firstName ?? ''} />
      ) : isUserEligibleForPro ? (
        <EligibleUser />
      ) : (
        <NotProUser totalEarnings={totalEarnings ?? 0} />
      )}
      <ExternalImage
        src={'/pro/globe.webp'}
        alt="Globe"
        className="absolute top-10 -right-10 z-10 scale-80 sm:-top-15 sm:scale-60"
      />
      <div className="absolute -top-20 -left-10 z-0 size-96 rounded-full bg-[#3D3D3D] blur-[60px]" />
    </div>
  );
}
