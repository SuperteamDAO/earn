import { calculateTotalPrizes } from '@/features/listing-builder/utils/rewards';

import type { Rewards } from '../types';
import { isDeadlineOver } from './deadline';

export const getListingDraftStatus = (
  status: string | undefined,
  isPublished: boolean | undefined,
) => {
  if (status === 'CLOSED') return 'CLOSED';
  if (status === 'REVIEW') return 'REVIEW';
  if (status === 'VERIFYING') return 'VERIFYING';
  if (status === 'VERIFY_FAIL') return 'VERIFY_FAIL';
  if (isPublished) return 'PUBLISHED';
  return 'DRAFT';
};

export const getListingTypeLabel = (type: string) => {
  if (type === 'hackathon') return 'Hackathon';
  if (type === 'bounty') return 'Bounty';
  if (type === 'grant') return 'Grant';
  return undefined;
};

// What getListingStatus reads: listings, grants, hackathon tracks and the
// review page's listing all pass it.
interface ListingStatusInput {
  readonly status?: string | null;
  readonly isPublished?: boolean | null;
  readonly deadline?: string | Date | null;
  readonly rewards?: Rewards | null;
  readonly maxBonusSpots?: number | null;
  readonly publishedAt?: string | Date | null;
  readonly type?: string | null;
  readonly isWinnersAnnounced?: boolean | null;
  readonly totalPaymentsMade?: number | null;
  readonly isFndnPaying?: boolean | null;
}

export const getListingStatus = (
  listing: ListingStatusInput | null | undefined,
  isGrant?: boolean,
) => {
  if (!listing) return 'Draft';

  const listingStatus = getListingDraftStatus(
    listing?.status ?? undefined,
    listing?.isPublished ?? undefined,
  );
  const hasDeadlinePassed = isDeadlineOver(listing?.deadline || '');
  const totalWinnerRanks = calculateTotalPrizes(
    listing?.rewards ?? {},
    listing?.maxBonusSpots || 0,
  );

  if (listingStatus === 'VERIFYING') return 'Under Verification';
  if (listingStatus === 'VERIFY_FAIL') return 'Verification Failed';
  if (listingStatus === 'DRAFT') {
    if (!listing?.publishedAt) return 'Draft';
    else return 'Unpublished';
  }
  if (listing?.type === 'grant' || isGrant) return 'In Progress';

  switch (listingStatus) {
    case 'CLOSED':
      return 'Closed';
    case 'REVIEW':
    case 'PUBLISHED':
      if (!hasDeadlinePassed && !listing?.isWinnersAnnounced)
        return 'In Progress';
      if (!listing?.isWinnersAnnounced) return 'In Review';
      if (
        listing?.isWinnersAnnounced &&
        listing?.totalPaymentsMade !== totalWinnerRanks &&
        listing?.isFndnPaying
      )
        return 'Fndn to Pay';
      if (
        listing?.isWinnersAnnounced &&
        listing?.totalPaymentsMade !== totalWinnerRanks
      )
        return 'Payment Pending';
      if (
        listing?.isWinnersAnnounced &&
        (listing.totalPaymentsMade ?? 0) > 0 &&
        listing?.totalPaymentsMade === totalWinnerRanks
      )
        return 'Completed';
      return 'In Review';
    default:
      return 'Draft';
  }
};
