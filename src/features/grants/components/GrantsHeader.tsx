import { Heading, HStack, Image, Text, VStack } from '@chakra-ui/react';
import React from 'react';

import type { SponsorType } from '@/interface/sponsor';

interface Props {
  sponsor: SponsorType;
  title: string;
}
export const GrantsHeader = ({ sponsor, title }: Props) => {
  return (
    <>
      <VStack bg={'white'}>
        <VStack
          align="start"
          justify={['start', 'start', 'space-between', 'space-between']}
          flexDir={['column', 'column', 'row', 'row']}
          gap={5}
          w={'full'}
          maxW={'7xl'}
          mx={'auto'}
          py={10}
        >
          <HStack align="start" px={[3, 3, 0, 0]}>
            <Image
              w={'4rem'}
              h={'4rem'}
              objectFit={'cover'}
              alt={'phantom'}
              rounded={'md'}
              src={sponsor?.logo}
            />
            <VStack align={'start'}>
              <Heading
                color={'brand.slate.700'}
                fontFamily={'var(--font-sans)'}
                fontSize={'lg'}
                fontWeight={700}
              >
                {title}
              </Heading>
              <HStack>
                <Text color={'#94A3B8'}>by {sponsor?.name}</Text>
              </HStack>
            </VStack>
          </HStack>
        </VStack>
      </VStack>
    </>
  );
};
