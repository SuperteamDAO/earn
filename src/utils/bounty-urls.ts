import { type SubmissionWithUser } from '@/interface/submission';

import { type Listing } from '@/features/listings/types';

import { getURL } from './validUrl';

export function getBountyUrlBySponsorAndId(
  sponsor: string | undefined,
  id: string | undefined,
) {
  return `${getURL()}${sponsor}/${id}`;
}

export function getBountyUrl(listing: Listing | undefined) {
  if (!listing) {
    throw new Error('Listing is undefined');
  }

  if (!listing.isPublished || listing.isPrivate) {
    return getBountyUrlBySponsorAndId(listing.sponsor?.slug, listing.id);
  }

  return getBountyUrlBySponsorAndId(
    listing.sponsor?.slug,
    listing.sequentialId?.toString(),
  );
}

export function getSubmissionUrl(
  submission: SubmissionWithUser | undefined,
  listing: Listing | undefined,
) {
  return `${getBountyUrl(listing)}/${submission?.sequentialId}`;
}
