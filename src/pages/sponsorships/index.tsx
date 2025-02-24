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

export default function SponsorshipsPage() {
  const deadline = useMemo(
    () => dayjs().subtract(2, 'months').toISOString(),
    [],
  );
  const { data: listings, isLoading } = useQuery(
    listingsQuery({
      type: 'sponsorship',
      deadline,
      take: 100,
    }),
  );

  return (
    <Home type="listing">
      <Meta
        title={`${PROJECT_NAME} | Discover Sponsorships in Crypto`}
        description={`Explore the latest sponsorships on ${PROJECT_NAME}, offering opportunities in the crypto space across Design, Development, and Content.`}
        canonical={`${getURL()}/sponsorships/`}
      />
      <HomepagePop />
      <div className="w-full">
        <ListingTabs
          bounties={listings}
          isListingsLoading={isLoading}
          showEmoji
          title="Sponsorships"
          take={20}
          showViewAll
          viewAllLink="/sponsorships/all"
        />
      </div>
    </Home>
  );
}
