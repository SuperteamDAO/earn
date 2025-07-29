import { type Prisma, type Sponsors } from '@prisma/client';
import { franc } from 'franc';

import logger from '@/lib/logger';
import { cleanSkills } from '@/utils/cleanSkills';

import { type ListingWithSponsor } from '@/features/auth/utils/checkListingSponsorAuth';
import { type ListingFormData } from '@/features/listing-builder/types';
import { isFndnPayingCheck } from '@/features/listing-builder/utils/isFndnPayingCheck';
import { listingUsdCalculator } from '@/features/listing-builder/utils/listingUsdCalculator';

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

interface TransformToPrismaDataProps {
  validatedListing: ListingFormData;
  listing: ListingWithSponsor;
  sponsor: Sponsors;
  isEditing: boolean;
  isVerifying?: boolean;
}

export const transformToPrismaData = async ({
  validatedListing,
  listing,
  sponsor,
  isEditing,
  isVerifying = false,
}: TransformToPrismaDataProps): Promise<Prisma.BountiesUncheckedUpdateInput> => {
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
    hackathonId,
    referredBy,
  } = validatedListing;

  const skills = processSkills(validatedListing.skills);
  const language = detectLanguage(description);
  const isFndnPaying = isFndnPayingCheck({
    sponsor,
    validatedListing,
  });

  const usdValue = await listingUsdCalculator({
    validatedListing,
    isVerifying,
  });

  const baseData: Prisma.BountiesUncheckedUpdateInput = {
    title,
    usdValue,
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
    language,
    isFndnPaying,
    hackathonId,
    referredBy,
    sponsorId: listing.sponsorId,
  };

  if (isEditing) {
    const maxBonusSpots = processMaxBonusSpots(
      listing.maxBonusSpots,
      validatedListing.maxBonusSpots,
    );

    return {
      ...baseData,
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
