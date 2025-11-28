import { IBM_Plex_Serif } from 'next/font/google';

import { AnimatedDots } from '@/components/shared/AnimatedDots';
import { LocalImage } from '@/components/ui/local-image';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { ProBadge } from './ProBadge';

interface ProBannerProps {
  readonly totalEarnings?: number | null;
}

const plex = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['italic'],
  display: 'swap',
});

const NotProUser = ({ totalEarnings }: { totalEarnings: number }) => {
  return (
    <div className="z-10 w-72">
      <p className="text-3xl font-semibold text-white">
        You’re very close to being eligible
      </p>
      <p className="mt-4 text-base text-zinc-400">
        You need to earn ${(1000 - totalEarnings).toFixed(0)} more
      </p>
      <div className="mt-5 flex items-center gap-4">
        <Progress
          value={(totalEarnings / 1000) * 100}
          className="w-20 bg-zinc-600"
          indicatorClassName="bg-white"
        />
        <p className="text-base text-zinc-500">
          ${totalEarnings.toFixed(0)} /{' '}
          <span className="text-white">$1000</span>
        </p>
      </div>
    </div>
  );
};

const ProUser = ({ name }: { name: string }) => {
  return (
    <div className="z-20 w-80">
      <p className="text-3xl text-white">
        A premier club for the{' '}
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
  const { user, isLoading } = useUser();
  const isPro = user?.isPro ?? false;
  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-xl bg-zinc-800 px-11 pb-10 text-white">
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
      ) : isPro ? (
        <ProUser name={user?.firstName ?? ''} />
      ) : (
        <NotProUser totalEarnings={totalEarnings ?? 0} />
      )}
      <LocalImage
        src="/assets/pro-globe.png"
        alt="Globe"
        className="absolute top-8 -right-10 z-10 scale-60"
      />
      <div className="absolute -top-20 -left-10 z-0 size-96 rounded-full bg-[#3D3D3D] blur-[60px]" />
    </div>
  );
}
