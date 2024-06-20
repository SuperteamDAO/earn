import { type Bounties } from '@prisma/client';

import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';

export const shouldSendEmailForListing = async (
  listing: Bounties,
): Promise<boolean> => {
  if (
    !listing.isPublished ||
    listing.isPrivate ||
    listing.type === 'hackathon'
  ) {
    return false;
  }

  if (
    listing.compensationType === 'fixed' &&
    listing.usdValue &&
    listing.usdValue >= 1000
  ) {
    return true;
  }

  if (listing.compensationType === 'variable') {
    return true;
  }

  if (listing.compensationType === 'range' && listing.maxRewardAsk) {
    const tokenPrice = await fetchTokenUSDValue(
      listing.token!,
      listing.publishedAt!,
    );
    const actualPrice = listing.maxRewardAsk * tokenPrice;
    return actualPrice >= 1000;
  }

  return false;
};
