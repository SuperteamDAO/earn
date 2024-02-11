import { Box } from '@chakra-ui/react';
import axios from 'axios';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { BountyTabs } from '@/components/listings/bounty/Tabs';
import type { Bounty } from '@/interface/bounty';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';

interface Listings {
  bounties?: Bounty[];
}

function AllBountiesPage() {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listings, setListings] = useState<Listings>({
    bounties: [],
  });

  const date = dayjs().subtract(2, 'months').toISOString();

  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const listingsData = await axios.get('/api/listings/', {
        params: {
          category: 'bounties',
          take: 100,
          type: 'project',
          deadline: date,
        },
      });
      setListings(listingsData.data);
      setIsListingsLoading(false);
    } catch (e) {
      setIsListingsLoading(false);
    }
  };

  useEffect(() => {
    if (!isListingsLoading) return;
    getListings();
  }, []);

  return (
    <Home type="home">
      <Meta
        title="Superteam Earn | Apply to Projects in the Crypto Space"
        description="Discover unique crypto projects seeking talent. Apply on Superteam Earn and take your chance to work and earn in the crypto space."
        canonical="https://earn.superteam.fun/projects/"
      ></Meta>
      <Box w={'100%'}>
        <BountyTabs
          bounties={listings.bounties}
          isListingsLoading={isListingsLoading}
          emoji="/assets/home/emojis/moneyman.png"
          title="Projects"
        />
      </Box>
    </Home>
  );
}

export default AllBountiesPage;
