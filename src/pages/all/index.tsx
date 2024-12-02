import { useQuery } from '@tanstack/react-query';

import { HomepagePop } from '@/features/conversion-popups';
import { listingsQuery, ListingTabs } from '@/features/listings';
import { Home } from '@/layouts/Home';

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
          emoji="/assets/home/emojis/moneyman.webp"
          title="Freelance Gigs"
          viewAllLink="/all"
        />
      </div>
    </Home>
  );
}

export default AllListingsPage;
