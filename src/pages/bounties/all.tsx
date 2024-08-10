import { Box, Flex } from '@chakra-ui/react';

import { EmptySection } from '@/components/shared/EmptySection';
import {
  ListingCard,
  ListingCardSkeleton,
  ListingSection,
  useGetListings,
} from '@/features/listings';
import { Home } from '@/layouts/Home';

export default function AllBountiesPage() {
  const { data: listings, isLoading } = useGetListings({
    type: 'bounty',
    take: 100,
  });

  return (
    <Home type="home">
      <Box w={'100%'} pr={{ base: 0, lg: 6 }}>
        <ListingSection
          type="bounties"
          title="All Bounties"
          sub="Bite sized tasks for freelancers"
          emoji="/assets/home/emojis/moneyman.png"
        >
          {isLoading &&
            Array.from({ length: 8 }, (_, index) => (
              <ListingCardSkeleton key={index} />
            ))}
          {!isLoading && !listings?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No listings available!"
                message="Subscribe to notifications to get notified about new listings."
              />
            </Flex>
          )}
          {!isLoading &&
            listings?.map((bounty) => (
              <ListingCard key={bounty.id} bounty={bounty} />
            ))}
        </ListingSection>
      </Box>
    </Home>
  );
}
