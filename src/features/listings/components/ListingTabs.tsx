import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, HStack, Image, Link, Text } from '@chakra-ui/react';
import dayjs from 'dayjs';
import NextLink from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';

import { type Bounty } from '../types';
import { ListingCard, ListingCardSkeleton } from './ListingCard';

interface TabProps {
  id: string;
  title: string;
  content: JSX.Element;
  posthog: string;
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
  sortCompareFunction?: ((a: Bounty, b: Bounty) => number) | undefined;
  emptyTitle: string;
  emptyMessage: string;
  checkLanguage: boolean;
}

const generateTabContent = ({
  bounties,
  take,
  isListingsLoading,
  filterFunction,
  sortCompareFunction,
  emptyTitle,
  emptyMessage,
  checkLanguage,
}: ContentProps) => (
  <Flex className="ph-no-capture" direction={'column'} rowGap={1}>
    {isListingsLoading ? (
      Array.from({ length: 8 }, (_, index) => (
        <ListingCardSkeleton key={index} />
      ))
    ) : bounties?.filter(filterFunction).length ? (
      bounties
        .filter(filterFunction)
        .sort(sortCompareFunction ? sortCompareFunction : () => 0)
        .slice(0, take ? take + 1 : undefined)
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
      posthog: 'open_listings',
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
      posthog: 'in review_listing',
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
      posthog: 'completed_listing',
      content: generateTabContent({
        bounties: bounties,
        take,
        isListingsLoading,
        filterFunction: (bounty) => bounty.isWinnersAnnounced || false,
        sortCompareFunction: (a, b) => {
          const dateA = a.winnersAnnouncedAt
            ? new Date(a.winnersAnnouncedAt)
            : a.deadline
              ? new Date(a.deadline)
              : null;
          const dateB = b.winnersAnnouncedAt
            ? new Date(b.winnersAnnouncedAt)
            : b.deadline
              ? new Date(b.deadline)
              : null;

          if (dateA === null && dateB === null) {
            return 0;
          }
          if (dateB === null) {
            return 1;
          }
          if (dateA === null) {
            return -1;
          }

          return dateB.getTime() - dateA.getTime();
        },
        emptyTitle: 'No completed listings!',
        emptyMessage:
          'Subscribe to notifications to get notified about announcements.',
        checkLanguage,
      }),
    },
  ];

  const [activeTab, setActiveTab] = useState<string>(tabs[0]!.id);
  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture('open_listings');
  }, []);

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
                className="ph-no-capture"
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
                onClick={() => {
                  posthog.capture(tab.posthog);
                  setActiveTab(tab.id);
                }}
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
          <Flex
            className="ph-no-capture"
            display={{ base: 'none', sm: 'flex' }}
          >
            <Link as={NextLink} href={viewAllLink}>
              <Button
                px={2}
                py={1}
                color="brand.slate.400"
                fontSize={['x-small', 'sm', 'sm', 'sm']}
                onClick={() => posthog.capture('viewall top_listngs')}
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
        <Link className="ph-no-capture" as={NextLink} href={viewAllLink}>
          <Button
            w="100%"
            my={8}
            py={5}
            color="brand.slate.400"
            borderColor="brand.slate.300"
            onClick={() => posthog.capture('viewall bottom_listings')}
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
