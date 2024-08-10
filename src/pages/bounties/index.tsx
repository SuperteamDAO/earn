import { Box } from '@chakra-ui/react';
import { useMemo } from 'react';

import { ListingTabs, useGetListings } from '@/features/listings';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { dayjs } from '@/utils/dayjs';

export default function BountiesPage() {
  const deadline = useMemo(
    () => dayjs().subtract(2, 'months').toISOString(),
    [],
  );
  const { data: listings, isLoading } = useGetListings({
    type: 'bounty',
    deadline,
    take: 100,
  });

  return (
    <Home type="home">
      <Meta
        title="Superteam Earn | Discover Bounties and Grants in Crypto for Design, Development, and Content"
        description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
        canonical="https://earn.superteam.fun/bounties/"
      />
      <Box w={'100%'}>
        <ListingTabs
          bounties={listings}
          isListingsLoading={isLoading}
          emoji="/assets/home/emojis/moneyman.png"
          title="Bounties"
          take={20}
          showViewAll
          viewAllLink="/bounties/all"
        />
      </Box>
    </Home>
  );
}
