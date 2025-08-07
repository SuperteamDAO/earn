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
          title="定向任务"
          sub="开启您的定向任务之旅"
          emoji=""
        >
          {isLoading &&
            Array.from({ length: 8 }, (_, index) => (
              <ListingCardSkeleton key={index} />
            ))}
          {!isLoading && !listings?.length && (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="暂无可用任务!"
                message="更新您的电子邮件偏好设置（从用户菜单），以便接收关于新任务的通知"
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
