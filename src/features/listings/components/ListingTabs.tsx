import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, HStack, Image, Link, Text } from '@chakra-ui/react';
import dayjs from 'dayjs';
import NextLink from 'next/link';
import { useState } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';

import type { Bounty } from '../types';
import { ListingCard, ListingCardSkeleton } from './ListingCard';

interface TabProps {
  id: string;
  title: string;
  content: JSX.Element;
}

interface ListingTabsProps {
  isListingsLoading: boolean;
  bounties: Bounty[] | undefined;
  take?: number;
  emoji: string;
  title: string;
  viewAllLink?: string;
  showViewAll?: boolean;
  checkLanguage?: boolean;
}

interface ContentProps {
  bounties?: Bounty[];
  take?: number;
  isListingsLoading: boolean;
  filterFunction: (bounty: Bounty) => boolean;
  emptyTitle: string;
  emptyMessage: string;
  checkLanguage: boolean;
}

const generateTabContent = ({
  bounties,
  take,
  isListingsLoading,
  filterFunction,
  emptyTitle,
  emptyMessage,
  checkLanguage,
}: ContentProps) => (
  <Flex direction={'column'} rowGap={1}>
    {isListingsLoading ? (
      Array.from({ length: 8 }, (_, index) => (
        <ListingCardSkeleton key={index} />
      ))
    ) : bounties?.filter(filterFunction).length ? (
      bounties
        .filter(filterFunction)
        .slice(0, take)
        .map((bounty) => (
          <ListingCard
            key={bounty.id}
            bounty={bounty}
            checkLanguage={checkLanguage}
          />
        ))
    ) : (
      <Flex align="center" justify="center" mt={8}>
        <EmptySection title={emptyTitle} message={emptyMessage} />
      </Flex>
    )}
  </Flex>
);

export const ListingTabs = ({
  isListingsLoading,
  bounties,
  take,
  emoji,
  title,
  viewAllLink,
  showViewAll = false,
  checkLanguage = false,
}: ListingTabsProps) => {
  const tabs: TabProps[] = [
    {
      id: 'tab1',
      title: 'Open',
      content: generateTabContent({
        bounties: bounties,
        take,
        isListingsLoading,
        filterFunction: (bounty) =>
          bounty.status === 'OPEN' &&
          !dayjs().isAfter(bounty.deadline) &&
          !bounty.isWinnersAnnounced,
        emptyTitle: 'No listings available!',
        emptyMessage:
          'Subscribe to notifications to get notified about new listings.',
        checkLanguage,
      }),
    },
    {
      id: 'tab2',
      title: 'In Review',
      content: generateTabContent({
        bounties: bounties,
        take,
        isListingsLoading,
        filterFunction: (bounty) =>
          !bounty.isWinnersAnnounced &&
          dayjs().isAfter(bounty.deadline) &&
          bounty.status === 'OPEN',
        emptyTitle: 'No listings in review!',
        emptyMessage:
          'Subscribe to notifications to get notified about updates.',
        checkLanguage,
      }),
    },
    {
      id: 'tab3',
      title: 'Completed',
      content: generateTabContent({
        bounties: bounties,
        take,
        isListingsLoading,
        filterFunction: (bounty) =>
          bounty.status === 'CLOSED' ||
          ((bounty.isWinnersAnnounced || false) && bounty.status === 'OPEN'),
        emptyTitle: 'No completed listings!',
        emptyMessage:
          'Subscribe to notifications to get notified about announcements.',
        checkLanguage,
      }),
    },
  ];

  const [activeTab, setActiveTab] = useState<string>(tabs[0]!.id);

  return (
    <Box mt={5} mb={10}>
      <HStack
        align="center"
        justify="space-between"
        mb={4}
        pb={3}
        borderBottom="2px solid"
        borderBottomColor="#E2E8F0"
      >
        <Flex
          align={'center'}
          justify={{ base: 'space-between', sm: 'unset' }}
          w="100%"
        >
          <Flex align={'center'}>
            <Image
              display={{ base: 'none', xs: 'flex' }}
              w={5}
              h={5}
              mr={2}
              alt="emoji"
              src={emoji}
            />
            <Text
              pr={2}
              color={'#334155'}
              fontSize={['14', '15', '16', '16']}
              fontWeight={'600'}
              whiteSpace={'nowrap'}
            >
              {title}
            </Text>
          </Flex>
          <Flex align="center">
            <Text
              mx={{ base: 0, sm: 3 }}
              mr={3}
              color={'brand.slate.300'}
              fontSize="xx-small"
            >
              |
            </Text>
            {tabs.map((tab) => (
              <Box
                key={tab.id}
                sx={{
                  ...(tab.id === activeTab && {
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      right: 0,
                      bottom: '-13px',
                      left: 0,
                      height: '2px',
                      backgroundColor: '#6366f1',
                    },
                  }),
                }}
                pos="relative"
                p={{ base: 1, sm: 2 }}
                color={
                  tab.id === activeTab ? 'brand.slate.700' : 'brand.slate.500'
                }
                cursor="pointer"
                onClick={() => setActiveTab(tab.id)}
              >
                <Text
                  fontSize={['13', '13', '14', '14']}
                  fontWeight={500}
                  whiteSpace={'nowrap'}
                >
                  {tab.title}
                </Text>
              </Box>
            ))}
          </Flex>
        </Flex>
        {showViewAll && (
          <Flex display={{ base: 'none', sm: 'flex' }}>
            <Link as={NextLink} href={viewAllLink}>
              <Button
                px={2}
                py={1}
                color="brand.slate.400"
                fontSize={['x-small', 'sm', 'sm', 'sm']}
                size={{ base: 'x-small', md: 'sm' }}
                variant={'ghost'}
              >
                View All
              </Button>
            </Link>
          </Flex>
        )}
      </HStack>

      {tabs.map((tab) => tab.id === activeTab && tab.content)}

      {showViewAll && (
        <Link as={NextLink} href={viewAllLink}>
          <Button
            w="100%"
            my={8}
            py={5}
            color="brand.slate.400"
            borderColor="brand.slate.300"
            rightIcon={<ArrowForwardIcon />}
            size="sm"
            variant="outline"
          >
            View All
          </Button>
        </Link>
      )}
    </Box>
  );
};
