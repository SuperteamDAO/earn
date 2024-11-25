import { Divider, Flex, Text, VStack } from '@chakra-ui/react';
import Image from 'next/image';

import Medal from '@/public/assets/leaderboard/medal.webp';

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
          欢迎来到 Solar Earn Leaderboards查看Solar
          生态系统顶级贡献者的赏金资料！获取激励。
        </Text>
      </VStack>
      <Divider />
      <VStack align="start">
        <Flex gap={2}>
          <Image width={20} src={Progress} alt="progress icon" />
          <Text color="brand.slate.600">边赚钱，边成长</Text>
        </Flex>
        <Flex gap={2}>
          <Image
            width={20}
            src={Rank}
            alt="progress icon"
            style={{ paddingRight: '0.4rem' }}
          />
          <Text color="brand.slate.600">发掘顶尖人才及其作品</Text>
        </Flex>
        <Flex gap={2}>
          <Image
            width={20}
            src={Semistar}
            alt="progress icon"
            style={{ paddingRight: '0.6rem' }}
          />
          <Text color="brand.slate.600">提升你的技能，逐级晋升</Text>
        </Flex>
      </VStack>
    </VStack>
  );
}
