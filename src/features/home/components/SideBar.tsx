import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Box, Flex, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';

import { OgImageViewer } from '@/components/misc/ogImageViewer';
import { useGetFeed } from '@/features/feed';
import type { User } from '@/interface/user';
import { useUser } from '@/store/user';
import { timeAgoShort } from '@/utils/timeAgo';

import { HowItWorks } from './HowItWorks';
import { LiveListings } from './LiveListings';
import { RecentEarners } from './RecentEarners';
import { SponsorBanner } from './SponsorBanner';
import { TotalStats } from './TotalStats';
import { VibeCard } from './VibeCard';

interface SideBarProps {
  total: number;
  listings: number;
  earners?: User[];
  isTotalLoading: boolean;
  type: 'landing' | 'listing' | 'category' | 'region' | 'niche' | 'feed';
}

interface ActivityCardProps {
  firstName: string;
  lastName: string;
  username: string;
  createdAt: string;
  link: string;
  listingType: 'bounty' | 'hackathon' | 'project';
  isWinner: boolean;
  isWinnersAnnounced: boolean;
  type: string;
  ogImage: string;
}

const RecentActivity = () => {
  const posthog = usePostHog();

  const { data } = useGetFeed({ take: 5 });

  const activity = data?.pages[0] ?? [];

  const ActivityCard = ({
    firstName,
    lastName,
    username,
    createdAt,
    link,
    listingType,
    isWinner,
    isWinnersAnnounced,
    type,
    ogImage,
  }: ActivityCardProps) => {
    const getActionText = () => {
      const defaultActionText = {
        bounty: 'just submitted a bounty',
        hackathon: 'just submitted to a hackathon',
        project: 'just applied to a project',
      };

      const winnerActionText = {
        bounty: 'just won a bounty',
        hackathon: 'just won a hackathon track',
        project: 'just got selected for a project',
      };

      if (type === 'PoW') {
        return 'just added a personal project';
      } else if (isWinner && isWinnersAnnounced) {
        return winnerActionText[listingType] || 'just achieved something great';
      } else {
        return defaultActionText[listingType] || 'just took an action';
      }
    };

    const actionText = getActionText();

    return (
      <Flex as={NextLink} href={'/feed/?filter=new'}>
        <OgImageViewer
          h={12}
          w={20}
          objectFit={'cover'}
          externalUrl={link}
          imageUrl={ogImage}
        />
        <Box ml={3}>
          <Flex align={'center'}>
            <Text
              overflow={'hidden'}
              maxW={32}
              mr={1.5}
              color={'brand.slate.800'}
              fontSize={'0.9rem'}
              fontWeight={600}
              whiteSpace={'nowrap'}
              textOverflow={'ellipsis'}
            >
              {firstName} {lastName}
            </Text>
            <Text
              overflow={'hidden'}
              maxW={'5.7rem'}
              color={'brand.slate.400'}
              fontSize={'sm'}
              fontWeight={500}
              whiteSpace={'nowrap'}
              textOverflow={'ellipsis'}
            >
              @{username}
            </Text>
            <Text mx={1} color="brand.slate.400" fontSize={'xs'}>
              •
            </Text>
            <Text color={'brand.slate.400'} fontSize={'xs'}>
              {timeAgoShort(createdAt)}
            </Text>
          </Flex>
          <Text color={'brand.slate.600'} fontSize={'sm'} fontWeight={500}>
            {actionText}
          </Text>
        </Box>
      </Flex>
    );
  };
  return (
    <Box>
      <Flex align="center" justify={'space-between'}>
        <Text color={'gray.400'} fontSize={'sm'} fontWeight={500}>
          RECENT ACTIVITY
        </Text>
        <Text
          className="ph-no-capture"
          as={NextLink}
          color="brand.purple"
          fontSize="xs"
          fontWeight={600}
          href="/feed"
          onClick={() => {
            posthog.capture('recent winners_view all_homepage');
          }}
        >
          View All
          <ArrowForwardIcon ml={1} />
        </Text>
      </Flex>
      <Flex direction={'column'} rowGap={'1rem'} w={'full'} mt={4}>
        {activity.map((act, i) => {
          return (
            <ActivityCard
              key={i}
              link={act.link}
              firstName={act.firstName}
              lastName={act.lastName}
              username={act.username}
              createdAt={act.createdAt}
              listingType={act.listingType}
              isWinner={act.isWinner}
              isWinnersAnnounced={act.isWinnersAnnounced}
              type={act.type}
              ogImage={act.ogImage}
            />
          );
        })}
      </Flex>
    </Box>
  );
};

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
          {/* <TalentOlympicsBanner /> */}
          <HowItWorks />
          <RecentEarners earners={earners} />
          <RecentActivity />
        </>
      ) : (
        <>
          <HowItWorks />
          <RecentEarners earners={earners} />
        </>
      )}
      {/* <SidebarBanner /> */}
    </Flex>
  );
};
