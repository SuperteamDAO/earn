import { franc } from 'franc';

import { tokenList } from '@/constants/tokenList';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { type BountiesUncheckedUpdateInput } from '@/prisma/models/Bounties';
import { type SponsorsModel } from '@/prisma/models/Sponsors';
import { cleanSkills } from '@/utils/cleanSkills';

import { type ListingWithSponsor } from '@/features/auth/utils/checkListingSponsorAuth';
import { FEATURED_USD_THRESHOLD } from '@/features/listing-builder/components/Form/Boost/constants';
import { hasMoreThan72HoursLeft } from '@/features/listing-builder/components/Form/Boost/utils';
import { type ListingFormData } from '@/features/listing-builder/types';
import { buildFeaturedAvailabilityWhere } from '@/features/listing-builder/utils/featured-availability';
import { isFndnPayingCheck } from '@/features/listing-builder/utils/isFndnPayingCheck';
import { fetchTokenUSDValue } from '@/features/wallet/utils/fetchTokenUSDValue';

const processSkills = (skills: ListingFormData['skills']) => {
  const cleanedSkills = skills ? cleanSkills(skills) : [];
  logger.info('Listings Skills Cleaned ', {
    previousSkills: skills,
    cleanedSkills,
  });
  return cleanedSkills;
};

const detectLanguage = (description: string) => {
  return description ? franc(description) : 'eng';
};

const processMaxBonusSpots = (
  prevMaxBonusSpots: number | null | undefined,
  newMaxBonusSpots: ListingFormData['maxBonusSpots'],
) => {
  if ((prevMaxBonusSpots || 0) > 0 && typeof newMaxBonusSpots === 'undefined') {
    logger.warn(`Listing Max Bonus Spots is reset to 0`);
    return 0;
  }
  return newMaxBonusSpots;
};

const isAutoFeatureUsdThresholdMet = (usdValue: number): boolean => {
  if (typeof usdValue !== 'number' || usdValue <= 0) return false;
  return usdValue >= FEATURED_USD_THRESHOLD - 100;
};

const countLiveFeaturedListings = async (): Promise<number> => {
  return prisma.bounties.count({
    where: buildFeaturedAvailabilityWhere(),
  });
};

interface TransformToPrismaDataProps {
  validatedListing: ListingFormData;
  listing: ListingWithSponsor;
  sponsor: SponsorsModel;
  isEditing: boolean;
  isVerifying?: boolean;
  userId?: string;
}

export const transformToPrismaData = async ({
  validatedListing,
  listing,
  sponsor,
  isEditing,
  isVerifying = false,
  userId,
}: TransformToPrismaDataProps): Promise<BountiesUncheckedUpdateInput> => {
  const {
    title,
    slug,
    deadline,
    commitmentDate,
    templateId,
    pocSocials,
    description,
    type,
    region,
    eligibility,
    rewardAmount,
    rewards,
    token,
    compensationType,
    minRewardAsk,
    maxRewardAsk,
    isPrivate,
    isPro,
    hackathonId,
    referredBy,
  } = validatedListing;

  const skills = processSkills(validatedListing.skills);
  const language = detectLanguage(description);
  const isFndnPaying = isFndnPayingCheck({
    sponsor,
    validatedListing,
  });

  const calculateRewardAmount = (
    data: ListingFormData,
  ): number | undefined | null => {
    const { compensationType, rewardAmount, minRewardAsk, maxRewardAsk } = data;

    if (compensationType === 'fixed') return rewardAmount;
    if (compensationType === 'range')
      return ((minRewardAsk || 0) + (maxRewardAsk || 0)) / 2;
    return undefined;
  };

  let tokenUsdAtPublish: number | undefined;
  let usdValue: number = 0;
  let includeUsdValue = false;
  const amount = calculateRewardAmount(validatedListing) || 0;
  const prevToken = listing.token ?? undefined;
  const nextToken = token ?? undefined;
  const tokenChanged = prevToken !== nextToken;

  if (!isVerifying) {
    if (!isEditing) {
      if (validatedListing.token && amount > 0) {
        const token = tokenList.find(
          (t) => t.tokenSymbol === validatedListing.token,
        );
        if (token?.mintAddress) {
          try {
            tokenUsdAtPublish = await fetchTokenUSDValue(token.mintAddress);
            usdValue = (tokenUsdAtPublish || 0) * amount;
            includeUsdValue = true;
          } catch (e) {
            tokenUsdAtPublish = undefined;
          }
        }
      }
    } else {
      if (listing.publishedAt && amount > 0) {
        let priceToUse = listing.tokenUsdAtPublish as number | undefined;

        if (tokenChanged && validatedListing.token) {
          const token = tokenList.find(
            (t) => t.tokenSymbol === validatedListing.token,
          );
          if (token?.mintAddress) {
            try {
              priceToUse = await fetchTokenUSDValue(token.mintAddress);
              tokenUsdAtPublish = priceToUse; // update only when token changed
            } catch (e) {}
          }
        }

        if (typeof priceToUse === 'number') {
          usdValue = priceToUse * amount;
          includeUsdValue = true;
        }
      }
    }
  }

  let autoIsFeatured = false;
  let shouldRemoveFeatured = false;
  try {
    const meetsThreshold =
      isAutoFeatureUsdThresholdMet(usdValue) &&
      hasMoreThan72HoursLeft(deadline) &&
      compensationType === 'fixed' &&
      type !== 'hackathon';

    if (meetsThreshold) {
      const liveFeaturedCount = await countLiveFeaturedListings();
      autoIsFeatured = liveFeaturedCount < 2;
    }

    if (isEditing && listing.isFeatured && !meetsThreshold) {
      shouldRemoveFeatured = true;
    }
  } catch (error) {
    logger.error('Auto-feature evaluation failed', { error });
  }

  const baseData: BountiesUncheckedUpdateInput = {
    title,
    ...(includeUsdValue ? { usdValue } : {}),
    ...(autoIsFeatured ? { isFeatured: true } : {}),
    ...(shouldRemoveFeatured ? { isFeatured: false } : {}),
    skills,
    slug,
    deadline: new Date(deadline),
    commitmentDate: new Date(commitmentDate),
    templateId: templateId || null,
    pocSocials,
    description,
    type,
    region,
    eligibility: eligibility || (isEditing ? [] : undefined),
    rewardAmount,
    rewards: rewards || (isEditing ? {} : undefined),
    token,
    compensationType,
    minRewardAsk,
    maxRewardAsk,
    isPrivate,
    isPro,
    language,
    isFndnPaying,
    hackathonId,
    referredBy,
    sponsorId: listing.sponsorId,
    publishedBy: isEditing ? listing.publishedBy : userId,
  };

  if (isEditing) {
    const maxBonusSpots = processMaxBonusSpots(
      listing.maxBonusSpots,
      validatedListing.maxBonusSpots,
    );

    return {
      ...baseData,
      ...(typeof tokenUsdAtPublish === 'number' ? { tokenUsdAtPublish } : {}),
      maxBonusSpots: maxBonusSpots || 0,
      // Preserve immutable fields from existing listing
      isWinnersAnnounced: listing.isWinnersAnnounced,
      winnersAnnouncedAt: listing.winnersAnnouncedAt,
      isPublished: listing.isPublished,
      publishedAt: listing.publishedAt,
      status: isVerifying ? 'VERIFYING' : listing?.status || 'OPEN',
      id: listing.id,
    };
  } else {
    const maxBonusSpots = validatedListing.maxBonusSpots ?? undefined;

    let isPublished = true;
    let publishedAt: Date | null = new Date();
    if (isVerifying) {
      isPublished = false;
      publishedAt = null;
    }

    return {
      ...baseData,
      ...(typeof tokenUsdAtPublish === 'number' ? { tokenUsdAtPublish } : {}),
      maxBonusSpots,
      // Set initial state for new publication
      status: isVerifying ? 'VERIFYING' : 'OPEN',
      publishedAt,
      isPublished,
      isWinnersAnnounced: false,
      winnersAnnouncedAt: null,
    };
  }
};
