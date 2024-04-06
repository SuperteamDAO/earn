import { HStack, Text, VStack } from '@chakra-ui/react';

import PiedPiper from '@/public/assets/landingsponsor/sponsors/piedPiper.png';

import { HighQualityImage } from '../HighQualityImage';

export function StepOne() {
  return (
    <VStack
      align="start"
      gap={4}
      w="21.5rem"
      p={6}
      bg="white"
      border="1px solid"
      borderColor="brand.slate.200"
    >
      <HStack gap={4} w="100%">
        <HighQualityImage alt="Pied Piper Logo" width={67} src={PiedPiper} />
        <VStack align="start" flexGrow={1} w="100%">
          <Text color="brand.slate.400" fontWeight="500">
            Company name
          </Text>
          <Text
            w="100%"
            px={2}
            py={2}
            color="brand.slate.700"
            fontWeight={500}
            bg="brand.slate.50"
            border="1px solid"
            borderColor="brand.slate.200"
          >
            Pied Piper
          </Text>
        </VStack>
      </HStack>
      <VStack align="start" flexGrow={1} w="100%">
        <Text color="brand.slate.400" fontWeight="500">
          Website URL
        </Text>
        <Text
          w="100%"
          px={2}
          py={2}
          color="brand.slate.700"
          fontWeight={500}
          bg="brand.slate.50"
          border="1px solid"
          borderColor="brand.slate.200"
        >
          https://piedpier.com
        </Text>
      </VStack>
      <VStack align="start" flexGrow={1} w="100%">
        <Text color="brand.slate.400" fontWeight="500">
          Company name
        </Text>
        <Text
          w="100%"
          px={2}
          py={2}
          color="brand.slate.700"
          fontWeight={500}
          bg="brand.slate.50"
          border="1px solid"
          borderColor="brand.slate.200"
        >
          Pied Piper
        </Text>
      </VStack>
      <Text
        alignSelf="end"
        px={4}
        py={2}
        color="brand.purple"
        fontWeight={500}
        bg="#EEF2FF"
        rounded={7}
      >
        Create Profile
      </Text>
    </VStack>
  );
}
