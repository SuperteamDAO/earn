import { type GetServerSideProps } from 'next';

import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';
import SubmissionPage from '@/pages/[sponsor]/[listingId]/[submissionId]';
import { getSubmissionUrl } from '@/utils/bounty-urls';
import { getURL } from '@/utils/validUrl';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug, id } = context.query;

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

  const submission =
    bountyData?.submission.find(
      (submission: SubmissionWithUser) => submission.id === id,
    ) ?? null;

  if (!submission) {
    return {
      notFound: true,
    };
  }

  return {
    redirect: {
      destination: getSubmissionUrl(submission, bountyData?.bounty),
      permanent: true,
    },
  };
};
export default SubmissionPage;
