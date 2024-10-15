import { Box, Flex } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';

import { EmptySection } from '@/components/shared/EmptySection';
import {
  ListingCard,
  ListingCardSkeleton,
  ListingSection,
  listingsQuery,
} from '@/features/listings';
import { Home } from '@/layouts/Home';

export default function AllProjectsPage() {
  const { data: listings, isLoading } = useQuery(
    listingsQuery({
      type: 'project',
      take: 100,
    }),
  );

  return (
    <Home type="listing">
      <Box w={'100%'}>
        <ListingSection
          type="bounties"
          title="All Projects"
          sub="Bite sized tasks for freelancers"
          emoji="/assets/home/emojis/moneyman.webp"
        >
          {isLoading &&
            Array.from({ length: 8 }, (_, index) => (
              <ListingCardSkeleton key={index} />
            ))}
          {!isLoading && !listings?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No listings available!"
                message="Update your email preferences (from the user menu) to be notified about new work opportunities."
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
