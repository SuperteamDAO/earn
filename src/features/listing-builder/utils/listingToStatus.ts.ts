import { type ListingFormData, type ListingStatus } from '../types';
import { calculateTotalPrizes } from './rewards';

export const listingToStatus = (listing: ListingFormData): ListingStatus => {
  if (listing.status === 'OPEN') {
    if (listing.isPublished) {
      if (listing.isWinnersAnnounced) {
        if (
          calculateTotalPrizes(
            listing?.rewards ?? {},
            listing?.maxBonusSpots || 0,
          ) !== listing.totalPaymentsMade
        ) {
          return 'payment pending';
        } else {
          return 'completed';
        }
      }
      return 'published';
    } else {
      if (!!listing.publishedAt) {
        return 'unpublished';
      } else {
        return 'draft';
      }
    }
  } else if (listing.status === 'VERIFYING') {
    return 'verifying';
  }
  return 'draft';
};
