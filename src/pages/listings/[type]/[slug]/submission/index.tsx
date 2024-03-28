import axios from 'axios';
import type { GetServerSideProps } from 'next';
import React, { useEffect, useState } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import {
  type Bounty,
  ListingHeader,
  SubmissionList,
} from '@/features/listings';
import type { SubmissionWithUser } from '@/interface/submission';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

const SubmissionPage = ({ slug }: { slug: string }) => {
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [submission, setSubmission] = useState<SubmissionWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [update, setUpdate] = useState(false);

  const getBounty = async () => {
    setIsLoading(true);
    try {
      const bountyDetails = await axios.get(`/api/bounties/submission/${slug}`);
      setBounty(bountyDetails.data.bounty);
      setSubmission(bountyDetails.data.submission);
    } catch (e) {
      setError(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    getBounty();
  }, [update]);
  return (
    <>
      <Default
        meta={
          <Meta
            title={`${bounty?.title || 'Bounty'} | Superteam Earn`}
            description="Every crypto opportunity in one place!"
          />
        }
      >
        {isLoading && <LoadingSection />}
        {!isLoading && !!error && <EmptySection />}
        {!isLoading && !error && !bounty?.id && (
          <EmptySection message="Sorry! The bounty you are looking for is not available." />
        )}
        {!isLoading && !error && !!bounty?.id && (
          <>
            <ListingHeader listing={bounty} />
            <SubmissionList
              bounty={bounty}
              setUpdate={setUpdate}
              submissions={submission}
              endTime={bounty.deadline as string}
            />
          </>
        )}
      </Default>
    </>
  );
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};
export default SubmissionPage;
