import { HStack } from '@chakra-ui/react';
import { Regions, type User } from '@prisma/client';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import React, { useEffect, useState } from 'react';

import { EmptySection } from '@/components/shared/EmptySection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import {
  type Bounty,
  ListingHeader,
  SubmissionPage,
} from '@/features/listings';
import type { SponsorType } from '@/interface/sponsor';
import type { SubmissionWithUser } from '@/interface/submission';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

interface BountyDetailsProps {
  slug: string;
  subid: string;
}
const Sumbissions = ({ slug, subid }: BountyDetailsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [submission, setSubmission] = useState<SubmissionWithUser | null>(null);

  const getBounty = async () => {
    setIsLoading(true);
    try {
      const bountyDetails = await axios.post(
        `/api/bounties/submission/bounty`,
        {
          slug,
          submissionId: subid,
        },
      );

      setBounty(bountyDetails.data.bounty);
      setSubmission(bountyDetails.data.submission);
    } catch (e) {
      setError(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isLoading) return;
    getBounty();
  }, []);
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
            <ListingHeader
              region={(bounty?.region as Regions) || Regions.GLOBAL}
              id={bounty?.id}
              status={bounty?.status}
              deadline={bounty?.deadline}
              title={bounty?.title ?? ''}
              sponsor={bounty?.sponsor as SponsorType}
              slug={bounty?.slug}
              type={bounty?.type}
              isWinnersAnnounced={bounty?.isWinnersAnnounced}
              references={bounty?.references}
              publishedAt={bounty?.publishedAt}
              isPublished={bounty?.isPublished}
            />
            <HStack
              align={['center', 'center', 'start', 'start']}
              justify={['center', 'center', 'space-between', 'space-between']}
              flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
              gap={4}
              maxW={'7xl'}
              mx={'auto'}
              mb={10}
            >
              <SubmissionPage
                bounty={bounty}
                submission={submission || undefined}
                user={submission?.user as User}
                link={submission?.link as string}
              />
            </HStack>
          </>
        )}
      </Default>
    </>
  );
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug, subid } = context.query;
  return {
    props: { slug, subid },
  };
};

export default Sumbissions;
