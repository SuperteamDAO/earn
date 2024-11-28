import { ArrowForwardIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, HStack, Image, Link, Text } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { Tooltip } from '@/components/shared/responsive-tooltip';
import { type User } from '@/interface/user';
import { useUser } from '@/store/user';
import { dayjs } from '@/utils/dayjs';

import { type Listing } from '../types';
import { ListingCard, ListingCardSkeleton } from './ListingCard';

interface TabProps {
  id: string;
  title: string;
  content: JSX.Element;
  posthog: string;
}
interface ListingTabsProps {
  isListingsLoading: boolean;
  bounties: Listing[] | undefined;
  forYou?: Listing[] | undefined;
  take?: number;
  emoji?: string;
  title: string;
  viewAllLink?: string;
  showViewAll?: boolean;
  showNotifSub?: boolean;
}

interface ContentProps {
  title: string;
  bounties?: Listing[];
  forYou?: Listing[];
  take?: number;
  isListingsLoading: boolean;
  filterFunction: (bounty: Listing) => boolean;
  sortCompareFunction?: ((a: Listing, b: Listing) => number) | undefined;
  emptyTitle: string;
  emptyMessage: string;
  user: User | null;
  showNotifSub?: boolean;
}

const EmptySection = dynamic(
  () =>
    import('@/components/shared/EmptySection').then((mod) => mod.EmptySection),
  { ssr: false },
);

const generateTabContent = ({
  title,
  bounties,
  forYou,
  take,
  isListingsLoading,
  filterFunction,
  sortCompareFunction,
  emptyTitle,
  emptyMessage,
  user,
  showNotifSub,
}: ContentProps) => {
  if (!!(!user || !forYou || forYou.length === 0))
    return (
      <Flex className="ph-no-capture" direction={'column'} rowGap={1}>
        {isListingsLoading ? (
          Array.from({ length: 8 }, (_, index) => (
            <ListingCardSkeleton key={index} />
          ))
        ) : !!bounties?.filter(filterFunction).length ? (
          bounties
            .filter(filterFunction)
            .sort(sortCompareFunction ? sortCompareFunction : () => 0)
            .slice(0, take ? take + 1 : undefined)
            .map((bounty) => <ListingCard key={bounty.id} bounty={bounty} />)
        ) : (
          <Flex align="center" justify="center" mt={8}>
            <EmptySection
              showNotifSub={showNotifSub}
              title={emptyTitle}
              message={emptyMessage}
            />
          </Flex>
        )}
      </Flex>
    );
  return (
    <Box>
      {!!forYou?.filter(filterFunction).length && (
        <Box
          mb={4}
          pb={4}
          borderColor="brand.slate.200"
          borderBottomWidth={'1px'}
        >
          <Flex
            align="center"
            gap={3}
            w="fit-content"
            mb={2}
            color="gray.900"
            fontWeight={600}
          >
            <Text flex={1}>为您推荐</Text>
            <Box color="gray.500">
              <Tooltip
                label={`List of top opportunities curated for you, based on your skills, listing subscriptions and location.`}
              >
                <InfoOutlineIcon w={3} h={3} />
              </Tooltip>
            </Box>
          </Flex>
          <Flex className="ph-no-capture" direction={'column'} rowGap={1}>
            {isListingsLoading
              ? Array.from({ length: 8 }, (_, index) => (
                <ListingCardSkeleton key={index} />
              ))
              : forYou
                .filter(filterFunction)
                .sort(sortCompareFunction ? sortCompareFunction : () => 0)
                .slice(0, take ? take + 1 : undefined)
                .map((bounty) => (
                  <ListingCard key={bounty.id} bounty={bounty} />
                ))}
          </Flex>
        </Box>
      )}
      <Box>
        <Text mb={2} color="gray.900" fontWeight={600}>
          所有{title}
        </Text>
        <Flex className="ph-no-capture" direction={'column'} rowGap={1}>
          {isListingsLoading ? (
            Array.from({ length: 8 }, (_, index) => (
              <ListingCardSkeleton key={index} />
            ))
          ) : !!bounties?.filter(filterFunction).length ? (
            bounties
              .filter(filterFunction)
              .sort(sortCompareFunction ? sortCompareFunction : () => 0)
              .slice(0, take ? take + 1 : undefined)
              .map((bounty) => <ListingCard key={bounty.id} bounty={bounty} />)
          ) : (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                showNotifSub={showNotifSub}
                title={emptyTitle}
                message={emptyMessage}
              />
            </Flex>
          )}
        </Flex>
      </Box>
    </Box>
  );
};

export const ListingTabs = ({
  isListingsLoading,
  bounties,
  forYou,
  take,
  emoji,
  title,
  viewAllLink,
  showViewAll = false,
  showNotifSub = true,
}: ListingTabsProps) => {
  const { user } = useUser();
  const tabs: TabProps[] = [
    {
      id: 'tab1',
      title: '进行中',
      posthog: 'open_listings',
      content: generateTabContent({
        user,
        title: '进行中',
        bounties: bounties,
        forYou: forYou,
        take,
        isListingsLoading,
        filterFunction: (bounty) =>
          bounty.status === 'OPEN' &&
          !dayjs().isAfter(bounty.deadline) &&
          !bounty.isWinnersAnnounced,
        emptyTitle: '暂无可用机会！',
        emptyMessage:
          '更新您的电子邮件偏好设置（从用户菜单）以接收新的工作机会通知。',
        showNotifSub,
      }),
    },
    {
      id: 'tab2',
      title: '审核中',
      posthog: 'in review_listing',
      content: generateTabContent({
        user,
        title: '审核中',
        bounties: bounties,
        forYou: forYou,
        take,
        isListingsLoading,
        filterFunction: (bounty) =>
          !bounty.isWinnersAnnounced &&
          dayjs().isAfter(bounty.deadline) &&
          bounty.status === 'OPEN',
        emptyTitle: '暂无审核中的任务！',
        emptyMessage: '订阅通知以获取更新信息。',
        showNotifSub,
      }),
    },
    {
      id: 'tab3',
      title: '已完成',
      posthog: 'completed_listing',
      content: generateTabContent({
        user,
        title: '已完成',
        bounties: bounties,
        forYou: forYou,
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
        emptyTitle: '暂无已完成的任务！',
        emptyMessage: '订阅通知以获取信息。',
        showNotifSub,
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
            {emoji && (
              <Image
                display={{ base: 'none', xs: 'flex' }}
                w={5}
                h={5}
                mr={2}
                alt="emoji"
                src={emoji}
              />
            )}
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
                查看全部
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
            查看全部
          </Button>
        </Link>
      )}
    </Box>
  );
};
