import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';

import MdArrowForward from '@/components/icons/MdArrowForward';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useUser } from '@/store/user';

import { recentEarnersQuery } from '@/features/listings/queries/recent-earners';

import { totalsQuery } from '../queries/totals';
import { TotalStats } from './TotalStats';

interface SideBarProps {
  type: 'landing' | 'listing' | 'category' | 'region' | 'feed';
}

const VibeCard = dynamic(() =>
  import('@/features/home/components/VibeCard').then((mod) => mod.VibeCard),
);

const LiveListings = dynamic(() =>
  import('@/features/home/components/LiveListings').then(
    (mod) => mod.LiveListings,
  ),
);

const SponsorBanner = dynamic(
  () =>
    import('@/features/home/components/SponsorBanner').then(
      (mod) => mod.SponsorBanner,
    ),
  { ssr: false },
);

const HowItWorks = dynamic(() =>
  import('@/features/home/components/HowItWorks').then((mod) => mod.HowItWorks),
);

const RecentEarners = dynamic(() =>
  import('@/features/home/components/RecentEarners').then(
    (mod) => mod.RecentEarners,
  ),
);

const RecentActivity = dynamic(() =>
  import('@/features/home/components/RecentActivity').then(
    (mod) => mod.RecentActivity,
  ),
);

export const HomeSideBar = ({ type }: SideBarProps) => {
  const router = useRouter();
  const { user } = useUser();
  const isLg = useBreakpoint('lg');

  const { data: totals, isLoading: isTotalsLoading } = useQuery({
    ...totalsQuery,
    enabled: isLg,
  });
  const { data: recentEarners } = useQuery({
    ...recentEarnersQuery,
    enabled: isLg,
  });

  return (
    <div className="flex w-96 flex-col gap-8 py-3 pl-6">
      {type === 'feed' && (
        <>
          <VibeCard />
          <LiveListings>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">
                LIVE LISTINGS
              </span>
              <Link
                href="/"
                className="text-brand-purple flex items-center text-xs font-semibold"
              >
                View All
                <MdArrowForward className="ml-1" />
              </Link>
            </div>
          </LiveListings>
        </>
      )}
      {type !== 'feed' ? (
        <>
          <div className="flex flex-col gap-4">
            {router.asPath === '/' &&
              (!user || (!user.isTalentFilled && !user.currentSponsorId)) && (
                <>
                  <SponsorBanner />
                </>
              )}
            <TotalStats
              isTotalLoading={isTotalsLoading}
              bountyCount={totals?.count}
              TVE={totals?.totalInUSD}
            />
          </div>

          <HowItWorks />
          <RecentEarners earners={recentEarners} />
          <RecentActivity />
        </>
      ) : (
        <>
          <HowItWorks />
          <RecentEarners earners={recentEarners} />
        </>
      )}
    </div>
  );
};
