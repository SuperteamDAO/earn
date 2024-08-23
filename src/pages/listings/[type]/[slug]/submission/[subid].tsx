import { HStack } from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import React from 'react';

import { type Listing, SubmissionPage } from '@/features/listings';
import type { SubmissionWithUser } from '@/interface/submission';
import { type User } from '@/interface/user';
import { ListingPageLayout } from '@/layouts/Listing';
import { getURL } from '@/utils/validUrl';

interface BountyDetailsProps {
  bounty: Listing;
  submission: SubmissionWithUser;
}
const Sumbissions = ({ bounty, submission }: BountyDetailsProps) => {
  return (
    <ListingPageLayout bounty={bounty}>
      {bounty && submission && (
        <HStack
          align={['center', 'center', 'start', 'start']}
          justify={['center', 'center', 'space-between', 'space-between']}
          flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
          gap={4}
          mb={10}
        >
          <SubmissionPage
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
  const { slug, subid } = context.query;

  let bountyData;
  try {
    const bountyDetails = await axios.post(
      `${getURL()}api/submission/details`,
      {
        slug,
        submissionId: subid,
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

export default Sumbissions;
