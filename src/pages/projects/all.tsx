import { Box } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { listingsQuery, ListingTabs } from '@/features/listings';
import { Home } from '@/layouts/Home';
import { dayjs } from '@/utils/dayjs';

export default function AllProjectsPage() {
  const deadline = useMemo(
    () => dayjs().subtract(2, 'months').toISOString(),
    [],
  );
  const { data: listings, isLoading } = useQuery(
    listingsQuery({
      type: 'project',
      deadline,
      take: 100,
    }),
  );

  return (
    <Home type="listing">
      <Box w={'100%'}>
        <ListingTabs
          bounties={listings}
          isListingsLoading={isLoading}
          emoji=""
          title="定向任务"
          viewAllLink="/projects/all"
          showViewAll={false}
        />
      </Box>
    </Home>
  );
}
