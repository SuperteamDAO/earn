import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MdArrowForward } from 'react-icons/md';

import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useUser } from '@/store/user';

import { recentEarnersQuery } from '@/features/listings/queries/recent-earners';

import { totalsQuery } from '../queries/totals';
import { HowItWorks } from './HowItWorks';
import { RecentActivity } from './RecentActivity';
import { RecentEarners } from './RecentEarners';
import { SponsorBanner } from './SponsorBanner';
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
    <div className="flex w-96 flex-col gap-10 py-4 pl-6">
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
      {router.asPath === '/' &&
        (!user || (!user.isTalentFilled && !user.currentSponsorId)) && (
          <SponsorBanner />
        )}
      {type !== 'feed' ? (
        <>
          <TotalStats
            isTotalLoading={isTotalsLoading}
            bountyCount={totals?.count}
            TVE={totals?.totalInUSD}
          />
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
