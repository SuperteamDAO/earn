import {
  Box,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';
import { LuCheck } from 'react-icons/lu';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import {
  ListingHeaderSeparator,
  ListingTabLink,
  StatusBadge,
} from '@/features/listings';
import { PulseIcon } from '@/svg/pulse-icon';

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
  const statusIconStyles = { w: 5, h: 5 };
  let statusBgColor = '';
  let statusTextColor = '';
  let statusText = '';
  let statusIcon = (
    <PulseIcon
      {...statusIconStyles}
      bg={statusBgColor}
      text={statusTextColor}
    />
  );
  switch (status) {
    case 'OPEN':
      statusIcon = (
        <PulseIcon
          isPulsing
          {...statusIconStyles}
          bg={'#9AE6B4'}
          text="#16A34A"
        />
      );
      statusBgColor = 'green.100';
      statusTextColor = 'green.600';
      statusText = 'Open';
      break;
    case 'CLOSED':
      statusIcon = (
        <Icon as={LuCheck} {...statusIconStyles} color={'brand.slate.400'} />
      );
      statusBgColor = '#ffecb3';
      statusTextColor = '#F59E0B';
      statusText = 'Closed';
      break;
  }

  const router = useRouter();

  return (
    <Box w="full" bg={'white'}>
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
        <HStack align="start" flexDir={{ base: 'column', md: 'row' }}>
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
              <ListingHeaderSeparator />
              <Flex>
                <Image
                  h="4"
                  mt={{ base: '1px', sm: 1 }}
                  mr={{ base: '1px', sm: 1 }}
                  alt={'grant'}
                  src={'/assets/icons/bank.svg'}
                />
                <Text
                  color={'brand.slate.400'}
                  fontSize={{ base: 'xs', sm: 'md' }}
                  fontWeight={500}
                >
                  Grant
                </Text>
              </Flex>
              <ListingHeaderSeparator />
              <StatusBadge
                Icon={statusIcon}
                textColor={statusTextColor}
                text={statusText}
              />
              {/* <ListingHeaderSeparator /> */}
              {/* <RegionLabel region={region} isGrant /> */}
            </Flex>
          </VStack>
        </HStack>
      </VStack>
      <Flex align={'center'} w={'full'} h={10}>
        <HStack
          align="center"
          justifyContent="start"
          gap={10}
          w={'full'}
          maxW={'7xl'}
          h={'full'}
          mx={'auto'}
          my={'auto'}
          borderColor="brand.slate.200"
          borderBottomWidth={'1px'}
        >
          <ListingTabLink
            w={{ md: '22rem' }}
            href={`/grants/${slug}/`}
            text="奖金"
            isActive={false}
            styles={{
              pointerEvents: 'none',
              display: { base: 'none', md: 'flex' },
            }}
          />
          <ListingTabLink
            href={`/grants/${slug}/`}
            text="详情"
            isActive={!router.asPath.split('/')[3]?.includes('references')}
          />

          {references && references?.length > 0 && (
            <ListingTabLink
              href={`/grants/${slug}/references`}
              text="References"
              isActive={!!router.asPath.split('/')[3]?.includes('references')}
            />
          )}
        </HStack>
      </Flex>
    </Box>
  );
};
