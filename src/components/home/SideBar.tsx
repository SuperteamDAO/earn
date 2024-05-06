import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Box, Flex, Image, Skeleton, Text } from '@chakra-ui/react';
import axios from 'axios';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';

import { type Bounty, ListingCardMobile } from '@/features/listings';
import type { User } from '@/interface/user';
import { getURLSanitized } from '@/utils/getURLSanitized';
import { timeAgoShort } from '@/utils/timeAgo';

import { OgImageViewer } from '../misc/ogImageViewer';
import { RecentEarners } from './RecentEarners';

interface SideBarProps {
  total: number;
  listings: number;
  earners?: User[];
  isTotalLoading: boolean;
  type: 'home' | 'category' | 'region' | 'niche' | 'feed';
}

const TotalStats = ({
  bountyCount,
  TVE,
  isTotalLoading,
}: {
  bountyCount: number;
  TVE: number;
  isTotalLoading: boolean;
}) => {
  return (
    <Flex
      align={'center'}
      justify={'space-between'}
      h={'69'}
      px={'0.5rem'}
      bg={'#F8FAFC'}
      rounded={'md'}
    >
      <Flex>
        <Image
          h={'1.5625rem'}
          mr={'0.5rem'}
          mb={'auto'}
          alt=""
          src="/assets/icons/lite-purple-dollar.svg"
        />
        <Box>
          {isTotalLoading ? (
            <Skeleton w="54px" h="14px" />
          ) : (
            <Text color={'black'} fontSize={'sm'} fontWeight={'600'}>
              ${TVE.toLocaleString()}
            </Text>
          )}
          <Text color={'gray.500'} fontSize={'xs'} fontWeight={'400'}>
            Total Value Earned
          </Text>
        </Box>
      </Flex>
      <Box w={'0.0625rem'} h={'50%'} bg={'#CBD5E1'}></Box>
      <Flex>
        <Image
          h={'25x'}
          mr={'0.5rem'}
          mb={'auto'}
          alt="suitcase"
          src="/assets/icons/lite-purple-suitcase.svg"
        />
        <Box>
          {isTotalLoading ? (
            <Skeleton w="32px" h="14px" />
          ) : (
            <Text color={'black'} fontSize={'sm'} fontWeight={'600'}>
              {bountyCount}
            </Text>
          )}
          <Text color={'gray.500'} fontSize={'xs'} fontWeight={'400'}>
            Opportunities Listed
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
};

// const SidebarBanner = () => {
//   return (
//     <Flex
//       direction={'column'}
//       gap={1}
//       w={'full'}
//       h={'max-content'}
//       px={6}
//       py={8}
//       bgImage={"url('/assets/hackathon/renaissance/sidebar-bg.png')"}
//       bgSize="cover"
//       bgPosition="center"
//       bgRepeat="no-repeat"
//       rounded={'lg'}
//     >
//       <HStack>
//         <RenaissanceLogo
//           styles={{
//             width: '100%',
//             marginLeft: 'auto',
//             marginRight: 'auto',
//             marginBottom: '16px',
//           }}
//         />
//       </HStack>
//       <Text
//         mt={1}
//         color={'brand.slate.800'}
//         fontSize={'lg'}
//         fontWeight={'600'}
//         lineHeight={'6'}
//       >
//         Build a project for the latest Solana global hackathon!
//       </Text>
//       <Text
//         mt={'0.5rem'}
//         color={'brand.slate.700'}
//         fontSize={'1rem'}
//         lineHeight={'1.1875rem'}
//       >
//         Submit to any of the Renaissance side tracks on Earn and stand to win
//         some $$. Deadline for submissions is April 8, 2024.
//       </Text>
//       <Button
//         as={NextLink}
//         mt={'1.5625rem'}
//         py={'0.8125rem'}
//         fontWeight={'500'}
//         textAlign={'center'}
//         bg="#000"
//         borderRadius={8}
//         _hover={{ bg: '#716f6e' }}
//         href="/renaissance"
//       >
//         View Tracks
//       </Button>
//     </Flex>
//   );
// };

const RecentActivity = () => {
  const [activity, setActivity] = useState<any[]>([]);
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const res = await axios.get(`/api/feed/get`, {
          params: {
            take: 5,
          },
        });

        if (res) {
          setActivity(
            JSON.parse(res.data, (_key, value) => {
              return value;
            }),
          );
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchRecentActivity();
  }, []);

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
  }

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
    const sanitizedLink = getURLSanitized(link);

    return (
      <Flex as={NextLink} href={sanitizedLink}>
        <OgImageViewer h={12} w={20} objectFit={'cover'} externalUrl={link} />
        <Box ml={3}>
          <Flex align={'center'}>
            <Text
              overflow={'hidden'}
              maxW={28}
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
              maxW={24}
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
        <Text color={'gray.400'} fontWeight={500}>
          RECENT ACTIVITY
        </Text>
        <Text
          as={NextLink}
          color="brand.purple"
          fontSize="xs"
          fontWeight={600}
          href="/feed"
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
            />
          );
        })}
      </Flex>
    </Box>
  );
};

const OpenListings = () => {
  const [listings, setListings] = useState<{ bounties: Bounty[] }>({
    bounties: [],
  });
  const getListings = async () => {
    try {
      const listingData = await axios.get('/api/listings/', {
        params: {
          category: 'bounties',
          take: 5,
          isHomePage: true,
        },
      });

      setListings(listingData.data);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    getListings();
  }, []);
  return (
    <Box>
      <Flex align="center" justify={'space-between'}>
        <Text color={'gray.400'} fontWeight={500}>
          OPEN LISTINGS
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
      <Flex direction={'column'} rowGap={'1rem'} w={'full'} mt={4}>
        {listings?.bounties?.map((listing) => {
          return <ListingCardMobile bounty={listing} key={listing?.id} />;
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
  return (
    <Flex direction={'column'} rowGap={'2.5rem'} w={'22.125rem'} py={6} pl={6}>
      {type === 'feed' && <OpenListings />}
      <RecentEarners earners={earners} />
      {type !== 'feed' && (
        <>
          <TotalStats
            isTotalLoading={isTotalLoading}
            bountyCount={listings}
            TVE={total}
          />
          <RecentActivity />
        </>
      )}
      {/* <SidebarBanner /> */}
    </Flex>
  );
};
