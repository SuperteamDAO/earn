import { Box, Flex, Image, Select, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

import { type FeedPostType, useGetFeed } from '@/features/feed';
import { VibeCard } from '@/features/home';
import { FeedPageLayout } from '@/layouts/Feed';

import { FeedLoop } from './FeedLoop';

interface Props {
  type?: FeedPostType;
  id?: string;
  isWinner?: boolean;
}

export const Feed = ({ isWinner = false, id, type }: Props) => {
  const router = useRouter();
  const { query } = router;

  const [activeMenu, setActiveMenu] = useState<'new' | 'popular'>(
    (query.filter as 'new' | 'popular') || 'popular',
  );
  const [timePeriod, setTimePeriod] = useState('This Month');

  const { ref, inView } = useInView();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetFeed({
      filter: activeMenu,
      timePeriod:
        activeMenu === 'popular' ? timePeriod.toLowerCase() : undefined,
      isWinner,
      take: 15,
      highlightId: id,
      highlightType: type,
    });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  useEffect(() => {
    if (query.filter && query.filter !== activeMenu) {
      setActiveMenu(query.filter as 'new' | 'popular');
    }
  }, [query]);

  const updateQuery = (key: string, value: string) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...query, [key]: value },
      },
      undefined,
      { shallow: true },
    );
  };

  const MenuOption = ({ option }: { option: 'new' | 'popular' }) => {
    return (
      <Text
        color={activeMenu === option ? 'brand.slate.700' : 'brand.slate.500'}
        fontSize={{ base: '15px', lg: 'md' }}
        fontWeight={activeMenu === option ? 600 : 400}
        textTransform={'capitalize'}
        cursor="pointer"
        onClick={() => {
          setActiveMenu(option);
          updateQuery('filter', option);
        }}
      >
        {option}
      </Text>
    );
  };

  const feedItems = data?.pages.flatMap((page) => page) ?? [];

  return (
    <FeedPageLayout isHomePage>
      <Box py={5} pl={{ base: 6, md: 5 }} borderBottomWidth={'1px'}>
        <Text
          color="brand.slate.900"
          fontSize={{ base: 'lg', lg: 'xl' }}
          fontWeight={600}
        >
          Activity Feed
        </Text>
        <Box
          display={{ base: 'none', md: 'flex', lg: 'none' }}
          w="full"
          pt={4}
          pr={4}
        >
          <VibeCard />
        </Box>
        <Flex
          align={{ base: 'right', md: 'center' }}
          justify={'space-between'}
          direction={{ base: 'column', md: 'row' }}
          mt={2}
        >
          <Text color="brand.slate.600" fontSize={{ base: 'sm', lg: 'md' }}>
            Discover the best work on Earn
          </Text>
          <Box display={{ base: 'flex', md: 'none' }} w="full" pt={4} pr={4}>
            <VibeCard />
          </Box>
          <Flex
            align="center"
            justify={'space-between'}
            mt={{ base: 4, md: 0 }}
          >
            <Flex gap={3} mr={3}>
              <MenuOption option="new" />
              <MenuOption option="popular" />
            </Flex>

            {activeMenu === 'popular' && (
              <Select
                w={28}
                color={'brand.slate.500'}
                textAlign={'right'}
                onChange={(e) => {
                  setTimePeriod(e.target.value);
                }}
                size={'sm'}
                value={timePeriod}
                variant={'unstyled'}
              >
                <option>This Week</option>
                <option>This Month</option>
                <option>This Year</option>
              </Select>
            )}
          </Flex>
        </Flex>
      </Box>
      <Box pl={{ base: 1, md: 0 }}>
        <FeedLoop
          feed={feedItems}
          ref={ref}
          isFetchingNextPage={isFetchingNextPage}
          isLoading={isLoading}
        >
          <Box my={32}>
            <Image
              w={32}
              mx="auto"
              alt={'talent empty'}
              src="/assets/bg/talent-empty.svg"
            />
            <Text
              w="200px"
              mx="auto"
              mt={5}
              color={'brand.slate.500'}
              fontSize={{ base: 'md', md: 'lg' }}
              fontWeight={500}
              textAlign={'center'}
            >
              No Activity Found
            </Text>
            <Text
              mx="auto"
              mt={1}
              color={'brand.slate.400'}
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight={400}
              textAlign={'center'}
            >
              We couldn’t find any activity for your time filter
            </Text>
          </Box>
        </FeedLoop>
      </Box>
    </FeedPageLayout>
  );
};
