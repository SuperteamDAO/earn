import { calculateTotalPrizes } from '@/features/listing-builder/utils/rewards';

import { type Rewards } from '../types';
import { isDeadlineOver } from './deadline';

export const getListingDraftStatus = (
  status: string | null | undefined,
  isPublished: boolean | null | undefined,
) => {
  if (status === 'CLOSED') return 'CLOSED';
  if (status === 'REVIEW') return 'REVIEW';
  if (status === 'VERIFYING') return 'VERIFYING';
  if (status === 'VERIFY_FAIL') return 'VERIFY_FAIL';
  if (isPublished) return 'PUBLISHED';
  return 'DRAFT';
};

export const getListingTypeLabel = (type: string) => {
  if (type === 'project') return 'Project';
  if (type === 'hackathon') return 'Hackathon';
  if (type === 'bounty') return 'Bounty';
  if (type === 'grant') return 'Grant';
  return;
};

// The fields getListingStatus reads; callers pass bounties, grants and drafts.
interface ListingStatusInput {
  type?: string;
  status?: string | null;
  isPublished?: boolean | null;
  publishedAt?: string | Date | null;
  deadline?: string | Date | null;
  rewards?: Rewards | null;
  maxBonusSpots?: number | null;
  isWinnersAnnounced?: boolean | null;
  totalPaymentsMade?: number | null;
  isFndnPaying?: boolean | null;
}

export const getListingStatus = (
  listing: ListingStatusInput | null | undefined,
  isGrant?: boolean,
) => {
  if (!listing) return 'Draft';

  const listingStatus = getListingDraftStatus(
    listing?.status,
    listing?.isPublished,
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
