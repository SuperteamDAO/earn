import type { GetServerSideProps } from 'next';
import { useState } from 'react';

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

function BountyDetails({ bounty: initialBounty }: BountyDetailsProps) {
  const [bounty] = useState<typeof initialBounty>(initialBounty);

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

const redirectSlugs: { original: string; redirectTo: string }[] = [
  {
    original: 'passion-piece',
    redirectTo:
      'write-a-passion-piece-about-your-favorite-solana-project-or-community',
  },
];

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;

  const redirectConfig = redirectSlugs.find(
    (redirect) => redirect.original === slug,
  );
  if (redirectConfig) {
    return {
      redirect: {
        destination: `/listing/${redirectConfig.redirectTo}`,
        permanent: true,
      },
    };
  }

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
    props: {
      bounty: bountyData,
    },
  };
};
export default BountyDetails;
