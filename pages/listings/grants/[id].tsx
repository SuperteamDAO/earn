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
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React from 'react';
import { DetailDescription } from '../../../components/listings/listings/details/detailDescription';
import { ListingHeader } from '../../../components/listings/listings/ListingHeader';
import { SponsorType } from '../../../interface/sponsor';
import { findGrants } from '../../../utils/functions';

const Grants = () => {
  const router = useRouter();
  const listingInfo = useQuery({
    queryKey: ['grants', router.query.id ?? ''],
    queryFn: ({ queryKey }) => findGrants(queryKey[1] as string),
  });
  return (
    <>
      <ListingHeader
        eligibility={'premission-less'}
        sponsor={listingInfo.data?.sponsor as SponsorType}
        title={listingInfo.data?.listing.title as string}
        tabs={false}
      />
      <HStack
        maxW={'7xl'}
        mx={'auto'}
        align={['center', 'center', 'start', 'start']}
        gap={4}
        mt={10}
        flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
        justify={['center', 'center', 'space-between', 'space-between']}
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
          rounded={'md'}
          direction={'column'}
          bg={'white'}
          h={'10rem'}
          w={'32rem'}
          gap={5}
        >
          <HStack mt={5} gap={3} px={8}>
            <Box
              w={12}
              display={'flex'}
              justifyContent={'center'}
              alignItems={'center'}
              rounded={'full'}
              h={12}
              bg={'#9EFFAE2B'}
            >
              <Image
                src={'/assets/icons/green-doller.svg'}
                alt={'green doller'}
                w={4}
              />
            </Box>
            <VStack align={'start'}>
              <Text color={'#000000'} fontWeight={500} fontSize={'1.25rem'}>
                ${listingInfo.data?.listing.minSalary} - $
                {listingInfo.data?.listing.maxSalary}
              </Text>
              <Text color={'gray.500'} mt={'0px !important'}>
                Check Size
              </Text>
            </VStack>
          </HStack>

          <Box px={10} w={'full'}>
            <Button color={'white'} bg={'#6562FF'} h={12} w={'full'}>
              <Link href={listingInfo.data?.listing.contact} isExternal>
                Submit Now
              </Link>
            </Button>
          </Box>
        </Flex>
      </HStack>
    </>
  );
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const queryClient = new QueryClient();
  const { id } = context.query;

  let isError = false;
  try {
    const res = await queryClient.fetchQuery(['grants', id], () =>
      findGrants(id as string)
    );
  } catch (error) {
    isError;
    console.log(error);
  }
  return {
    props: { dehydratedState: dehydrate(queryClient) },
  };
};
export default Grants;
