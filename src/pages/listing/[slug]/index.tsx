import {
  dehydrate,
  type DehydratedState,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import { ListingPageLayout } from '@/layouts/Listing';
import { getSubmissionCount } from '@/pages/api/listings/[listingId]/submission-count';
import { getListingDetailsBySlug } from '@/pages/api/listings/details/[slug]';

import { ListingPop } from '@/features/conversion-popups/components/ListingPop';
import { DescriptionUI } from '@/features/listings/components/ListingPage/DescriptionUI';
import { ListingWinners } from '@/features/listings/components/ListingPage/ListingWinners';
import { submissionCountQuery } from '@/features/listings/queries/submission-count';
import { type Listing } from '@/features/listings/types';

interface ListingDetailsProps {
  listing: Listing | null;
  dehydratedState: DehydratedState;
}

function ListingDetails({
  listing: initialListing,
  dehydratedState,
}: ListingDetailsProps) {
  return (
    <>
      <HydrationBoundary state={dehydratedState}>
        {initialListing?.isPrivate && (
          <Head>
            <meta name="robots" content="noindex, nofollow" />
            <meta name="googlebot" content="noindex, nofollow" />
          </Head>
        )}
        <ListingPageLayout listing={initialListing}>
          <ListingPop listing={initialListing} />
          {initialListing?.isWinnersAnnounced && (
            <div className="mt-6 hidden w-full md:block">
              <ListingWinners bounty={initialListing} />
            </div>
          )}
          {initialListing?.Hackathon?.slug === 'redacted' && (
            <ExternalImage
              src="/hackathon/redacted/redacted-listing-banner"
              alt="Redacted Listing Banner"
              className="mt-4"
            />
          )}
          <DescriptionUI description={initialListing?.description} />
        </ListingPageLayout>
      </HydrationBoundary>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  let listingData;
  try {
    listingData = await getListingDetailsBySlug(String(slug));
  } catch (e) {
    console.error(e);
    listingData = null;
  }
  const queryClient = new QueryClient();
  if (listingData?.id) {
    await queryClient.prefetchQuery({
      ...submissionCountQuery(listingData.id),
      queryFn: () => getSubmissionCount(listingData.id),
    });
  }
  return {
    props: {
      listing: listingData,
      dehydratedState: dehydrate(queryClient),
    },
  };
};
export default ListingDetails;
