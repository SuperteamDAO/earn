import axios from 'axios';
import type { GetServerSideProps } from 'next';
import React, { useState } from 'react';

import { type Listing, SubmissionList } from '@/features/listings';
import type { SubmissionWithUser } from '@/interface/submission';
import { ListingPageLayout } from '@/layouts/Listing';
import { getURL } from '@/utils/validUrl';

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
      const bountyDetails = await axios.get(
        `/api/listings/submissions/${slug}`,
      );
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
  const { slug, type } = context.query;

  let bountyData;
  try {
    const bountyDetails = await axios.get(
      `${getURL()}api/listings/submissions/${slug}`,
      {
        params: { type },
      },
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
