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

export default function ProjectsPage() {
  const deadline = useMemo(
    () => dayjs().subtract(2, 'months').toISOString(),
    [],
  );

  const { data: listings, isLoading } = useQuery(
    listingsQuery({
      take: 100,
      type: 'project',
      deadline,
    }),
  );

  return (
    <Home type="listing">
      <Meta
        title={`Apply to Projects in the Crypto Space | ${PROJECT_NAME}`}
        description={`Discover unique crypto projects seeking talent. Apply on ${PROJECT_NAME} and take your chance to work and earn in the crypto space.`}
        canonical={`${getURL()}/projects/`}
      />
      <HomepagePop />
      <div className="w-full">
        <ListingTabs
          bounties={listings}
          isListingsLoading={isLoading}
          showEmoji
          title="Projects"
          viewAllLink="/projects/all"
          showViewAll
          take={20}
        />
      </div>
    </Home>
  );
}
