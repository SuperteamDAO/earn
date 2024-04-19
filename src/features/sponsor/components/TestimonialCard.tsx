import { Box, Center, HStack, Text, VStack } from '@chakra-ui/react';
import { type StaticImageData } from 'next/image';

import { HighQualityImage } from './HighQualityImage';
import { Stars } from './Stars';

export interface TestimonialProps {
  stars: number;
  message: string;
  pfp: StaticImageData;
  name: string;
  position: string;
  logo: StaticImageData;
}
export function TestimonialCard({
  stars,
  message,
  pfp,
  name,
  position,
  logo,
}: TestimonialProps) {
  return (
    <VStack
      flex={1}
      gap={2}
      w="full"
      border="1px solid"
      borderColor="brand.slate.300"
      rounded={4}
    >
      <Center w={'100%'} h={'14.754rem'} bg="black" rounded={4}>
        <HighQualityImage src={logo} alt={position} width={75} />
      </Center>
      <VStack align="start" flex={1} gap={4} h="100%" mt="auto" p={'1rem'}>
        <Stars count={5} filled={stars} />
        <Text
          color="brand.slate.600"
          fontSize={'1.3rem'}
          lineHeight={1.1}
          dangerouslySetInnerHTML={{ __html: message }}
        ></Text>
        <HStack gap={2} mt="auto" pt="1rem">
          <Box gap={6} w={'2.1rem'} h={'2.1rem'}>
            <HighQualityImage
              src={pfp}
              alt={name}
              width={50}
              height={50}
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
          <VStack align="start" gap={0}>
            <Text color="black" fontSize={'1rem'}>
              {name}
            </Text>
            <Text color="brand.slate.500" fontSize={'1rem'}>
              {position}
            </Text>
          </VStack>
        </HStack>
      </VStack>
    </VStack>
  );
}
