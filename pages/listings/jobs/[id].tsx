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
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query';
import console from 'console';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

import { DetailDescription } from '../../../components/listings/listings/details/detailDescription';
import { ListingHeader } from '../../../components/listings/listings/ListingHeader';
import type { SponsorType } from '../../../interface/sponsor';
import { findJobs } from '../../../utils/functions';

const Jobs = () => {
  const router = useRouter();
  const listingInfo = useQuery({
    queryKey: ['jobs', router.query.id ?? ''],
    queryFn: ({ queryKey }) => findJobs(queryKey[1] as string),
  });
  return (
    <>
      <Default
        meta={
          <Meta
            title="Superteam Earn"
            description="Every Solana opportunity in one place!"
            canonical="/assets/logo/og.svg"
          />
        }
      >
        <ListingHeader
          eligibility={'premission-less'}
          sponsor={listingInfo.data?.sponsor as SponsorType}
          title={listingInfo.data?.listing.title as string}
          tabs={false}
        />
        <HStack
          align={['center', 'center', 'start', 'start']}
          justify={['center', 'center', 'space-between', 'space-between']}
          flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
          gap={4}
          maxW={'7xl'}
          mt={10}
          mx={'auto'}
        >
          <HStack w={['22rem', '22rem', 'full', 'full']}>
            <DetailDescription
              skills={
                JSON.parse(listingInfo.data?.listing.skills as string) ?? []
              }
              description={
                (listingInfo.data?.listing.description as string) ?? ''
              }
            />
          </HStack>
          <Flex
            direction={'column'}
            gap={5}
            w={['88%', '88%', '30rem', '30rem']}
            h={'15rem'}
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
                <Text color={'black'} fontSize={'lg'} fontWeight={500}>
                  {listingInfo.data?.listing.minSalary !==
                  listingInfo.data?.listing.maxSalary ? (
                    <>
                      ${listingInfo.data?.listing.minSalary}- $
                      {listingInfo.data?.listing.maxSalary}
                    </>
                  ) : (
                    'negotiable'
                  )}
                </Text>
                <Text mt={'0px !important'} color={'gray.500'}>
                  Salary
                </Text>
              </VStack>
            </HStack>
            <HStack justify={'space-between'} w={'full'} px={10}>
              <VStack align={'start'}>
                <Text color={'black'} fontSize={'lg'} fontWeight={500}>
                  {listingInfo.data?.listing.location}
                </Text>
                <Text color={'gray.500'} fontSize={'md'} fontWeight={500}>
                  Location
                </Text>
              </VStack>
              <VStack align={'start'}>
                <Text
                  color={'black'}
                  fontSize={'1.25rem'}
                  fontWeight={500}
                  textTransform={'capitalize'}
                >
                  {listingInfo.data?.listing.jobType}
                </Text>
                <Text color={'gray.500'} fontSize={'1rem'} fontWeight={500}>
                  Role
                </Text>
              </VStack>
            </HStack>
            <Box w={'full'} px={10}>
              <Button w={'full'} h={12} color={'white'} bg={'brand.purple'}>
                <Link href={listingInfo.data?.listing.link} isExternal>
                  Submit Now
                </Link>
              </Button>
            </Box>
          </Flex>
        </HStack>
      </Default>
    </>
  );
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const queryClient = new QueryClient();
  const { id } = context.query;
  try {
    await queryClient.fetchQuery(['jobs', id], () => findJobs(id as string));
  } catch (error) {
    console.log(error);
  }
  return {
    props: { dehydratedState: dehydrate(queryClient) },
  };
};
export default Jobs;
