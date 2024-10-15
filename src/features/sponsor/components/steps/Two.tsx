import { Divider, HStack, Text, VStack } from '@chakra-ui/react';
import Image from 'next/image';

import USDC from '@/public/assets/landingsponsor/icons/usdc.svg';
import PiedPiper from '@/public/assets/landingsponsor/sponsors/piedPiper.webp';

import { HighQualityImage } from '../HighQualityImage';

export function StepTwo() {
  return (
    <VStack
      w="21.5rem"
      h="18.75rem"
      bg="white"
      border="1px solid"
      borderColor="brand.slate.200"
      shadow={'0px 4px 6px 0px rgba(226, 232, 240, 0.41)'}
      rounded={6}
    >
      <VStack align="start" gap={4} p={4} pb={3}>
        <HStack gap={4} w="100%">
          <HighQualityImage alt="Pied Piper Logo" width={49} src={PiedPiper} />
          <VStack align="start" flexGrow={1} gap={0} w="100%" fontSize={'sm'}>
            <Text color="brand.slate.700" fontWeight={600}>
              Write a Deep Dive on PiperCoin
            </Text>
            <HStack gap={2}>
              <Text
                color="brand.slate.400"
                fontWeight={600}
                bg="brand.slate.50"
              >
                By Pied Piper
              </Text>
              <Divider h={6} orientation="vertical" />
              <Text
                color="brand.slate.400"
                fontWeight={500}
                bg="brand.slate.50"
              >
                Ends in 21 days
              </Text>
            </HStack>
          </VStack>
        </HStack>
        <Text color="brand.slate.500" fontSize="sm" fontWeight={500}>
          Pied Piper is a pioneering middle-out compression company. The company
          is looking for bounty hunters to deep dive into the $PIPER coin, and
          explain the coin’s background and utility to noobs.
        </Text>
        <HStack justify="space-between" w="full" fontSize="x-small">
          <Text color="brand.slate.400" fontWeight={500}>
            Skills
          </Text>
          <HStack>
            <Text
              px={2}
              py={1}
              color="#0d3d99"
              fontWeight={500}
              bg="#0D3D990A"
              rounded={6}
            >
              Writing
            </Text>
            <Text
              px={2}
              py={1}
              color="#F56f23"
              fontWeight={500}
              bg="#F56f230A"
              rounded={6}
            >
              Marketing
            </Text>
            <Text
              px={2}
              py={1}
              color="#838281"
              fontWeight={500}
              bg="#8382810A"
              rounded={6}
            >
              Community
            </Text>
          </HStack>
        </HStack>
      </VStack>
      <Divider />
      <HStack justify={'space-between'} w="full" px={4}>
        <HStack>
          <Image src={USDC} alt="usdc icon" />
          <Text color="brand.slate.800" fontWeight={600}>
            $1,000
          </Text>
        </HStack>
        <Text
          alignSelf="end"
          px={4}
          py={2}
          color="brand.purple"
          fontSize="sm"
          fontWeight={500}
          bg="#EEF2FF"
          rounded={7}
        >
          Post Bounty
        </Text>
      </HStack>
    </VStack>
  );
}
