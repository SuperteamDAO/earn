import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React from 'react';

import { ListingHeader } from '../../../../../components/listings/listings/ListingHeader';
import { SubmissionPage } from '../../../../../components/listings/listings/submissions/submissionPage';
import type { SponsorType } from '../../../../../interface/sponsor';
import { findBouties } from '../../../../../utils/functions';

const defalutSponsor: SponsorType = {
  bio: '',
  industry: '',
  logo: '',
  name: 'default',
  twitter: '',
  url: '',
  slug: '',
  id: '',
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
export default Sumbissions;
