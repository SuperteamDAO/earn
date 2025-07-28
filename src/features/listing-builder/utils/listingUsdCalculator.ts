// used for api route, dont add use client here.
import logger from '@/lib/logger';

import { fetchHistoricalTokenUSDValue } from '@/features/wallet/utils/fetchHistoricalTokenUSDValue';

import { type ListingFormData } from '../types';

const calculateRewardAmount = (
  data: ListingFormData,
): number | undefined | null => {
  const { compensationType, rewardAmount, minRewardAsk, maxRewardAsk } = data;

  if (compensationType === 'fixed') {
    return rewardAmount;
  }

  if (compensationType === 'range') {
    return ((minRewardAsk || 0) + (maxRewardAsk || 0)) / 2;
  }

  return undefined;
};

interface ListingUsdCalculatorProps {
  validatedListing: ListingFormData;
  isVerifying: boolean;
  publishedAt?: Date;
}
export const listingUsdCalculator = async ({
  validatedListing,
  isVerifying,
  publishedAt,
}: ListingUsdCalculatorProps): Promise<number> => {
  if (isVerifying) return 0;

  if (!publishedAt) {
    publishedAt = new Date();
  }

  const { token, compensationType } = validatedListing;

  logger.info('Calculating USD value of listing', {
    token,
    compensationType,
    publishedAt,
  });

  try {
    const amount = calculateRewardAmount(validatedListing);

    if (!amount || !token) {
      logger.info('No amount or token provided, USD value set to 0', {
        amount,
        token,
      });
      return 0;
    }

    const tokenUsdValue = await fetchHistoricalTokenUSDValue(
      token,
      publishedAt,
    );

    if (typeof tokenUsdValue !== 'number') {
      throw new Error('Token value not found');
    }
    const usdValue = tokenUsdValue * amount;

    logger.info('Token USD value fetched', {
      token,
      publishedAt,
      tokenUsdValue,
      calculatedListingUSDValue: usdValue,
    });

    return usdValue;
  } catch (error) {
    logger.error('Error calculating USD value:', error);
    return 0;
  }
};
