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

export default function BountiesPage() {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listings, setListings] = useState<Listings>({
    bounties: [],
  });
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
            type: 'bounty',
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
        title="Superteam Earn | Discover Bounties and Grants in Crypto for Design, Development, and Content"
        description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
        canonical="https://earn.superteam.fun/bounties/"
      />

      <Box w={'100%'}>
        <ListingTabs
          bounties={listings.bounties}
          isListingsLoading={isListingsLoading}
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
