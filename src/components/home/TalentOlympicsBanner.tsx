import { Box, Button, Link, Text, VStack } from '@chakra-ui/react';
import Image from 'next/image';
import NextLink from 'next/link';

import { TalentOlympicsHeader } from '@/svg/talent-olympics-header';

export const TalentOlympicsBanner = () => {
  return (
    <VStack pos="relative" color="white">
      <Box pos="absolute" zIndex={0} w="full" h="full">
        <Image
          src="/assets/hackathon/talent-olympics/bg.png"
          alt="Talent Olympics Banner"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          width={700}
          height={700}
        />
      </Box>
      <Box
        pos="absolute"
        zIndex={1}
        w="full"
        h="full"
        bg="rgba(0, 0, 0, 0.2)"
      />
      <VStack zIndex={2} p={6}>
        <TalentOlympicsHeader styles={{ height: '6rem', width: 'auto' }} />
        <Text fontWeight={600} lineHeight={1.3}>
          Looking for a frontend or rust job? Here’s your ticket!{' '}
        </Text>
        <Text lineHeight={1.2}>
          Talent Olympics is a collection of bounties aimed at getting you hired
          by the top Solana ecosystem teams.
        </Text>
        <Link as={NextLink} w="full" href="/talent-olympics">
          <Button
            w="full"
            mt={4}
            color="#8330A9"
            fontSize={'sm'}
            bg="white"
            variant="solidSecondary"
          >
            Enter the Arena
          </Button>
        </Link>
      </VStack>
    </VStack>
  );
};
