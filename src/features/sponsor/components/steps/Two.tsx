import { Divider, HStack, Text, VStack } from '@chakra-ui/react';

import PiedPiper from '@/public/assets/landingsponsor/sponsors/piedPiper.png';

import { HighQualityImage } from '../HighQualityImage';

export function StepTwo() {
  return (
    <VStack>
      <HStack gap={4} w="100%">
        <HighQualityImage alt="Pied Piper Logo" width={67} src={PiedPiper} />
        <VStack align="start" flexGrow={1} w="100%">
          <Text color="brand.slate.400" fontWeight="500">
            Write a Deep Dive on PiperCoin
          </Text>
          <HStack>
            <Text
              w="100%"
              px={2}
              py={2}
              color="brand.slate.400"
              fontWeight={600}
              bg="brand.slate.50"
            >
              By Pied Piper
            </Text>
            <Divider />
            <Text
              w="100%"
              px={2}
              py={2}
              color="brand.slate.400"
              fontWeight={500}
              bg="brand.slate.50"
            >
              Ends in 21 days
            </Text>
          </HStack>
        </VStack>
      </HStack>
    </VStack>
  );
}
