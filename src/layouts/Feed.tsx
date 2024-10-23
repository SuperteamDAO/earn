import { Box, Flex, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import React from 'react';

import {
  AllPostsIcon,
  HomeIcon,
  LeaderboardIcon,
  WinnersIcon,
} from '@/features/feed';
import { Home } from '@/layouts/Home';

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

interface FeedPageProps {
  children: React.ReactNode;
  isHomePage?: boolean;
}

export const FeedPageLayout = ({
  children,
  isHomePage = false,
}: FeedPageProps) => {
  return (
    <Home type="feed">
      <Box
        mt={'-4'}
        mr={{ base: '-10px', lg: '-25px' }}
        ml={{ base: '-20px', lg: '0' }}
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
            {!isHomePage && (
              <NavItem name="All Posts" icon={AllPostsIcon} href="/feed" />
            )}
          </Flex>
          <Flex direction={'column'} w="100%">
            {children}
          </Flex>
        </Flex>
      </Box>
    </Home>
  );
};
