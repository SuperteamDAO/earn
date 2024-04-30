import { ArrowForwardIcon } from '@chakra-ui/icons';
import { Box, Flex, Image, Skeleton, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

import type { User } from '@/interface/user';

import { RecentEarners } from './RecentEarners';

interface SideBarProps {
  total: number;
  listings: number;
  earners?: User[];
  isTotalLoading: boolean;
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
  return (
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
  );
};

export const HomeSideBar = ({
  listings,
  total,
  earners,
  isTotalLoading,
}: SideBarProps) => {
  return (
    <Flex direction={'column'} rowGap={'2.5rem'} w={'22.125rem'} pl={6}>
      <RecentEarners earners={earners} />
      {/* <GettingStarted userInfo={userInfo} /> */}
      <TotalStats
        isTotalLoading={isTotalLoading}
        bountyCount={listings}
        TVE={total}
      />
      <RecentActivity />
      {/* <SidebarBanner /> */}
    </Flex>
  );
};
