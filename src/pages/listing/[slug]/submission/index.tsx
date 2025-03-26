import { type GetServerSideProps } from 'next';

import { api } from '@/lib/api';
import SubmissionPage from '@/pages/[sponsor]/[listingId]/submission';
import { getURL } from '@/utils/validUrl';

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
    redirect: {
      destination: `/${bountyData?.bounty.sponsor.slug}/${bountyData?.bounty.sequentialId}/submission`,
      permanent: true,
    },
  };
};

export default SubmissionPage;
