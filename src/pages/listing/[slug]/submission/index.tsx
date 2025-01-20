import type { GetServerSideProps } from 'next';
import React, { useState } from 'react';

import type { SubmissionWithUser } from '@/interface/submission';
import { ListingPageLayout } from '@/layouts/Listing';
import { api } from '@/lib/api';
import { getURL } from '@/utils/validUrl';

import { SubmissionList } from '@/features/listings/components/SubmissionsPage/SubmissionList';
import { type Listing } from '@/features/listings/types';

const SubmissionPage = ({
  slug,
  bounty: bountyB,
  submission: submissionB,
}: {
  slug: string;
  bounty: Listing;
  submission: SubmissionWithUser[];
}) => {
  const [bounty] = useState<Listing>(bountyB);
  const [submission, setSubmission] =
    useState<SubmissionWithUser[]>(submissionB);

  const resetSubmissions = async () => {
    try {
      const bountyDetails = await api.get(`/api/listings/submissions/${slug}`);
      setSubmission(bountyDetails.data.submission);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <ListingPageLayout bounty={bounty}>
      {bounty && submission && (
        <SubmissionList
          bounty={bounty}
          setUpdate={resetSubmissions}
          submissions={submission}
          endTime={bounty.deadline as string}
        />
      )}
    </ListingPageLayout>
  );
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;

  let bountyData;
  try {
    const bountyDetails = await api.get(
      `${getURL()}api/listings/submissions/${slug}`,
    );
    bountyData = bountyDetails.data;
  } catch (e) {
    console.log(e);
    bountyData = null;
  }

  return {
    props: {
      slug,
      bounty: bountyData.bounty,
      submission: bountyData.submission,
    },
  };
};
export default SubmissionPage;
