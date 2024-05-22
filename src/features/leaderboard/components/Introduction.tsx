import { Divider, Flex, Text, VStack } from '@chakra-ui/react';
import Image from 'next/image';

import Medal from '@/public/assets/leaderboard/medal.png';

import Progress from '../icons/progress.svg';
import Rank from '../icons/rank.svg';
import Semistar from '../icons/semistart.svg';

export function Introduction() {
  return (
    <VStack
      align="start"
      gap={4}
      w="full"
      p={6}
      fontSize={'sm'}
      bg="#FAF5FF"
      rounded={12}
    >
      <VStack align="start">
        <Image alt="Medal" src={Medal} height={26} width={26} />
        <Text fontWeight={600}>Introducing Leaderboards</Text>
        <Text color="brand.slate.600">
          Get Inspired: Check out Earn profiles of the leading contributors of
          the Solana ecosystem!
        </Text>
      </VStack>
      <Divider />
      <VStack align="start">
        <Flex gap={2}>
          <Image width={20} src={Progress} alt="progress icon" />
          <Text color="brand.slate.600">Track your progress as you earn</Text>
        </Flex>
        <Flex gap={2}>
          <Image
            width={20}
            src={Rank}
            alt="progress icon"
            style={{ paddingRight: '0.4rem' }}
          />
          <Text color="brand.slate.600">
            Discover top profiles {'&'} their submissions
          </Text>
        </Flex>
        <Flex gap={2}>
          <Image
            width={20}
            src={Semistar}
            alt="progress icon"
            style={{ paddingRight: '0.6rem' }}
          />
          <Text color="brand.slate.600">
            Improve your skills {'&'} rise through the ranks
          </Text>
        </Flex>
      </VStack>
    </VStack>
  );
}
