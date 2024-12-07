import { type ListingFormData, type ListingStatus } from '../types';

export * from './form';
export * from './rewards';
export * from './suggestions';

export const formatTotalPrice = (total: number) =>
  new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(total as number);

export const listingToStatus = (listing: ListingFormData): ListingStatus => {
  if (listing.status === 'OPEN') {
    if (listing.isPublished) {
      if (listing.isWinnersAnnounced) {
        if (
          listing.totalWinnersSelected &&
          listing.totalWinnersSelected !== listing.totalPaymentsMade
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
