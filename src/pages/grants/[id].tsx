import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import { type GetServerSideProps } from 'next';
import Head from 'next/head';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { type Grant, GrantsHeader } from '@/features/grants';
import { DescriptionUI } from '@/features/listings';
import type { SponsorType } from '@/interface/sponsor';
import { Default } from '@/layouts/Default';

interface GrantsDetailsProps {
  slug: string;
}

const Grants = ({ slug }: GrantsDetailsProps) => {
  const [grants, setGrants] = useState<Grant | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const posthog = usePostHog();

  const isBlink = slug === 'blink-grants';

  const getGrants = async () => {
    setIsLoading(true);
    try {
      const grantsDetails = await axios.get(`/api/grants/${slug}/`);

      setGrants(grantsDetails.data);
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

  return (
    <>
      <Default
        meta={
          <Head>
            <title>{`${isBlink ? 'Blink Grants' : 'Grants'} | Superteam Earn`}</title>
            <meta
              property="og:title"
              content={`${isBlink ? 'Blink Grants' : 'Grants'} | Superteam Earn`}
            />
            <meta
              property="og:image"
              content={`${isBlink ? 'https://earn.superteam.fun/blink-og.png' : 'https://earn.superteam.fun/assets/logo/og.png'}`}
            />
            <meta
              name="twitter:title"
              content={`${isBlink ? 'Blink Grants' : 'Grants'} | Superteam Earn`}
            />
            <meta
              name="twitter:image"
              content={`${isBlink ? 'https://earn.superteam.fun/blink-og.png' : 'https://earn.superteam.fun/assets/logo/og.png'}`}
            />
            <meta name="twitter:card" content="summary_large_image" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="Superteam Bounty" />
            <meta charSet="UTF-8" key="charset" />
            <meta
              name="viewport"
              content="width=device-width,initial-scale=1"
              key="viewport"
            />
          </Head>
        }
      >
        {isLoading && <LoadingSection />}
        {!isLoading && !!error && <EmptySection />}
        {!isLoading && !error && !grants?.id && (
          <EmptySection message="Sorry! The bounty you are looking for is not available." />
        )}
        {!isLoading && !error && !!grants?.id && (
          <>
            <GrantsHeader
              title={grants?.title ?? ''}
              sponsor={grants?.sponsor as SponsorType}
            />
            <HStack
              align={{ base: 'center', md: 'start' }}
              justify={{ base: 'center', md: 'space-between' }}
              flexDir={{ base: 'column-reverse', md: 'row' }}
              gap={4}
              maxW={'8xl'}
              minH={'100vh'}
              mx={'auto'}
              my={{ base: 3, md: 10 }}
            >
              <HStack w={'full'}>
                <DescriptionUI
                  skills={grants?.skills?.map((e) => e.skills)}
                  description={(grants?.description as string) ?? ''}
                />
              </HStack>
              <Flex
                direction={'column'}
                gap={5}
                w={{ base: 'full', md: '32rem' }}
                py={5}
                bg={'white'}
                rounded={'md'}
              >
                <HStack gap={3} px={8}>
                  <Box
                    alignItems={'center'}
                    justifyContent={'center'}
                    display={'flex'}
                    w={12}
                    h={12}
                    bg={'green.50'}
                    rounded={'full'}
                  >
                    <Image
                      w={4}
                      alt={'green doller'}
                      src={'/assets/icons/green-dollar.svg'}
                    />
                  </Box>
                  <VStack align={'start'}>
                    <Text
                      color={'gray.600'}
                      fontSize={{ base: 'md', md: 'lg' }}
                      fontWeight={500}
                    >
                      Upto ${(grants.rewardAmount || 0).toLocaleString()}
                    </Text>
                    <Text mt={'0px !important'} color={'gray.500'}>
                      Per Grant
                    </Text>
                  </VStack>
                </HStack>

                <Box w={'full'} px={10}>
                  <Flex
                    pos={{ base: 'fixed', md: 'static' }}
                    zIndex={999}
                    bottom={12}
                    left="50%"
                    w="full"
                    px={{ base: 3, md: 0 }}
                    py={{ base: 4, md: 0 }}
                    bg="white"
                    transform={{ base: 'translateX(-50%)', md: 'none' }}
                  >
                    <Button
                      as={Link}
                      zIndex={999}
                      w="full"
                      _hover={{
                        textDecoration: 'none',
                      }}
                      href={grants?.link}
                      isExternal
                      size="lg"
                      variant="solid"
                    >
                      Submit Now
                    </Button>
                  </Flex>
                </Box>
              </Flex>
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
