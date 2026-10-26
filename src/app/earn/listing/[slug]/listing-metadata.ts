import type { Metadata } from 'next';

import { pageMetadata } from '@/lib/metadata';
import { publicEnv } from '@/lib/public-env';

import type { PublicListingDetails } from '@/features/listings/types';
import { getListingTypeLabel } from '@/features/listings/utils/status';

const siteUrl = (path: string) =>
  new URL(
    path,
    publicEnv.siteUrl.endsWith('/')
      ? publicEnv.siteUrl
      : `${publicEnv.siteUrl}/`,
  ).toString();

// Earn's listing <head> (layouts/Listing's Meta): title, description,
// canonical, the listing's own card image, and noindex for private listings
// and previews.
export function listingMetadata(
  listing: PublicListingDetails | null,
  {
    slug,
    preview,
    noIndex = false,
  }: { slug: string; preview: boolean; noIndex?: boolean },
): Metadata {
  const ogImage = new URL(siteUrl('api/dynamic-og/listing/'));
  if (preview && slug) {
    ogImage.searchParams.set('preview', '1');
    ogImage.searchParams.set('slug', slug);
  }
  ogImage.searchParams.set('title', listing?.title || '');
  ogImage.searchParams.set('reward', listing?.rewardAmount?.toString() || '');
  ogImage.searchParams.set('token', listing?.token || '');
  ogImage.searchParams.set('sponsor', listing?.sponsor?.name || '');
  ogImage.searchParams.set('logo', listing?.sponsor?.logo || '');
  ogImage.searchParams.set('type', listing?.type || '');
  ogImage.searchParams.set('compensationType', listing?.compensationType || '');
  ogImage.searchParams.set(
    'minRewardAsk',
    listing?.minRewardAsk?.toString() || '',
  );
  ogImage.searchParams.set(
    'maxRewardAsk',
    listing?.maxRewardAsk?.toString() || '',
  );
  ogImage.searchParams.set(
    'isSponsorVerified',
    listing?.sponsor?.isVerified?.toString() || 'false',
  );

  const shareTitle = `${listing?.title || 'Listing'} | Superteam Earn`;
  const imageAlt = `${listing?.title || 'Listing'} - ${listing?.type === 'hackathon' ? 'Hackathon Track' : 'Bounty'} by ${listing?.sponsor?.name || 'Sponsor'} on Superteam Earn`;
  const base = pageMetadata({
    title: `${listing?.title || 'Apply'} by ${listing?.sponsor?.name} | Superteam Earn Listing`,
    description: `${getListingTypeLabel(listing?.type ?? 'Listing')} on Superteam Earn | ${
      listing?.sponsor?.name
    } is seeking freelancers and builders ${
      listing?.title ? `to work on ${listing.title}` : '| Apply Here'
    }`,
    canonical: listing?.slug
      ? siteUrl(`earn/listing/${listing.slug}/`)
      : undefined,
    og: ogImage.toString(),
    noIndex: noIndex || !!listing?.isPrivate || preview,
  });
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      title: shareTitle,
      images: [
        { url: ogImage.toString(), width: 1200, height: 630, alt: imageAlt },
      ],
    },
    twitter: {
      ...base.twitter,
      title: shareTitle,
      images: [ogImage.toString()],
    },
  };
}
