/* eslint-disable no-nested-ternary */
import { Flex } from '@chakra-ui/react';
import dayjs from 'dayjs';

import {
  BountiesCard,
  ListingsCardSkeleton,
} from '@/components/misc/listingsCard';
import { EmptySection } from '@/components/shared/EmptySection';
import type { Bounty } from '@/interface/bounty';

interface TabProps {
  id: string;
  title: string;
  content: JSX.Element;
}

interface BountyTabsProps {
  isListingsLoading: boolean;
  bounties: { bounties: Bounty[] };
  take?: number;
}

export const BountyTabs = ({
  isListingsLoading,
  bounties,
  take = 10,
}: BountyTabsProps) => {
  const tabs: TabProps[] = [
    {
      id: 'tab1',
      title: 'OPEN',
      content: (
        <Flex direction={'column'} rowGap={1}>
          {isListingsLoading ? (
            Array.from({ length: 8 }, (_, index) => (
              <ListingsCardSkeleton key={index} />
            ))
          ) : bounties?.bounties?.filter(
              (bounty) =>
                bounty.status === 'OPEN' &&
                !dayjs().isAfter(bounty.deadline) &&
                !bounty.isWinnersAnnounced,
            ).length ? (
            bounties.bounties
              .filter(
                (bounty) =>
                  bounty.status === 'OPEN' &&
                  !dayjs().isAfter(bounty.deadline) &&
                  !bounty.isWinnersAnnounced,
              )
              .slice(0, take)
              .map((bounty) => (
                <BountiesCard
                  slug={bounty.slug}
                  rewardAmount={bounty?.rewardAmount}
                  key={bounty?.id}
                  sponsorName={bounty?.sponsor?.name}
                  deadline={bounty?.deadline}
                  title={bounty?.title}
                  logo={bounty?.sponsor?.logo}
                  token={bounty?.token}
                  type={bounty?.type}
                  applicationType={bounty.applicationType}
                  hasTabs
                  isWinnersAnnounced={bounty.isWinnersAnnounced}
                />
              ))
          ) : (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No listings available!"
                message="Subscribe to notifications to get notified about new bounties."
              />
            </Flex>
          )}
        </Flex>
      ),
    },
    {
      id: 'tab2',
      title: 'IN REVIEW',
      content: (
        <Flex direction={'column'} rowGap={'1'}>
          {isListingsLoading ? (
            Array.from({ length: 8 }, (_, index) => (
              <ListingsCardSkeleton key={index} />
            ))
          ) : bounties?.bounties?.filter(
              (bounty) =>
                !bounty.isWinnersAnnounced &&
                dayjs().isAfter(bounty.deadline) &&
                bounty.status === 'OPEN',
            ).length ? (
            bounties.bounties
              .filter(
                (bounty) =>
                  !bounty.isWinnersAnnounced &&
                  dayjs().isAfter(bounty.deadline) &&
                  bounty.status === 'OPEN',
              )
              .slice(0, 10)
              .map((bounty) => (
                <BountiesCard
                  slug={bounty.slug}
                  rewardAmount={bounty?.rewardAmount}
                  key={bounty?.id}
                  sponsorName={bounty?.sponsor?.name}
                  deadline={bounty?.deadline}
                  title={bounty?.title}
                  logo={bounty?.sponsor?.logo}
                  token={bounty?.token}
                  type={bounty?.type}
                  applicationType={bounty.applicationType}
                  isWinnersAnnounced={bounty?.isWinnersAnnounced}
                  hasTabs
                />
              ))
          ) : (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No listings in review!"
                message="Subscribe to notifications to get notified about updates."
              />
            </Flex>
          )}
        </Flex>
      ),
    },
    {
      id: 'tab3',
      title: 'COMPLETED',
      content: (
        <Flex direction={'column'} rowGap={'1'}>
          {isListingsLoading ? (
            Array.from({ length: 8 }, (_, index) => (
              <ListingsCardSkeleton key={index} />
            ))
          ) : bounties?.bounties?.filter(
              (bounty) =>
                bounty.status === 'CLOSED' ||
                (bounty.isWinnersAnnounced && bounty.status === 'OPEN'),
            ).length ? (
            bounties.bounties
              .filter(
                (bounty) =>
                  bounty.status === 'CLOSED' ||
                  (bounty.isWinnersAnnounced && bounty.status === 'OPEN'),
              )
              .slice(0, 10)
              .map((bounty) => (
                <BountiesCard
                  slug={bounty.slug}
                  rewardAmount={bounty?.rewardAmount}
                  key={bounty?.id}
                  sponsorName={bounty?.sponsor?.name}
                  deadline={bounty?.deadline}
                  title={bounty?.title}
                  logo={bounty?.sponsor?.logo}
                  token={bounty?.token}
                  type={bounty?.type}
                  applicationType={bounty.applicationType}
                  isWinnersAnnounced={bounty?.isWinnersAnnounced}
                  hasTabs
                />
              ))
          ) : (
            <Flex align="center" justify="center" mt={8}>
              <EmptySection
                title="No listings announced!"
                message="Subscribe to notifications to get notified about announcements."
              />
            </Flex>
          )}
        </Flex>
      ),
    },
  ];
  return tabs;
};
