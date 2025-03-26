import { type GetServerSideProps } from 'next';

import { api } from '@/lib/api';
import BountyDetails from '@/pages/[sponsor]/[listingId]';
import { getURL } from '@/utils/validUrl';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;

  let bountyData;
  try {
    const bountyDetails = await api.get(
      `${getURL()}api/listings/details/${slug}`,
    );
    bountyData = bountyDetails.data;
  } catch (e) {
    console.error(e);
    bountyData = null;
  }

  return {
    redirect: {
      destination: `/${bountyData?.sponsor?.slug}/${bountyData?.sequentialId}`,
      permanent: true,
    },
  };
};
export default BountyDetails;
