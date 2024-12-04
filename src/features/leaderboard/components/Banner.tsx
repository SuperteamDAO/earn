import { Flex, Image, Text, VStack } from '@chakra-ui/react';

import { ASSET_URL } from '@/constants/ASSET_URL';

export function Banner() {
  return (
    <Flex align="center" overflow="hidden" h="8rem" bg="#020617" rounded={6}>
      <Flex w={{ md: 100 }}>
        <img alt="Ranks 3d" src={ASSET_URL + '/leaderboard/ranks3d.webp'} />
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
          className="w-full"
          alt="Illustration"
          src={ASSET_URL + '/leaderboard/banner-mobile.webp'}
        />
      </Flex>
      <Flex
        display={{ base: 'none', md: 'flex' }}
        w={'40%'}
        h={'100%'}
        ml="auto"
      >
        <Image
          className="ml-8 h-full w-full"
          alt="Illustration"
          src={ASSET_URL + '/leaderboard/banner-desktop.webp'}
        />
      </Flex>
    </Flex>
  );
}
