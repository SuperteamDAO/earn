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
  const [listings, setListings] = useState<Listings>({ bounties: [] });
  const [userLocation, setUserLocation] = useState<string | null>(null);

  useEffect(() => {
    const { userInfo } = userStore.getState();
    const location = userInfo?.location;
    setUserLocation(location?.toLocaleUpperCase() || null);
  }, []);

  useEffect(() => {
    const getListings = async () => {
      setIsListingsLoading(true);
      try {
        const date = dayjs().subtract(2, 'months').toISOString();
        const listingsData = await axios.get('/api/listings/', {
          params: {
            category: 'bounties',
            take: 100,
            type: 'project',
            deadline: date,
            location: userLocation,
          },
        });
        setListings(listingsData.data);
      } catch (e) {
        console.error('Error fetching listings', e);
      } finally {
        setIsListingsLoading(false);
      }
    };

    getListings();
  }, [userLocation]);

  return (
    <Home type="home">
      <Meta
        title="Apply to Projects in the Crypto Space | Superteam Earn"
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
