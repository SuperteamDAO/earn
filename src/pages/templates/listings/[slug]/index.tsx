import type { GetServerSideProps } from 'next';

import { ListingPageLayout } from '@/layouts/Listing';
import { api } from '@/lib/api';
import { getURL } from '@/utils/validUrl';

import { DescriptionUI } from '@/features/listings/components/ListingPage/DescriptionUI';
import { ListingWinners } from '@/features/listings/components/ListingPage/ListingWinners';
import { type Listing } from '@/features/listings/types';

interface BountyDetailsProps {
  bounty: Listing | null;
}

function BountyDetails({ bounty: bounty }: BountyDetailsProps) {
  return (
    <ListingPageLayout isTemplate listing={bounty}>
      {bounty?.isWinnersAnnounced && (
        <div className="mt-6 hidden w-full md:block">
          <ListingWinners bounty={bounty} />
        </div>
      )}
      <DescriptionUI
        description={bounty?.description}
        isPro={bounty?.isPro ?? false}
      />
    </ListingPageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;

  let bountyData;
  try {
    const bountyDetails = await api.get(
      `${getURL()}api/sponsor-dashboard/templates/${slug}/`,
    );
    bountyData = bountyDetails.data;
  } catch (e) {
    console.error(JSON.stringify(e, null, 2));
    bountyData = null;
  }

  return {
    props: {
      bounty: bountyData,
    },
  };
};

export default BountyDetails;
