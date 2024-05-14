import { Box, Heading, HStack, Image, Text, VStack } from '@chakra-ui/react';
import React from 'react';

import type { SponsorType } from '@/interface/sponsor';

interface Props {
  sponsor: SponsorType;
  title: string;
}
export const GrantsHeader = ({ sponsor, title }: Props) => {
  return (
    <>
      <Box bg={'white'}>
        <VStack
          align="start"
          justify={['start', 'start', 'space-between', 'space-between']}
          flexDir={['column', 'column', 'row', 'row']}
          gap={5}
          w={'full'}
          maxW={'8xl'}
          mx={'auto'}
          py={10}
        >
          <HStack align="start" flexDir={{ base: 'column', md: 'row' }} px={3}>
            <Image
              w={'4rem'}
              h={'4rem'}
              objectFit={'cover'}
              alt={'phantom'}
              rounded={'md'}
              src={sponsor?.logo}
            />
            <VStack align={'start'} gap={0}>
              <Heading
                mt={1}
                color={'brand.slate.700'}
                fontFamily={'var(--font-sans)'}
                fontSize={'lg'}
                fontWeight={700}
              >
                {title}
              </Heading>

              <Text color={'#94A3B8'} fontSize={{ base: 'sm', md: 'md' }}>
                by {sponsor?.name}
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </Box>
    </>
  );
};
