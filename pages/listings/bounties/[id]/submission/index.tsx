import { HStack } from '@chakra-ui/react';
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React from 'react';
import { ListingHeader } from '../../../../../components/listings/listings/ListingHeader';
import { Submission } from '../../../../../components/listings/listings/submissions/submission';
import { SponsorType } from '../../../../../interface/sponsor';
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
        maxW={'7xl'}
        mx={'auto'}
        align={['center', 'center', 'start', 'start']}
        gap={4}
        flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
        justify={['center', 'center', 'space-between', 'space-between']}
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

  let isError = false;
  try {
    const res = await queryClient.fetchQuery(['bounties', id], () =>
      findBouties(id as string)
    );
  } catch (error) {
    isError;
    console.log(error);
  }
  return {
    props: { dehydratedState: dehydrate(queryClient) },
  };
};

export default SubmissionPage;
