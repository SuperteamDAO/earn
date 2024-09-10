import { HStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import React from 'react';

import {
  type Listing,
  submissionDetailsQuery,
  SubmissionPage,
} from '@/features/listings';
import { type User } from '@/interface/user';
import { ListingPageLayout } from '@/layouts/Listing';
import { getURL } from '@/utils/validUrl';

interface BountyDetailsProps {
  slug: string;
  subid: string;
  bounty: Listing;
}
const Sumbissions = ({ subid, bounty }: BountyDetailsProps) => {
  const { data: submission, isLoading: submissionIsLoading } = useQuery(
    submissionDetailsQuery({ submissionId: subid }),
  );
  return (
    <ListingPageLayout bounty={bounty}>
      {bounty && (
        <HStack
          align={['center', 'center', 'start', 'start']}
          justify={['center', 'center', 'space-between', 'space-between']}
          flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
          gap={4}
          mb={10}
        >
          <SubmissionPage
            isLoading={submissionIsLoading}
            bounty={bounty}
            submission={submission || undefined}
            user={submission?.user as User}
            link={submission?.link as string}
          />
        </HStack>
      )}
    </ListingPageLayout>
  );
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug, subid, type } = context.query;

  let bountyData;
  try {
    const bountyDetails = await axios.get(
      `${getURL()}api/listings/details/${slug}`,
      {
        params: { type },
      },
    );
    bountyData = bountyDetails.data;
  } catch (e) {
    console.error(e);
    bountyData = null;
  }

  return {
    props: {
      slug,
      subid,
      bounty: bountyData,
    },
  };
};

export default Sumbissions;
