import {
  AbsoluteCenter,
  Circle,
  Flex,
  Image,
  Text,
  VStack,
} from '@chakra-ui/react';
import Avatar from 'boring-avatars';
import React, { forwardRef, type Ref } from 'react';

import { type Bounty, type Rewards } from '@/features/listings';
import type { SubmissionWithUser } from '@/interface/submission';

interface Props {
  bounty: Bounty;
  submissions: SubmissionWithUser[];
  isProject: boolean;
  ref?: Ref<HTMLDivElement>;
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  maximumFractionDigits: 2, // If you want to limit the number of digits after the decimal
});

const winnerToNumber = (winner: string): string => {
  if (winner.toLowerCase().includes('first')) {
    return '1st';
  }
  if (winner.toLowerCase().includes('second')) {
    return '2nd';
  }
  if (winner.toLowerCase().includes('third')) {
    return '3rd';
  }
  if (winner.toLowerCase().includes('fourth')) {
    return '4th';
  }
  if (winner.toLowerCase().includes('fifth')) {
    return '5th';
  }
  return 'Winner';
};

const WinnerBanner = forwardRef<HTMLDivElement, Props>(
  ({ bounty, submissions, isProject }, ref) => {
    return (
      <Flex
        ref={ref}
        pos="relative"
        align="center"
        justify="center"
        direction="column"
        overflow="hidden"
        w="1200px"
        h="675px"
        my={'4rem'}
        color="white"
        bg="linear-gradient(180deg, #7F57F7 0%, #9B44FE 100%)"
      >
        <Text
          className="shifted-text"
          pos="absolute"
          top="1.5rem"
          color="rgba(255, 245, 245, 0.07)"
          fontSize="250px"
          fontWeight="500"
        >
          {submissions.length > 1 ? 'Winners' : 'Winner'}
        </Text>
        <AbsoluteCenter w="100%" mt="2rem">
          <Flex justify="space-around" gap="2" w="80%" mx="auto">
            {submissions.slice(0, 5).map((winner, index) => (
              <ProfileIcon
                key={index}
                winner={winner}
                index={index}
                bounty={bounty}
                isProject={isProject}
              />
            ))}
          </Flex>
        </AbsoluteCenter>
        <Flex
          pos="absolute"
          top="0"
          left="0"
          align="center"
          justify="space-between"
          w="full"
          px="2.5rem"
          py="2rem"
        >
          <Flex ml="auto">
            <Image
              w="200px"
              alt="ST Earn Logo"
              src="/assets/logo/st-earn-white.svg"
            />
          </Flex>
        </Flex>
      </Flex>
    );
  },
);

WinnerBanner.displayName = 'WinnerBanner';
export default WinnerBanner;

const ProfileIcon: React.FC<{
  winner: SubmissionWithUser;
  index: number;
  bounty: Bounty;
  isProject: boolean;
}> = ({ winner, index, bounty, isProject }) => {
  return (
    <VStack key={index} pos="relative" alignItems="center" spacing="2">
      {winner?.user?.photo ? (
        <Image
          boxSize="126.26px"
          borderRadius="full"
          objectFit="cover"
          alt={`${winner?.user?.firstName} ${winner?.user?.lastName}`}
          src={winner?.user?.photo}
        />
      ) : (
        <Avatar
          name={`${winner?.user?.firstName} ${winner?.user?.lastName}`}
          colors={['#92A1C6', '#F0AB3D', '#C271B4']}
          size={'126.26px'}
          variant="marble"
        />
      )}
      <Circle
        pos="absolute"
        top={-6}
        minW="50px"
        maxW="50px"
        minH="50px"
        maxH="50px"
        p={'10px'}
        color="white"
        fontSize="18.11px"
        fontWeight={600}
        bg="rgba(157, 111, 255, 1)"
      >
        <Text className="shifted-text">
          {isProject ? 'Winner' : winnerToNumber(winner?.winnerPosition || '')}
        </Text>
      </Circle>
      <Text
        w="220px"
        mt="0.5rem"
        fontSize="27.17px"
        fontWeight="600"
        textAlign="center"
      >
        {winner?.user?.firstName ?? ''}
      </Text>
      <Text
        w="220px"
        mt="-0.5rem"
        fontSize="27.17px"
        fontWeight="600"
        textAlign="center"
      >
        {winner?.user?.lastName ?? ''}
      </Text>
      <Text
        className="shifted-text"
        mt="0.5rem"
        color="rgba(255, 255, 255, 0.58)"
        fontSize="24.17px"
        fontWeight={500}
      >
        {bounty?.token}{' '}
        {bounty?.rewards &&
          formatter.format(
            +(bounty?.rewards[winner?.winnerPosition as keyof Rewards] ?? 0),
          )}
      </Text>
    </VStack>
  );
};
