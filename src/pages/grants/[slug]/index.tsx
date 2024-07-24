import { ExternalLinkIcon } from '@chakra-ui/icons';
import {
  Box,
  Divider,
  Flex,
  HStack,
  Image,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';

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
import { DescriptionUI } from '@/features/listings';
import type { SponsorType } from '@/interface/sponsor';
import { Default } from '@/layouts/Default';
import { getURLSanitized } from '@/utils/getURLSanitized';
import { getURL } from '@/utils/validUrl';

interface InitialGrant {
  grant: GrantWithApplicationCount;
}

function Grants({ grant: initialGrant }: InitialGrant) {
  const [grant] = useState<typeof initialGrant>(initialGrant);
  const encodedTitle = encodeURIComponent(initialGrant?.title || '');

  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture('open_grant');
  }, []);

  return (
    <Default
      meta={
        <Head>
          <title>{`Superteam Earn Grant | ${
            initialGrant?.title || 'Grant'
          } | Superteam Earn`}</title>
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
      {grant === null && <LoadingSection />}
      {grant !== null && !grant?.id && <EmptySection />}
      {grant !== null && !!grant?.id && (
        <>
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
            flexDir={{ base: 'column-reverse', md: 'row' }}
            gap={4}
            maxW={'8xl'}
            mx={'auto'}
            mb={10}
            px={3}
          >
            <VStack gap={8} w={'full'} mt={{ base: 0, md: 10 }}>
              <DescriptionUI
                skills={grant?.skills?.map((e) => e.skills)}
                description={(grant?.description as string) ?? ''}
              />
            </VStack>
            <Box w={{ base: 'full', md: 'auto' }}>
              <VStack gap={2} pt={10}>
                <VStack
                  justify={'center'}
                  gap={0}
                  w={{ base: 'full', md: '24rem' }}
                  px={3}
                  py={3}
                  bg={'#FFFFFF'}
                  rounded={'xl'}
                >
                  <Flex gap={3} w="full">
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
                    <Flex direction={'column'}>
                      <Text
                        color="brand.slate.700"
                        fontSize={{ base: 'lg', md: 'xl' }}
                        fontWeight={500}
                      >
                        {grantAmount({
                          maxReward: grant.maxReward!,
                          minReward: grant.minReward!,
                        })}{' '}
                        <Text as="span" color={'brand.slate.400'}>
                          {grant.token}
                        </Text>
                      </Text>
                      <Text
                        mt={-1}
                        color={'brand.slate.400'}
                        fontSize={'sm'}
                        fontWeight={500}
                      >
                        Cheque Size
                      </Text>
                    </Flex>
                  </Flex>
                  <Divider
                    my={2}
                    mr={-8}
                    ml={-8}
                    borderColor={'brand.slate.300'}
                  />
                  <Flex
                    direction={'column'}
                    display={grant?.link && !grant?.isNative ? 'none' : 'block'}
                    w="full"
                  >
                    <Flex w="full" mt={2}>
                      <Flex w="50%">
                        <TimeToPayIcon />
                        <Flex direction={'column'}>
                          <Text
                            color="brand.slate.700"
                            fontSize={{ base: 'lg', md: 'xl' }}
                            fontWeight={500}
                          >
                            {grant?.avgResponseTime}
                          </Text>
                          <Text
                            mt={-1}
                            color={'brand.slate.400'}
                            fontSize={'sm'}
                            fontWeight={500}
                          >
                            Avg. Response Time
                          </Text>
                        </Flex>
                      </Flex>
                      <Flex>
                        <DollarIcon />
                        <Flex direction={'column'}>
                          <Text
                            color="brand.slate.700"
                            fontSize={{ base: 'lg', md: 'xl' }}
                            fontWeight={500}
                          >
                            ${grant?.totalApproved || 0}
                          </Text>
                          <Text
                            mt={-1}
                            color={'brand.slate.400'}
                            fontSize={'sm'}
                            fontWeight={500}
                          >
                            Approved So Far
                          </Text>
                        </Flex>
                      </Flex>
                    </Flex>
                    <Flex w="full" mt={4} mb={6}>
                      <Flex w="50%">
                        <PayoutIcon />
                        <Flex direction={'column'}>
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
                          <Text
                            mt={-1}
                            color={'brand.slate.400'}
                            fontSize={'sm'}
                            fontWeight={500}
                          >
                            Avg. Grant Size
                          </Text>
                        </Flex>
                      </Flex>
                      <Flex>
                        <TimeToPayIcon />
                        <Flex direction={'column'}>
                          <Text
                            color="brand.slate.700"
                            fontSize={{ base: 'lg', md: 'xl' }}
                            fontWeight={500}
                          >
                            {grant._count.GrantApplication}
                          </Text>
                          <Text
                            mt={-1}
                            color={'brand.slate.400'}
                            fontSize={'sm'}
                            fontWeight={500}
                          >
                            Recipients
                          </Text>
                        </Flex>
                      </Flex>
                    </Flex>
                  </Flex>
                  <GrantApplicationButton grant={grant} />
                </VStack>
                {grant.requirements && (
                  <VStack
                    align="start"
                    w={{ base: 'full', md: '24rem' }}
                    mt={4}
                    p={6}
                    bg="white"
                    rounded={'xl'}
                  >
                    <Text
                      h="100%"
                      color={'brand.slate.400'}
                      fontSize="1rem"
                      fontWeight={500}
                      textAlign="center"
                    >
                      ELIGIBILITY
                    </Text>
                    <Text color={'brand.slate.500'}>{grant.requirements}</Text>
                  </VStack>
                )}
                {grant.pocSocials && (
                  <VStack
                    align={'start'}
                    justify={'center'}
                    w={{ base: '100%', md: '22rem' }}
                    mt={4}
                    p={6}
                    bg={'#FFFFFF'}
                    rounded={'xl'}
                  >
                    <Text
                      h="100%"
                      color={'brand.slate.400'}
                      fontSize="1rem"
                      fontWeight={500}
                      textAlign="center"
                    >
                      CONTACT
                    </Text>
                    <Text>
                      <Link
                        className="ph-no-capture"
                        color={'#64768b'}
                        fontSize="1rem"
                        fontWeight={500}
                        href={getURLSanitized(grant.pocSocials)}
                        isExternal
                        onClick={() => posthog.capture('reach out_listing')}
                      >
                        Reach out
                        <ExternalLinkIcon
                          color={'#64768b'}
                          mb={1}
                          as="span"
                          mx={1}
                        />
                      </Link>
                      <Text as="span" color={'brand.slate.500'} fontSize="1rem">
                        if you have any questions about this listing
                      </Text>
                    </Text>
                  </VStack>
                )}
              </VStack>
            </Box>
          </HStack>
        </>
      )}
    </Default>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;

  let grantData;
  try {
    const grantDetails = await axios.get(`${getURL()}api/grants/${slug}`);
    grantData = grantDetails.data;
  } catch (e) {
    console.error(e);
    grantData = null;
  }

  return {
    props: {
      grant: grantData,
    },
  };
};
export default Grants;
