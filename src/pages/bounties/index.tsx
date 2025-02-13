import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { PROJECT_NAME } from '@/constants/project';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { dayjs } from '@/utils/dayjs';
import { getURL } from '@/utils/validUrl';

import { HomepagePop } from '@/features/conversion-popups/components/HomepagePop';
import { ListingTabs } from '@/features/listings/components/ListingTabs';
import { listingsQuery } from '@/features/listings/queries/listings';

export default function BountiesPage() {
  const deadline = useMemo(
    () => dayjs().subtract(2, 'months').toISOString(),
    [],
  );
  const { data: listings, isLoading } = useQuery(
    listingsQuery({
      type: 'bounty',
      deadline,
      take: 100,
    }),
  );

  return (
    <Home type="listing">
      <Meta
        title={`${PROJECT_NAME} | Discover Bounties and Grants in Crypto for Design, Development, and Content`}
        description={`Explore the latest bounties on ${PROJECT_NAME}, offering opportunities in the crypto space across Design, Development, and Content.`}
        canonical={`${getURL()}/bounties/`}
      />
      <HomepagePop />
      <div className="w-full">
        <ListingTabs
          bounties={listings}
          isListingsLoading={isLoading}
          showEmoji
          title="Bounties"
          take={20}
          showViewAll
          viewAllLink="/bounties/all"
        />
      </div>
    </Home>
  );
}
