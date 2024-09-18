import { Box } from '@chakra-ui/react';
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
    <ListingPageLayout isTemplate bounty={bounty}>
      {bounty?.isWinnersAnnounced && (
        <Box display={{ base: 'none', md: 'block' }} w="full" mt={6}>
          <ListingWinners bounty={bounty} />
        </Box>
      )}
      <DescriptionUI description={bounty?.description} />
    </ListingPageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;

  let bountyData;
  try {
    const bountyDetails = await axios.get(
      `${getURL()}api/listings/templates/${slug}/`,
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
