import { useQuery } from '@tanstack/react-query';

import { Home } from '@/layouts/Home';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { ListingTabs } from '@/features/listings/components/ListingTabs';
import { listingsQuery } from '@/features/listings/queries/listings';

function AllListingsPage() {
  const { data: listings, isLoading } = useQuery(
    listingsQuery({
      take: 500,
    }),
  );

  return (
    <Home type="listing">
      <HomepagePop />
      <div className="w-full">
        <ListingTabs
          bounties={listings}
          isListingsLoading={isLoading}
          showEmoji
          title="Freelance Gigs"
          viewAllLink="/all"
        />
      </div>
    </Home>
  );
}

export default AllListingsPage;
