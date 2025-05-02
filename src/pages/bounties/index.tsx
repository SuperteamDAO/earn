import { useQuery } from '@tanstack/react-query';

import { Home } from '@/layouts/Home';

import { ListingTabs } from '@/features/listings/components/ListingTabs';
import { listingsQuery } from '@/features/listings/queries/listings';

export default function AllBountiesPage() {
  const { data: listings, isLoading } = useQuery(
    listingsQuery({
      type: 'bounty',
      take: 2000,
    }),
  );

  return (
    <Home type="listing">
      <div className="w-full">
        <ListingTabs
          bounties={listings}
          isListingsLoading={isLoading}
          title="All Bounties"
          viewAllLink="/bounties"
        />
      </div>
    </Home>
  );
}
