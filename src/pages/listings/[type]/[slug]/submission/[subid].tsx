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
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState(false);

  // const [bounty, setBounty] = useState<Listing | null>(null);
  // const [submission, setSubmission] = useState<SubmissionWithUser | null>(null);

  // const getBounty = async () => {
  //   setIsLoading(true);
  //   try {
  //     const bountyDetails = await axios.post(`/api/submission/details`, {
  //       slug,
  //       submissionId: subid,
  //     });
  //
  //     setBounty(bountyDetails.data.bounty);
  //     setSubmission(bountyDetails.data.submission);
  //   } catch (e) {
  //     setError(true);
  //   }
  //   setIsLoading(false);
  // };
  //
  // useEffect(() => {
  //   if (!isLoading) return;
  //   getBounty();
  // }, []);
  return (
    <>
      <ListingPageLayout bounty={bounty}>
        {bounty && submission && (
          <HStack
            align={['center', 'center', 'start', 'start']}
            justify={['center', 'center', 'space-between', 'space-between']}
            flexDir={['column-reverse', 'column-reverse', 'row', 'row']}
            gap={4}
            maxW={'8xl'}
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
        )}
      </ListingPageLayout>
    </>
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
    console.log(bountyData.submission);
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
