import {
  dehydrate,
  type DehydratedState,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';

import { JsonLd } from '@/components/shared/JsonLd';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { ListingPageLayout } from '@/layouts/Listing';
import { getSubmissionCount } from '@/pages/api/listings/[listingId]/submission-count';
import { getWinningSubmissionsByListingId } from '@/pages/api/listings/[listingId]/winners';
import { getListingDetailsBySlug } from '@/pages/api/listings/details/[slug]';
import { prisma } from '@/prisma';
import {
  generateBreadcrumbListSchema,
  generateJobPostingSchema,
} from '@/utils/json-ld';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { ListingPop } from '@/features/conversion-popups/components/ListingPop';
import { DescriptionUI } from '@/features/listings/components/ListingPage/DescriptionUI';
import { listingWinnersQuery } from '@/features/listings/queries/listing-winners';
import { submissionCountQuery } from '@/features/listings/queries/submission-count';
import { type PublicListingDetails } from '@/features/listings/types';

const ListingWinners = dynamic(
  () =>
    import('@/features/listings/components/ListingPage/ListingWinners').then(
      (m) => m.ListingWinners,
    ),
  { ssr: false },
);

interface ListingDetailsProps {
  listing: PublicListingDetails | null;
  dehydratedState: DehydratedState;
}

function ListingDetails({
  listing: initialListing,
  dehydratedState,
}: ListingDetailsProps) {
  const jobPostingSchema = initialListing
    ? generateJobPostingSchema(initialListing)
    : null;

  const breadcrumbSchema = initialListing
    ? generateBreadcrumbListSchema([
        { name: 'Home', url: '/' },
        {
          name: initialListing.type === 'bounty' ? 'Bounties' : 'Jobs',
          url: '/earn/all',
        },
        { name: initialListing.title || 'Listing' },
      ])
    : null;

  return (
    <>
      <HydrationBoundary state={dehydratedState}>
        {initialListing?.isPrivate && (
          <Head>
            <meta name="robots" content="noindex, nofollow" />
            <meta name="googlebot" content="noindex, nofollow" />
          </Head>
        )}
        {jobPostingSchema && breadcrumbSchema && (
          <JsonLd data={[jobPostingSchema, breadcrumbSchema]} />
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
          <DescriptionUI
            description={initialListing?.description}
            isPro={
              (initialListing?.isPro ?? false) &&
              !(initialListing?.isWinnersAnnounced ?? false)
            }
            type={initialListing?.type ?? 'bounty'}
            sponsorId={initialListing?.sponsorId ?? ''}
          />
        </ListingPageLayout>
      </HydrationBoundary>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { preview, slug } = context.query;
  const { res } = context;
  let listingData: PublicListingDetails | null;
  try {
    let canViewAllUnpublished = false;
    let unpublishedSponsorIds: string[] | undefined;
    if (preview === '1') {
      const privyDid = await getPrivyToken(context.req);
      if (privyDid) {
        const previewUser = await prisma.user.findUnique({
          where: { privyDid },
          select: {
            isBlocked: true,
            role: true,
            UserSponsors: { select: { sponsorId: true } },
          },
        });
        if (!previewUser?.isBlocked) {
          canViewAllUnpublished = previewUser?.role === 'GOD';
          unpublishedSponsorIds = previewUser?.UserSponsors.map(
            ({ sponsorId }) => sponsorId,
          );
        }
      }
    }

    listingData = await getListingDetailsBySlug(String(slug), {
      canViewAllUnpublished,
      unpublishedSponsorIds,
    });
  } catch (e) {
    console.error(e);
    listingData = null;
  }
  const queryClient = new QueryClient();
  if (listingData?.id) {
    const prefetchPromises: Promise<void>[] = [
      queryClient.prefetchQuery({
        ...submissionCountQuery(listingData.id),
        queryFn: () => getSubmissionCount(listingData.id),
      }),
    ];

    if (listingData.isWinnersAnnounced) {
      prefetchPromises.push(
        queryClient.prefetchQuery({
          ...listingWinnersQuery(listingData.id),
          queryFn: () => getWinningSubmissionsByListingId(listingData.id),
        }),
      );
    }

    await Promise.all(prefetchPromises);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
  }
  return {
    props: {
      listing: listingData,
      dehydratedState: dehydrate(queryClient),
    },
  };
};
export default ListingDetails;
