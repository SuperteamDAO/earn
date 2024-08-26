import { Box, Flex } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { type ReactNode } from 'react';

import { GrantCardMobile, grantsQuery } from '@/features/grants';

export const LiveGrants = ({
  children,
  excludeIds: ids,
}: {
  children: ReactNode;
  excludeIds?: string[];
}) => {
  const { data: grants } = useQuery(
    grantsQuery({
      take: 5,
      order: 'asc',
      excludeIds: ids ? ids : undefined,
    }),
  );
  return (
    <Box>
      {children}
      <Flex direction={'column'} w={'full'} mt={1}>
        {grants?.slice(0, 5).map((grant) => {
          return <GrantCardMobile grant={grant} key={grant?.id} />;
        })}
      </Flex>
    </Box>
  );
};
