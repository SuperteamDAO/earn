import type { GetServerSideProps } from 'next';
import React, { useState } from 'react';

import type { SubmissionWithUser } from '@/interface/submission';
import { ListingPageLayout } from '@/layouts/Listing';
import { api } from '@/lib/api';
import { getURL } from '@/utils/validUrl';

import { SubmissionTable } from '@/features/listings/components/SubmissionsPage/SubmissionTable';
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
        <SubmissionTable
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
  const { sponsor, listingId } = context.query;

  let bountyData;
  let slug;
  try {
    const bountyDetails = await api.get(
      `${getURL()}api/listings/details/by-sponsor-and-id/${sponsor}/${listingId}`,
    );
    slug = bountyDetails.data.slug;
    const submissions = await api.get(
      `${getURL()}api/listings/submissions/${slug}`,
    );
    bountyData = submissions.data;
  } catch (e) {
    console.log(e);
    bountyData = null;
  }

  if (!bountyData) {
    return {
      notFound: true,
    };
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
