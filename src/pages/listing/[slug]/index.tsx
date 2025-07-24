import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import { ExternalImage } from '@/components/ui/cloudinary-image';
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
  return (
    <>
      {initialBounty?.isPrivate && (
        <Head>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="googlebot" content="noindex, nofollow" />
        </Head>
      )}
      <ListingPageLayout bounty={initialBounty}>
        <ListingPop listing={initialBounty} />
        {initialBounty?.isWinnersAnnounced && (
          <div className="mt-6 hidden w-full md:block">
            <ListingWinners bounty={initialBounty} />
          </div>
        )}
        {initialBounty?.Hackathon?.slug === 'redacted' && (
          <ExternalImage
            src="/hackathon/redacted/redacted-listing-banner"
            alt="Redacted Listing Banner"
            className="mt-4"
          />
        )}
        <DescriptionUI description={initialBounty?.description} />
      </ListingPageLayout>
    </>
  );
}

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
    props: {
      bounty: bountyData,
    },
  };
};
export default BountyDetails;
