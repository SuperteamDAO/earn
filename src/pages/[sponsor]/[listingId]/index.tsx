import type { GetServerSideProps } from 'next';

import { ListingPageLayout } from '@/layouts/Listing';
import { api } from '@/lib/api';
import { getURL } from '@/utils/validUrl';

import { ListingPop } from '@/features/conversion-popups/components/ListingPop';
import { DescriptionUI } from '@/features/listings/components/ListingPage/DescriptionUI';
import { ListingWinners } from '@/features/listings/components/ListingPage/ListingWinners';
import { type Listing } from '@/features/listings/types';

interface BountyDetailsProps {
  bounty: Listing | null;
}

function BountyDetails({ bounty: bounty }: BountyDetailsProps) {
  return (
    <ListingPageLayout bounty={bounty}>
      <ListingPop listing={bounty} />
      {bounty?.isWinnersAnnounced && (
        <div className="mt-6 hidden w-full md:block">
          <ListingWinners bounty={bounty} />
        </div>
      )}
      <DescriptionUI description={bounty?.description} />
    </ListingPageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { sponsor, listingId } = context.query;

  let bountyData;
  try {
    const bountyDetails = await api.get(
      `${getURL()}api/listings/details/by-sponsor-and-id/${sponsor}/${listingId}`,
    );
    bountyData = bountyDetails.data;
  } catch (e) {
    console.error(e);
    bountyData = null;
  }

  if (!bountyData) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      bounty: bountyData,
    },
  };
};
export default BountyDetails;
