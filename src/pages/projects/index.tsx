import { Box } from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

import { type Listing, ListingTabs } from '@/features/listings';
import { Home } from '@/layouts/Home';
import { Meta } from '@/layouts/Meta';
import { userStore } from '@/store/user';
import { dayjs } from '@/utils/dayjs';

interface Listings {
  bounties?: Listing[];
}

export default function ProjectsPage() {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listings, setListings] = useState<Listings>({
    bounties: [],
  });

  const date = dayjs().subtract(2, 'months').toISOString();

  const { userInfo } = userStore();
  const userLocation = userInfo?.location;

  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const listingsData = await axios.get('/api/listings/', {
        params: {
          category: 'bounties',
          take: 100,
          type: 'project',
          deadline: date,
          userLocation: userLocation?.toLocaleUpperCase(),
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
      />
      <Box w={'100%'}>
        <ListingTabs
          bounties={listings.bounties}
          isListingsLoading={isListingsLoading}
          emoji="/assets/home/emojis/moneyman.png"
          title="Projects"
          viewAllLink="/projects/all"
          showViewAll
          take={20}
        />
      </Box>
    </Home>
  );
}
