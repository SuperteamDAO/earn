import { Divider, Flex, Text, VStack } from '@chakra-ui/react';

import { ExternalImage } from '@/components/ui/cloudinary-image';

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
        <ExternalImage
          className="h-26 w-26"
          alt="Medal"
          src={'/leaderboard/medal.webp'}
        />
        <Text fontWeight={600}>Introducing Leaderboards</Text>
        <Text color="brand.slate.600">
          Get Inspired: Check out Earn profiles of the leading contributors of
          the Solana ecosystem!
        </Text>
      </VStack>
      <Divider />
      <VStack align="start">
        <Flex gap={2}>
          <ExternalImage
            className="w-5"
            src={'/leaderboard/progress'}
            alt="progress icon"
          />
          <Text color="brand.slate.600">Track your progress as you earn</Text>
        </Flex>
        <Flex gap={2}>
          <ExternalImage
            className="w-5"
            src={'/leaderboard/rank'}
            alt="progress icon"
            style={{ paddingRight: '0.4rem' }}
          />
          <Text color="brand.slate.600">
            Discover top profiles {'&'} their submissions
          </Text>
        </Flex>
        <Flex gap={2}>
          <ExternalImage
            className="w-5"
            src={'/leaderboard/semistart'}
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
