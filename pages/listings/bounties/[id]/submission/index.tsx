import { HStack } from '@chakra-ui/react';
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query';
import console from 'console';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React from 'react';

import { ListingHeader } from '../../../../../components/listings/listings/ListingHeader';
import { Submission } from '../../../../../components/listings/listings/submissions/submission';
import type { SponsorType } from '../../../../../interface/sponsor';
import { findBouties } from '../../../../../utils/functions';

const SubmissionPage = () => {
  const router = useRouter();
  const listingInfo = useQuery(['bounties', router.query.id], () =>
    findBouties(router.query.id as string)
  );
  return (
    <>
      <ListingHeader
        eligibility={listingInfo.data?.listing.eligibility as any}
        endTime={listingInfo.data?.listing.deadline ?? ''}
        sub={listingInfo.data?.listing.subscribe}
        id={listingInfo.data?.listing.id as string}
        tabs={true}
        title={listingInfo.data?.listing?.title ?? ''}
        sponsor={listingInfo.data?.sponsor as SponsorType}
      />
      <HStack
        align={['center', 'center', 'start', 'start']}
        justify={['center', 'center', 'space-between', 'space-between']}
        flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
        gap={4}
        maxW={'7xl'}
        mx={'auto'}
      >
        <Submission
          endTime={listingInfo.data?.listing.deadline ?? ''}
          submissions={listingInfo.data?.listing.submission ?? []}
        />
      </HStack>
    </>
  );
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const queryClient = new QueryClient();
  const { id } = context.query;

  try {
    await queryClient.fetchQuery(['bounties', id], () =>
      findBouties(id as string)
    );
  } catch (error) {
    console.log(error);
  }
  return {
    props: { dehydratedState: dehydrate(queryClient) },
  };
};

export default SubmissionPage;
