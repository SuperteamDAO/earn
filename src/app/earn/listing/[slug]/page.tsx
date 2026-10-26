import { ExternalImage } from '@/components/ui/cloudinary-image';
import { ListingPageLayout, listingWinners } from '@/layouts/Listing';
import {
  generateBreadcrumbListSchema,
  generateJobPostingSchema,
} from '@/utils/json-ld';

import { DescriptionUI } from '@/features/listings/components/ListingPage/DescriptionUI';
import { ListingWinners } from '@/features/listings/components/ListingPage/ListingWinners';
import { getDescriptionHtml } from '@/features/listings/utils/description-html';

import { listingBySlug } from './listing-data';
import { listingMetadata } from './listing-metadata';

import styles from '@/styles/listing-description.module.css';

const isPreview = (
  searchParams: Record<string, string | string[] | undefined>,
) => searchParams.preview === '1';

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<'/earn/listing/[slug]'>) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const preview = isPreview(query);
  return listingMetadata(await listingBySlug(slug, preview), {
    slug,
    preview,
  });
}

export default async function ListingDetailsPage({
  params,
  searchParams,
}: PageProps<'/earn/listing/[slug]'>) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const listing = await listingBySlug(slug, isPreview(query));
  const winners = listing?.isWinnersAnnounced
    ? await listingWinners(listing.id)
    : [];

  const jsonLd = listing
    ? [
        generateJobPostingSchema(listing),
        generateBreadcrumbListSchema([
          { name: 'Home', url: '/' },
          {
            name: listing.type === 'bounty' ? 'Bounties' : 'Jobs',
            url: '/earn/all',
          },
          { name: listing.title || 'Listing' },
        ]),
      ]
    : [];

  return (
    <>
      {jsonLd.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          // oxlint-disable-next-line react/no-danger -- structured data, escaped below
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
          }}
        />
      ))}
      <ListingPageLayout listing={listing}>
        {listing?.isWinnersAnnounced && (
          <div className="mt-6 hidden w-full md:block">
            <ListingWinners bounty={listing} winners={winners} />
          </div>
        )}
        {listing?.Hackathon?.slug === 'redacted' && (
          <ExternalImage
            src="/hackathon/redacted/redacted-listing-banner"
            alt="Redacted Listing Banner"
            className="mt-4"
          />
        )}
        <DescriptionUI
          html={getDescriptionHtml(
            listing?.description,
            styles.descriptionH1 ?? '',
          )}
          sponsorId={listing?.sponsorId ?? ''}
        />
      </ListingPageLayout>
    </>
  );
}
