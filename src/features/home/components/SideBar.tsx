import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Flex, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import type { User } from '@/interface/user';
import { useUser } from '@/store/user';

import { HowItWorks } from './HowItWorks';
import { LiveListings } from './LiveListings';
import { RecentActivity } from './RecentActivity';
import { RecentEarners } from './RecentEarners';
import { SidebarBanner } from './SidebarBanner';
import { SponsorBanner } from './SponsorBanner';
import { TotalStats } from './TotalStats';
import { VibeCard } from './VibeCard';

interface SideBarProps {
  total: number;
  listings: number;
  earners?: User[];
  isTotalLoading: boolean;
  type: 'home' | 'category' | 'region' | 'niche' | 'feed';
}

export const HomeSideBar = ({
  type,
  listings,
  total,
  earners,
  isTotalLoading,
}: SideBarProps) => {
  const router = useRouter();
  const { user } = useUser();
  return (
    <Flex direction={'column'} rowGap={'2.5rem'} w={'24rem'} py={6} pl={6}>
      {type === 'feed' && (
        <>
          <VibeCard />
          <LiveListings>
            <Flex align="center" justify={'space-between'}>
              <Text color={'gray.400'} fontSize={'sm'} fontWeight={500}>
                LIVE LISTINGS
              </Text>
              <Text
                as={NextLink}
                color="brand.purple"
                fontSize="xs"
                fontWeight={600}
                href="/"
              >
                View All
                <ArrowForwardIcon ml={1} />
              </Text>
            </Flex>
          </LiveListings>
        </>
      )}
      {router.asPath === '/' &&
        (!user || (!user.isTalentFilled && !user.currentSponsorId)) && (
          <SponsorBanner />
        )}
      {type !== 'feed' ? (
        <>
          <TotalStats
            isTotalLoading={isTotalLoading}
            bountyCount={listings}
            TVE={total}
          />
          <HowItWorks />
          <SidebarBanner />
          <RecentEarners earners={earners} />
          <RecentActivity />
        </>
      ) : (
        <>
          <HowItWorks />
          <RecentEarners earners={earners} />
        </>
      )}
    </Flex>
  );
};
