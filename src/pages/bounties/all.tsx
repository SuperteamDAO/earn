import { Box, Flex } from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import {
  type Bounty,
  ListingCard,
  ListingCardSkeleton,
  ListingSection,
} from '@/features/listings';
import { Home } from '@/layouts/Home';

interface Listings {
  bounties?: Bounty[];
}

export default function AllBountiesPage() {
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [listings, setListings] = useState<Listings>({
    bounties: [],
  });

  const getListings = async () => {
    setIsListingsLoading(true);
    try {
      const listingsData = await axios.get('/api/listings/', {
        params: {
          category: 'bounties',
          type: 'bounty',
          take: 100,
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
      <Box w={'100%'} pr={{ base: 0, lg: 6 }}>
        <ListingSection
          type="bounties"
          title="All Bounties"
          sub="Bite sized tasks for freelancers"
          emoji="/assets/home/emojis/moneyman.png"
        >
          {isListingsLoading &&
            Array.from({ length: 8 }, (_, index) => (
              <ListingCardSkeleton key={index} />
            ))}
          {!isListingsLoading && !listings?.bounties?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No listings available!"
                message="Subscribe to notifications to get notified about new listings."
              />
            </Flex>
          )}
          {!isListingsLoading &&
            listings?.bounties?.map((bounty) => {
              return <ListingCard key={bounty.id} bounty={bounty} />;
            })}
        </ListingSection>
      </Box>
    </Home>
  );
}
