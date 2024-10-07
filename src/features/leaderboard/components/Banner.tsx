import { Flex, Text, VStack } from '@chakra-ui/react';
import Image from 'next/image';

import BannerDesktop from '@/public/assets/leaderboard/banner-desktop.webp';
import BannerMobile from '@/public/assets/leaderboard/banner-mobile.webp';
import Ranks3d from '@/public/assets/leaderboard/ranks3d.webp';

export function Banner() {
  return (
    <Flex align="center" overflow="hidden" h="8rem" bg="#020617" rounded={6}>
      <Flex w={{ md: 100 }}>
        <Image alt="Ranks 3d" src={Ranks3d} />
      </Flex>
      <VStack
        align="start"
        gap={1}
        fontSize={{
          base: 'sm',
          sm: 'md',
        }}
      >
        <Text color="white" fontSize={'lg'} fontWeight={600}>
          Talent Leaderboard
        </Text>
        <Text mt={1} color="brand.slate.400" lineHeight={1.2}>
          See where you stand amongst the {"Solana's"} top contributors
        </Text>
      </VStack>
      <Flex display={{ base: 'flex', md: 'none' }} h={'100%'}>
        <Image
          style={{
            marginLeft: '2rem',
          }}
          alt="Illustration"
          src={BannerMobile}
        />
      </Flex>
      <Flex
        display={{ base: 'none', md: 'flex' }}
        w={'40%'}
        h={'100%'}
        ml="auto"
      >
        <Image
          style={{
            marginLeft: '2rem',
          }}
          alt="Illustration"
          src={BannerDesktop}
        />
      </Flex>
    </Flex>
  );
}
