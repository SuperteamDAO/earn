import { Box, Flex, Image, Select, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

import {
  FeedCardContainerSkeleton,
  PowCard,
  SubmissionCard,
  useGetFeed,
} from '@/features/feed';
import { Home } from '@/layouts/Home';

import { GrantCard } from './grantCard';
import { HomeIcon, LeaderboardIcon, WinnersIcon } from './icons';

export const Feed = ({ isWinner = false }: { isWinner?: boolean }) => {
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

  const NavItem = ({
    name,
    icon: Icon,
    href,
  }: {
    name: string;
    icon: any;
    href: string;
  }) => {
    return (
      <Flex as={NextLink} align="center" href={href}>
        <Flex align="center" justify="center" w={9}>
          <Icon />
        </Flex>
        <Text mt={1} color="brand.slate.500" fontWeight={500}>
          {name}
        </Text>
      </Flex>
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
    <Home type="feed">
      <Box
        mt={'-4'}
        mr={{ base: '-3', lg: '-25px' }}
        ml={{ base: '-25px', lg: '0' }}
        borderColor={'brand.slate.200'}
        borderRightWidth={'1px'}
      >
        <Flex>
          <Flex
            pos="sticky"
            top={14}
            direction={'column'}
            gap={3}
            display={{
              base: 'none',
              lg: 'flex',
            }}
            w={48}
            h={'100vh'}
            pt={5}
            pr={5}
            borderRightWidth={'1px'}
          >
            <NavItem name="Homepage" icon={HomeIcon} href="/" />
            <NavItem
              name="Leaderboard"
              icon={LeaderboardIcon}
              href="/leaderboard"
            />
            <NavItem name="Winners" icon={WinnersIcon} href="/feed/winners" />
          </Flex>
          <Flex direction={'column'} w="100%">
            <Box py={5} pl={{ base: 6, md: 5 }} borderBottomWidth={'1px'}>
              <Text
                color="brand.slate.900"
                fontSize={{ base: 'lg', lg: 'xl' }}
                fontWeight={600}
              >
                Activity Feed
              </Text>
              <Flex
                align={{ base: 'right', md: 'center' }}
                justify={'space-between'}
                direction={{ base: 'column', md: 'row' }}
                mt={2}
              >
                <Text
                  color="brand.slate.600"
                  fontSize={{ base: 'sm', lg: 'md' }}
                >
                  Discover the best work on Earn
                </Text>
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
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <FeedCardContainerSkeleton key={index} />
                ))
              ) : feedItems.length > 0 ? (
                <>
                  {feedItems.map((item, index) => {
                    switch (item.type) {
                      case 'Submission':
                        return (
                          <SubmissionCard
                            key={index}
                            sub={item as any}
                            type="activity"
                          />
                        );
                      case 'PoW':
                        return (
                          <PowCard
                            key={index}
                            pow={item as any}
                            type="activity"
                          />
                        );
                      case 'Grant':
                        return (
                          <GrantCard
                            type="activity"
                            grant={item as any}
                            key={index}
                          />
                        );
                      default:
                        return null;
                    }
                  })}
                  {isFetchingNextPage && <FeedCardContainerSkeleton />}
                  <div ref={ref} style={{ height: '10px' }} />
                </>
              ) : (
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
              )}
            </Box>
          </Flex>
        </Flex>
      </Box>
    </Home>
  );
};
