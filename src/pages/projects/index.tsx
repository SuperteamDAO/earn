import { Box } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { listingsQuery, ListingTabs } from '@/features/listings';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { dayjs } from '@/utils/dayjs';

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
        title="Apply to Projects in the Crypto Space | Solar Earn"
        description="Discover unique crypto projects seeking talent. Apply on Solar Earn and take your chance to work and earn in the crypto space."
        canonical=""
      />
      <Box w={'100%'}>
        <ListingTabs
          bounties={listings}
          isListingsLoading={isLoading}
          emoji=""
          title="定向任务"
          viewAllLink="/projects/all"
          showViewAll
          take={20}
        />
      </Box>
    </Home>
  );
}
