import * as Effect from 'effect/Effect';
import type { Metadata } from 'next';
import { cache } from 'react';

import { ListingPageLayout } from '@/layouts/Listing';
import * as ListingTemplates from '@/server/listing-templates';
import { runtime } from '@/server/runtime';
import { normalizeCanonicalUrl } from '@/utils/canonical';
import { getURL } from '@/utils/validUrl';

import { DescriptionUI } from '@/features/listings/components/ListingPage/DescriptionUI';
import type { Listing } from '@/features/listings/types';
import { getListingTypeLabel } from '@/features/listings/utils/status';

// Revalidated as Earn cached it (s-maxage=60).
export const revalidate = 60;

const loadTemplate = cache((slug: string) =>
  runtime.runPromise(
    ListingTemplates.ListingTemplates.use((templates) =>
      templates.details(slug),
    ).pipe(Effect.orElseSucceed(() => null)),
  ),
);

// The template as Earn's listing page reads a listing (its API's JSON).
const asListing = (
  template: NonNullable<Awaited<ReturnType<typeof loadTemplate>>>,
): Listing =>
  // A template has a listing's fields; JSON makes its dates strings.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  JSON.parse(JSON.stringify(template)) as Listing;

export async function generateMetadata({
  params,
}: PageProps<'/earn/templates/listings/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const template = await loadTemplate(slug);
  const listing = template ? asListing(template) : null;
  // Earn's listing page head (layouts/Listing.tsx) for a template.
  const og = new URL(`${getURL()}api/dynamic-og/listing/`);
  og.searchParams.set('title', listing?.title || '');
  og.searchParams.set('reward', listing?.rewardAmount?.toString() || '');
  og.searchParams.set('token', listing?.token || '');
  og.searchParams.set('sponsor', listing?.sponsor?.name || '');
  og.searchParams.set('logo', listing?.sponsor?.logo || '');
  og.searchParams.set('type', listing?.type || '');
  og.searchParams.set('compensationType', listing?.compensationType || '');
  og.searchParams.set('minRewardAsk', listing?.minRewardAsk?.toString() || '');
  og.searchParams.set('maxRewardAsk', listing?.maxRewardAsk?.toString() || '');
  og.searchParams.set(
    'isSponsorVerified',
    listing?.sponsor?.isVerified?.toString() || 'false',
  );
  const canonical = listing?.slug
    ? normalizeCanonicalUrl(`${getURL()}earn/listing/${listing.slug}/`)
    : undefined;
  const ogTitle = `${listing?.title || 'Listing'} | Superteam Earn`;
  return {
    title: {
      absolute: `${listing?.title || 'Apply'} by ${listing?.sponsor?.name} | Superteam Earn Listing`,
    },
    description: `${getListingTypeLabel(listing?.type ?? 'Listing')} on Superteam Earn | ${
      listing?.sponsor?.name
    } is seeking freelancers and builders ${
      listing?.title ? `to work on ${listing.title}` : '| Apply Here'
    }`,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title: ogTitle,
      ...(canonical ? { url: canonical } : {}),
      type: 'website',
      images: [
        {
          url: og.toString(),
          width: 1200,
          height: 630,
          alt: `${listing?.title || 'Listing'} - ${listing?.type === 'hackathon' ? 'Hackathon Track' : 'Bounty'} by ${listing?.sponsor?.name || 'Sponsor'} on Superteam Earn`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      images: [og.toString()],
    },
  };
}

// A listing template's preview, as a listing page.
export default async function TemplatePage({
  params,
}: PageProps<'/earn/templates/listings/[slug]'>) {
  const { slug } = await params;
  const template = await loadTemplate(slug);
  const bounty = template ? asListing(template) : null;
  return (
    <ListingPageLayout isTemplate listing={bounty}>
      <DescriptionUI
        description={bounty?.description}
        sponsorId={bounty?.sponsorId ?? ''}
      />
    </ListingPageLayout>
  );
}
