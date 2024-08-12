import { Box, Flex } from '@chakra-ui/react';
import axios from 'axios';
import { type ReactNode, useEffect, useState } from 'react';

import { type Listing, ListingCardMobile } from '@/features/listings';
import { dayjs } from '@/utils/dayjs';

export const LiveListings = ({ children }: { children: ReactNode }) => {
  const [listings, setListings] = useState<{ bounties: Listing[] }>({
    bounties: [],
  });
  const getListings = async () => {
    try {
      const listingData = await axios.get('/api/listings/', {
        params: {
          category: 'bounties',
          take: 5,
          isHomePage: true,
          deadline: dayjs().add(1, 'day').toISOString(),
          order: 'asc',
        },
      });

      setListings(listingData.data);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    getListings();
  }, []);
  return (
    <Box>
      {children}
      <Flex direction={'column'} w={'full'} mt={1}>
        {listings?.bounties?.slice(0, 5).map((listing) => {
          return <ListingCardMobile bounty={listing} key={listing?.id} />;
        })}
      </Flex>
    </Box>
  );
};
