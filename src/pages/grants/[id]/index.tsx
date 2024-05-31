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
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { tokenList } from '@/constants';
import {
  DollarIcon,
  type Grant,
  GrantApplicationButton,
  GrantsHeader,
  PayoutIcon,
  TimeToPayIcon,
} from '@/features/grants';
import { DescriptionUI } from '@/features/listings';
import type { SponsorType } from '@/interface/sponsor';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { getURLSanitized } from '@/utils/getURLSanitized';

interface GrantsDetailsProps {
  slug: string;
}

const Grants = ({ slug }: GrantsDetailsProps) => {
  const [grant, setGrant] = useState<Grant | null>(null);
  const [applicationNumber, setApplicationNumber] = useState<number>(0);
  const [isApplicationNumberLoading, setIsApplicationNumberLoading] =
    useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const posthog = usePostHog();

  const getGrants = async () => {
    setIsLoading(true);
    try {
      const grantsDetails = await axios.post('/api/grants/getGrantBySlug', {
        slug,
      });

      setGrant(grantsDetails.data);
    } catch (e) {
      setError(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isLoading) return;
    posthog.capture('open_grant');
    getGrants();
  }, []);

  const getApplicationCount = async () => {
    setIsApplicationNumberLoading(true);
    try {
      const submissionCountDetails = await axios.get(
        `/api/grantApplication/${grant?.id}/count/`,
      );
      const count = submissionCountDetails?.data || 0;
      setApplicationNumber(count);
      setIsApplicationNumberLoading(false);
    } catch (e) {
      setIsApplicationNumberLoading(false);
    }
  };

  useEffect(() => {
    if (!isApplicationNumberLoading) return;
    getApplicationCount();
  }, []);

  return (
    <>
      <Default
        meta={
          <Meta
            title="Superteam Earn"
            description="Every Solana opportunity in one place!"
          />
        }
      >
        {isLoading && <LoadingSection />}
        {!isLoading && !!error && <EmptySection />}
        {!isLoading && !error && !grant?.id && (
          <EmptySection message="Sorry! The bounty you are looking for is not available." />
        )}
        {!isLoading && !error && !!grant?.id && (
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
                    w={{ base: 'full', md: '22rem' }}
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
                          {formatNumberWithSuffix(grant.minReward || 0)} to{' '}
                          {formatNumberWithSuffix(grant.maxReward || 0)}{' '}
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
                          Check Size
                        </Text>
                      </Flex>
                    </Flex>
                    <Divider
                      my={2}
                      mr={-8}
                      ml={-8}
                      borderColor={'brand.slate.300'}
                    />
                    <Flex w="full" mt={2}>
                      <Flex w="50%">
                        <TimeToPayIcon />
                        <Flex direction={'column'}>
                          <Text
                            color="brand.slate.700"
                            fontSize={{ base: 'lg', md: 'xl' }}
                            fontWeight={500}
                          >
                            24h
                          </Text>
                          <Text
                            mt={-1}
                            color={'brand.slate.400'}
                            fontSize={'sm'}
                            fontWeight={500}
                          >
                            Avg Time to Pay
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
                            $230k
                          </Text>
                          <Text
                            mt={-1}
                            color={'brand.slate.400'}
                            fontSize={'sm'}
                            fontWeight={500}
                          >
                            Paid so far
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
                            $3.2k
                          </Text>
                          <Text
                            mt={-1}
                            color={'brand.slate.400'}
                            fontSize={'sm'}
                            fontWeight={500}
                          >
                            Avg Payout
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
                            {isApplicationNumberLoading
                              ? '...'
                              : applicationNumber.toLocaleString()}
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
                    <GrantApplicationButton
                      applicationNumber={applicationNumber}
                      setApplicationNumber={setApplicationNumber}
                      grant={grant}
                    />
                  </VStack>
                  {grant.requirements && (
                    <VStack
                      align="start"
                      w={{ base: 'full', md: '22rem' }}
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
                      <Text color={'brand.slate.500'}>
                        {grant.requirements}
                      </Text>
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
                        <Text
                          as="span"
                          color={'brand.slate.500'}
                          fontSize="1rem"
                        >
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
    </>
  );
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;
  return {
    props: { slug: id },
  };
};
export default Grants;
