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
import type { GetServerSideProps } from 'next';
import React, { useEffect, useState } from 'react';

import DetailDescription from '@/components/listings/listings/details/detailDescription';
import { ListingHeader } from '@/components/listings/listings/ListingHeader';
import ErrorSection from '@/components/shared/EmptySection';
import LoadingSection from '@/components/shared/LoadingSection';
import type { Grant } from '@/interface/grant';
import type { SponsorType } from '@/interface/sponsor';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { Mixpanel } from '@/utils/mixpanel';

interface GrantsDetailsProps {
  slug: string;
}

const Grants = ({ slug }: GrantsDetailsProps) => {
  const [grants, setGrants] = useState<Grant | null>(null);
  console.log(slug);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const getGrants = async () => {
    setIsLoading(true);
    try {
      const grantsDetails = await axios.get(`/api/grants/${slug}/`);
      console.log(grantsDetails.data);

      setGrants(grantsDetails.data);

      Mixpanel.track('grant_page_load', {
        'Grant Title': grantsDetails.data.title,
      });
    } catch (e) {
      setError(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isLoading) return;
    getGrants();
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
        {!isLoading && !!error && <ErrorSection />}
        {!isLoading && !error && !grants?.id && (
          <ErrorSection message="Sorry! The bounty you are looking for is not available." />
        )}
        {!isLoading && !error && !!grants?.id && (
          <>
            <ListingHeader
              id={grants?.id}
              title={grants?.title ?? ''}
              sponsor={grants?.sponsor as SponsorType}
              eligibility="permission-less"
              tabs={false}
            />
            <HStack
              align={['center', 'center', 'start', 'start']}
              justify={['center', 'center', 'space-between', 'space-between']}
              flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
              gap={4}
              maxW={'7xl'}
              minH={'100vh'}
              mt={10}
              mx={'auto'}
            >
              <HStack w={['22rem', '22rem', 'full', 'full']}>
                <DetailDescription
                  skills={grants?.skills?.map((e) => e.skills)}
                  description={(grants?.description as string) ?? ''}
                />
              </HStack>
              <Flex
                direction={'column'}
                gap={5}
                w={['20rem', '20rem', '32rem', '32rem']}
                h={'10rem'}
                bg={'white'}
                rounded={'md'}
              >
                <HStack gap={3} mt={5} px={8}>
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
                      src={'/assets/icons/green-doller.svg'}
                    />
                  </Box>
                  <VStack align={'start'}>
                    <Text color={'gray.600'} fontSize={'lg'} fontWeight={500}>
                      Upto ${(grants.rewardAmount || 0).toLocaleString()}
                    </Text>
                    <Text mt={'0px !important'} color={'gray.500'}>
                      Per Grant
                    </Text>
                  </VStack>
                </HStack>

                <Box w={'full'} px={10}>
                  <Button
                    as={Link}
                    w={'full'}
                    _hover={{
                      textDecoration: 'none',
                    }}
                    href={grants?.link}
                    isExternal
                    onClick={() => {
                      Mixpanel.track('grant_submit_click', {
                        'Grant Title': grants?.title,
                      });
                    }}
                    size="lg"
                    variant="solid"
                  >
                    Submit Now
                  </Button>
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
