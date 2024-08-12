import {} from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';

import {
  DescriptionUI,
  type Listing,
  ListingWinners,
} from '@/features/listings';
import { ListingPageLayout } from '@/layouts/Listing';
import { getURL } from '@/utils/validUrl';

interface BountyDetailsProps {
  bounty: Listing | null;
}

function BountyDetails({ bounty: bounty }: BountyDetailsProps) {
  return (
    <ListingPageLayout bounty={bounty}>
      {bounty?.isWinnersAnnounced && <ListingWinners bounty={bounty} />}
      <DescriptionUI description={bounty?.description} />
    </ListingPageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug, type } = context.query;

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
      bounty: bountyData,
    },
  };
};

export default BountyDetails;
