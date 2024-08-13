import { Box, Flex } from '@chakra-ui/react';
import { type ReactNode, useMemo } from 'react';

import { ListingCardMobile, useGetListings } from '@/features/listings';
import { dayjs } from '@/utils/dayjs';

export const LiveListings = ({ children }: { children: ReactNode }) => {
  const deadline = useMemo(() => dayjs().add(1, 'day').toISOString(), []);

  const { data: listings } = useGetListings({
    take: 5,
    isHomePage: true,
    deadline,
    order: 'asc',
  });
  return (
    <Box>
      {children}
      <Flex direction={'column'} w={'full'} mt={1}>
        {listings?.slice(0, 5).map((listing) => {
          return <ListingCardMobile bounty={listing} key={listing?.id} />;
        })}
      </Flex>
    </Box>
  );
};
