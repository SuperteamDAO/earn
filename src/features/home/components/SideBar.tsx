import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Flex, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { recentEarnersQuery } from '@/features/listings';
import { useUser } from '@/store/user';

import { totalsQuery } from '../queries';
import { HowItWorks } from './HowItWorks';
import { LiveListings } from './LiveListings';
import { RecentActivity } from './RecentActivity';
import { RecentEarners } from './RecentEarners';
import { SponsorBanner } from './SponsorBanner';
import { TotalStats } from './TotalStats';
import { VibeCard } from './VibeCard';

interface SideBarProps {
  type: 'landing' | 'listing' | 'category' | 'region' | 'niche' | 'feed';
}

export const HomeSideBar = ({ type }: SideBarProps) => {
  const router = useRouter();
  const { user } = useUser();

  const { data: totals, isLoading: isTotalsLoading } = useQuery(totalsQuery);
  const { data: recentEarners } = useQuery(recentEarnersQuery);

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
                查看全部
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
            isTotalLoading={isTotalsLoading}
            bountyCount={totals?.count}
            TVE={totals?.totalInUSD}
          />
          <HowItWorks />
          {/* <SidebarBanner /> */}
          <RecentEarners earners={recentEarners} />
          <RecentActivity />
        </>
      ) : (
        <>
          <HowItWorks />
          <RecentEarners earners={recentEarners} />
        </>
      )}
    </Flex>
  );
};
