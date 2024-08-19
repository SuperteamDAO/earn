import { Box, Flex } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useMemo } from 'react';

import { ListingCardMobile, listingsQuery } from '@/features/listings';
import { dayjs } from '@/utils/dayjs';

interface LiveListingProps {
  children: ReactNode;
  isHackathon?: boolean;
}

export const LiveListings = ({
  children,
  isHackathon = false,
}: LiveListingProps) => {
  const deadline = useMemo(() => dayjs().add(1, 'day').toISOString(), []);

  const { data: listings } = useQuery(
    listingsQuery({
      take: 5,
      isHomePage: true,
      deadline,
      order: 'asc',
      type: isHackathon ? 'hackathon' : undefined,
    }),
  );
  return (
    <Box>
      {children}
      <Flex direction={'column'} w={'full'} mt={1}>
        {listings?.map((listing) => {
          return <ListingCardMobile bounty={listing} key={listing?.id} />;
        })}
      </Flex>
    </Box>
  );
};
