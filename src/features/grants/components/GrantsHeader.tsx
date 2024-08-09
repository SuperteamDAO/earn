import {
  Box,
  Flex,
  Heading,
  HStack,
  Image,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { ListingTabLink, RegionLabel, StatusBadge } from '@/features/listings';

interface Props {
  sponsor?: {
    name: string;
    logo: string;
    isVerified: boolean;
  };
  title: string;
  status: string;
  region: string;
  slug: string;
  references: any;
}
export const GrantsHeader = ({
  sponsor,
  title,
  status,
  region,
  slug,
  references,
}: Props) => {
  let statusBgColor = '';
  let statusTextColor = '';
  let statusText = '';

  switch (status) {
    case 'OPEN':
      statusBgColor = 'green.100';
      statusTextColor = 'green.600';
      statusText = 'Open';
      break;
    case 'CLOSED':
      statusBgColor = '#ffecb3';
      statusTextColor = '#F59E0B';
      statusText = 'Closed';
      break;
  }

  const router = useRouter();

  return (
    <>
      <Box w="full" bg={'white'}>
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
            <VStack align={'start'} gap={2}>
              <Flex align={'center'} wrap={'wrap'} gap={2}>
                <Heading
                  color={'brand.slate.700'}
                  fontFamily={'var(--font-sans)'}
                  fontSize={'xl'}
                  fontWeight={700}
                >
                  {title}
                </Heading>

                <StatusBadge
                  textColor={statusTextColor}
                  bgColor={statusBgColor}
                  text={statusText}
                />
              </Flex>

              <Flex align={'center'} wrap={'wrap'} gap={{ base: 1, md: 3 }}>
                <Flex align={'center'} gap={1}>
                  <Text
                    color={'#94A3B8'}
                    fontSize={{ base: 'xs', sm: 'md' }}
                    fontWeight={500}
                    whiteSpace={'nowrap'}
                  >
                    by {sponsor?.name}
                  </Text>
                  {!!sponsor?.isVerified && <VerifiedBadge />}
                </Flex>
                <Text color={'#E2E8EF'} fontWeight={500}>
                  |
                </Text>
                <RegionLabel region={region} />
              </Flex>
            </VStack>
          </HStack>
        </VStack>
        <Flex
          align={'center'}
          w={'full'}
          h={10}
          borderTop={'1px solid'}
          borderTopColor={'gray.100'}
        >
          <HStack
            align="center"
            justifyContent="start"
            gap={10}
            w={'full'}
            maxW={'8xl'}
            h={'full'}
            mx={'auto'}
            my={'auto'}
            px={3}
          >
            <ListingTabLink
              href={`/grants/${slug}/`}
              text="DETAILS"
              isActive={!router.asPath.includes('references')}
            />

            {references && references?.length > 0 && (
              <ListingTabLink
                href={`/grants/${slug}/references`}
                text="REFERENCES"
                isActive={router.asPath.includes('references')}
              />
            )}
          </HStack>
        </Flex>
      </Box>
    </>
  );
};
