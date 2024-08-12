import {
  Box,
  Divider,
  Flex,
  HStack,
  Image,
  Text,
  VStack,
} from '@chakra-ui/react';
import Head from 'next/head';
import { useState } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { tokenList } from '@/constants';
import {
  DollarIcon,
  grantAmount,
  GrantApplicationButton,
  GrantsHeader,
  type GrantWithApplicationCount,
  PayoutIcon,
  TimeToPayIcon,
} from '@/features/grants';
import { ExtraInfoSection } from '@/features/listings';
import { type SponsorType } from '@/interface/sponsor';
import { getURL } from '@/utils/validUrl';

import { Default } from './Default';

interface GrantPageProps {
  grant: GrantWithApplicationCount | null;
  children: React.ReactNode;
}
export function GrantPageLayout({
  grant: initialGrant,
  children,
}: GrantPageProps) {
  const [grant] = useState<typeof initialGrant>(initialGrant);
  const encodedTitle = encodeURIComponent(initialGrant?.title || '');

  return (
    <Default
      meta={
        <Head>
          <title>{`${initialGrant?.title || 'Grant'} | Superteam Earn`}</title>
          <meta
            property="og:title"
            content={`${initialGrant?.title || 'Grant'} | Superteam Earn`}
          />
          <meta
            property="og:image"
            content={`${getURL()}api/dynamic-og/grant/?title=${encodedTitle}&token=${initialGrant?.token}&sponsor=${initialGrant?.sponsor?.name}&logo=${initialGrant?.sponsor?.logo}&minReward=${initialGrant?.minReward}&maxReward=${initialGrant?.maxReward}&isSponsorVerified=${initialGrant?.sponsor?.isVerified}`}
          />
          <meta
            name="twitter:title"
            content={`${initialGrant?.title || 'Grant'} | Superteam Earn`}
          />
          <meta
            name="twitter:image"
            content={`${getURL()}api/dynamic-og/grant/?title=${encodedTitle}&token=${initialGrant?.token}&sponsor=${initialGrant?.sponsor?.name}&logo=${initialGrant?.sponsor?.logo}&minReward=${initialGrant?.minReward}&maxReward=${initialGrant?.maxReward}&isSponsorVerified=${initialGrant?.sponsor?.isVerified}`}
          />
          <meta name="twitter:card" content="summary_large_image" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="Superteam Grant" />
          <meta charSet="UTF-8" key="charset" />
          <meta
            name="viewport"
            content="width=device-width,initial-scale=1"
            key="viewport"
          />
        </Head>
      }
    >
      <Box bg="white">
        {grant === null && <LoadingSection />}
        {grant !== null && !grant?.id && <EmptySection />}
        {grant !== null && !!grant?.id && (
          <Box w="full" maxW={'8xl'} mx="auto" bg="white">
            <GrantsHeader
              title={grant?.title ?? ''}
              sponsor={grant?.sponsor as SponsorType}
              status={grant?.status}
              region={grant?.region}
              slug={grant?.slug}
              references={grant.references}
            />

            <HStack
              align={['center', 'center', 'start', 'start']}
              justify={['center', 'center', 'space-between', 'space-between']}
              flexDir={{ base: 'column', md: 'row' }}
              gap={4}
              mx={'auto'}
              mb={10}
              px={3}
            >
              <Box w={{ base: 'full', md: 'auto' }}>
                <VStack gap={2}>
                  <VStack
                    justify={'center'}
                    gap={0}
                    w={{ base: 'full', md: '22rem' }}
                    px={3}
                    py={3}
                    bg={'#FFFFFF'}
                    rounded={'xl'}
                  >
                    <Flex
                      align={'center'}
                      justify={'space-between'}
                      gap={3}
                      w="full"
                    >
                      <Flex align={'center'} gap={2}>
                        <Image
                          w={9}
                          h={9}
                          mt={1}
                          alt={'green doller'}
                          rounded={'full'}
                          src={
                            tokenList.filter(
                              (e) => e?.tokenSymbol === grant.token,
                            )[0]?.icon ?? '/assets/icons/green-dollar.svg'
                          }
                        />
                        <Text
                          color="brand.slate.700"
                          fontSize={{ base: 'lg', md: 'xl' }}
                          fontWeight={600}
                        >
                          {grantAmount({
                            maxReward: grant.maxReward!,
                            minReward: grant.minReward!,
                          })}{' '}
                          <Text as="span" color={'brand.slate.500'}>
                            {grant.token}
                          </Text>
                        </Text>
                      </Flex>
                      <Text
                        mt={-1}
                        color={'brand.slate.500'}
                        fontSize={'sm'}
                        fontWeight={500}
                      >
                        Cheque Size
                      </Text>
                    </Flex>
                    <Divider
                      my={5}
                      mr={-8}
                      ml={-8}
                      borderColor={'brand.slate.300'}
                    />
                    <Flex
                      direction={'column'}
                      display={
                        grant?.link && !grant?.isNative ? 'none' : 'block'
                      }
                      w="full"
                    >
                      <Flex w="full" mt={2}>
                        <Flex direction={'column'} w="50%">
                          <Flex>
                            <TimeToPayIcon />
                            <Text
                              color="brand.slate.700"
                              fontSize={{ base: 'lg', md: 'xl' }}
                              fontWeight={500}
                            >
                              {grant?.avgResponseTime}
                            </Text>
                          </Flex>
                          <Text
                            pl={2}
                            color={'brand.slate.500'}
                            fontSize={'sm'}
                            fontWeight={500}
                            textTransform={'uppercase'}
                          >
                            Avg. Response Time
                          </Text>
                        </Flex>
                        <Flex direction={'column'}>
                          <Flex>
                            <DollarIcon />
                            <Text
                              color="brand.slate.700"
                              fontSize={{ base: 'lg', md: 'xl' }}
                              fontWeight={500}
                            >
                              ${grant?.totalApproved || 0}
                            </Text>
                          </Flex>
                          <Text
                            pl={2}
                            color={'brand.slate.500'}
                            fontSize={'sm'}
                            fontWeight={500}
                            textTransform={'uppercase'}
                          >
                            Approved So Far
                          </Text>
                        </Flex>
                      </Flex>
                      <Flex w="full" mt={4} mb={6}>
                        <Flex direction={'column'} w="50%">
                          <Flex>
                            <PayoutIcon />
                            <Text
                              color="brand.slate.700"
                              fontSize={{ base: 'lg', md: 'xl' }}
                              fontWeight={500}
                            >
                              {grant.totalApproved
                                ? `$` +
                                  Math.round(
                                    grant?.totalApproved /
                                      grant?._count.GrantApplication,
                                  )
                                : '—'}
                            </Text>
                          </Flex>
                          <Text
                            pl={2}
                            color={'brand.slate.500'}
                            fontSize={'sm'}
                            fontWeight={500}
                            textTransform={'uppercase'}
                          >
                            Avg. Grant Size
                          </Text>
                        </Flex>
                        <Flex direction={'column'}>
                          <Flex>
                            <TimeToPayIcon />
                            <Text
                              color="brand.slate.700"
                              fontSize={{ base: 'lg', md: 'xl' }}
                              fontWeight={500}
                            >
                              {grant._count.GrantApplication}
                            </Text>
                          </Flex>
                          <Text
                            pl={2}
                            color={'brand.slate.500'}
                            fontSize={'sm'}
                            fontWeight={500}
                            textTransform={'uppercase'}
                          >
                            Recipients
                          </Text>
                        </Flex>
                      </Flex>
                    </Flex>
                    <GrantApplicationButton grant={grant} />
                    <Box display={{ base: 'none', md: 'block' }}>
                      <ExtraInfoSection
                        skills={grant?.skills?.map((e) => e.skills) ?? []}
                        region={grant.region}
                        requirements={grant.requirements}
                        pocSocials={grant.pocSocials}
                      />
                    </Box>
                  </VStack>
                </VStack>
              </Box>
              <VStack
                gap={8}
                w={'full'}
                px={5}
                borderColor="brand.slate.100"
                borderLeftWidth={'1px'}
              >
                {children}
              </VStack>
            </HStack>
          </Box>
        )}
      </Box>
    </Default>
  );
}
