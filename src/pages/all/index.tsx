import { Box } from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

import { type Listing, ListingTabs } from '@/features/listings';
import { Home } from '@/layouts/Home';
import { userStore } from '@/store/user';

interface Listings {
  bounties?: Listing[];
}

function AllListingsPage() {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listings, setListings] = useState<Listings>({
    bounties: [],
  });

  const { userInfo } = userStore();

  const userLocation = userInfo?.location;

  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const listingsData = await axios.get('/api/listings/', {
        params: {
          category: 'bounties',
          take: 100,
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
      <Box w={'100%'}>
        <ListingTabs
          bounties={listings.bounties}
          isListingsLoading={isListingsLoading}
          emoji="/assets/home/emojis/moneyman.png"
          title="Freelance Gigs"
          viewAllLink="/all"
          checkLanguage
        />
      </Box>
    </Home>
  );
}

export default AllListingsPage;
