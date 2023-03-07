import { Box, HStack, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React from 'react';
import { Comments } from '../../../components/listings/listings/comments';
import { DetailDescription } from '../../../components/listings/listings/details/detailDescription';
import { DetailSideCard } from '../../../components/listings/listings/details/detailSideCard';
import { ListingHeader } from '../../../components/listings/listings/ListingHeader';
import { Submission } from '../../../components/listings/listings/submissions/submission';
import { PrizeListType } from '../../../interface/listings';
import { SponsorType } from '../../../interface/sponsor';
import { findBouties } from '../../../utils/functions';

const defalutSponsor: SponsorType = {
  bio: '',
  email: '',
  industry: '',
  logo: '',
  name: 'default',
  publickey: '',
  twitter: '',
  type: 'Admin',
  url: '',
  username: '',
  verified: false,
  id: '',
  orgId: '',
};
const Bounties = () => {
  const router = useRouter();
  // const listingInfo = useQuery({
  //   queryFn: ({ queryKey }) => findBouties((queryKey[1] as string) ?? ''),
  //   queryKey: ['bounties', router.query.id ?? ''],
  // });
  // let total = 0;
  // const prizes = Object.values(
  //   (listingInfo.data?.listing.prizeList as PrizeListType) ?? {}
  // );
  // prizes.forEach((el) => {
  //   total += Number(el);
  // });
  return (
    <>
      {/* <ListingHeader
        title={listingInfo.data?.listing?.title ?? ''}
        sponsor={
          !listingInfo.data?.sponsor
            ? (listingInfo.data?.sponsor as SponsorType)
            : defalutSponsor
        }
      />
      {router.query.submission ? (
        <HStack
          maxW={'7xl'}
          mx={'auto'}
          align={['center', 'center', 'start', 'start']}
          gap={4}
          flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
          justify={['center', 'center', 'space-between', 'space-between']}
        >
          <Submission />
        </HStack>
      ) : (
        <HStack
          maxW={'7xl'}
          mx={'auto'}
          align={['center', 'center', 'start', 'start']}
          gap={4}
          flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
          justify={['center', 'center', 'space-between', 'space-between']}
        >
          <VStack gap={8} w={['22rem', '22rem', 'full', 'full']} mt={10}>
            <DetailDescription />
            <Comments />
          </VStack>
          <DetailSideCard
            prizeList={listingInfo.data?.listing.prizeList as PrizeListType}
            total={total}
          />
        </HStack>
      )} */}
    </>
  );
};

export default Bounties;
