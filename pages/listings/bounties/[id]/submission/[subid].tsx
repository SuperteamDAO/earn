import { HStack, list } from '@chakra-ui/react';
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React from 'react';
import { Submission } from '../../../../../components/listings/listings/submissions/submission';
import { SponsorType } from '../../../../../interface/sponsor';
import { findBouties } from '../../../../../utils/functions';
import { ListingHeader } from '../../../../../components/listings/listings/ListingHeader';
import { SubmissionPage } from '../../../../../components/listings/listings/submissions/submissionPage';

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

const Sumbissions = () => {
  const router = useRouter();
  const listingInfo = useQuery(['bounties', router.query.id], () =>
    findBouties(router.query.id as string)
  );
  return (
    <>
      <ListingHeader
        eligibility={listingInfo.data?.listing.eligibility as any}
        tabs={true}
        title={listingInfo.data?.listing?.title ?? ''}
        sponsor={
          !listingInfo.data?.sponsor
            ? (listingInfo.data?.sponsor as SponsorType)
            : defalutSponsor
        }
      />
      <SubmissionPage />
    </>
  );
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const queryClient = new QueryClient();
  const { id } = context.query;

  let isError = false;
  try {
    await queryClient.fetchQuery(['bounties', id], () =>
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
export default Sumbissions;
