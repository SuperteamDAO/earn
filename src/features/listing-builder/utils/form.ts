import { z } from 'zod';

import { type BountyType, type CompensationType } from '@/prisma/enums';
import { type HackathonModel } from '@/prisma/models/Hackathon';
import { dayjs } from '@/utils/dayjs';

import { type Listing } from '@/features/listings/types';

import { type GeneratedListingData } from '../atoms';
import { DEADLINE_FORMAT } from '../constants';
import { type ListingFormData } from '../types';
import { createListingFormSchema } from '../types/schema';
import { calculateTotalRewardsForPodium } from './rewards';

interface ListingDefaults {
  isGod: boolean;
  isEditing: boolean;
  isST: boolean;
  type?: BountyType;
  hackathons?: HackathonModel[];
  hackathonId?: string;
  generatedListing?: GeneratedListingData;
}

export const getListingDefaults = ({
  isGod,
  isEditing,
  isST,
  type = 'bounty',
  hackathons,
  hackathonId,
  generatedListing,
}: ListingDefaults) => {
  const schema = createListingFormSchema({
    isGod,
    isEditing,
    isST,
    hackathons,
  });

  const shape = schema.shape;

  const defaults: Record<string, any> = {};

  for (const [key, value] of Object.entries(shape)) {
    const zodValue = value as z.ZodTypeAny;

    if (zodValue instanceof z.ZodDefault) {
      defaults[key] = zodValue.parse(undefined);
    } else if (zodValue instanceof z.ZodOptional) {
      const innerType = zodValue.unwrap();
      if (innerType instanceof z.ZodObject) {
        defaults[key] = {};
      } else if (innerType instanceof z.ZodArray) {
        defaults[key] = [];
      } else if (innerType instanceof z.ZodString) {
        defaults[key] = '';
      } else if (innerType instanceof z.ZodBoolean) {
        defaults[key] = false;
      } else {
        defaults[key] = undefined;
      }
    } else if (zodValue instanceof z.ZodDefault) {
      defaults[key] = zodValue.parse(undefined);
    } else {
      if (zodValue instanceof z.ZodObject) {
        defaults[key] = {};
      } else if (zodValue instanceof z.ZodArray) {
        defaults[key] = [];
      } else if (zodValue instanceof z.ZodString) {
        defaults[key] = '';
      } else {
        defaults[key] = undefined;
      }
    }
  }

  defaults['type'] = type;
  if (type === 'hackathon') {
    const currentHackathon = hackathons?.find((s) => s.id === hackathonId);
    if (!currentHackathon) defaults['type'] = 'bounty';
    else {
      defaults['type'] = type;
      if (currentHackathon.eligibility)
        defaults['eligibility'] = currentHackathon.eligibility;
      if (currentHackathon.deadline)
        defaults['deadline'] = currentHackathon.deadline;
      defaults['hackathonId'] = hackathonId;
    }
  }
  defaults['isFndnPaying'] = false;

  if (generatedListing) {
    if (generatedListing.type) {
      defaults['type'] = generatedListing.type;
    }
    if (generatedListing.description) {
      defaults['description'] = generatedListing.description;
    }
    if (generatedListing.title) {
      defaults['title'] = generatedListing.title;
    }
    if (generatedListing.token) {
      defaults['token'] = generatedListing.token;
    }
    if (generatedListing.rewards) {
      defaults['compensationType'] = generatedListing.rewards.compensationType;
      const generatedCompensationType =
        generatedListing.rewards.compensationType;
      if (generatedCompensationType === 'fixed') {
        defaults['rewards'] = generatedListing.rewards.rewards;
        defaults['maxBonusSpots'] = generatedListing.rewards.maxBonusSpots || 0;
        const totalReward = calculateTotalRewardsForPodium(
          generatedListing.rewards.rewards || {},
          generatedListing.rewards.maxBonusSpots || 0,
        );
        defaults['rewardAmount'] = totalReward;
      } else if (generatedCompensationType === 'range') {
        defaults['minRewardAsk'] =
          generatedListing.rewards.minRewardAsk || null;
        defaults['maxRewardAsk'] =
          generatedListing.rewards.maxRewardAsk || null;
      }
    }
    if (generatedListing.skills) {
      defaults['skills'] = generatedListing.skills;
    }
    if (generatedListing.eligibilityQuestions) {
      defaults['eligibility'] = generatedListing.eligibilityQuestions;
    }
  }

  return defaults as ListingFormData;
};

export const cleanTemplate = (
  template: Listing,
  prevValues: ListingFormData,
) => {
  const reTemplate: Partial<
    Listing & { color: string; emoji: string; Bounties: string }
  > = { ...template } as any;

  reTemplate.templateId = reTemplate.id;
  reTemplate.id = prevValues.id || undefined;
  reTemplate.slug = prevValues.slug;
  reTemplate.compensationType = prevValues.compensationType;
  reTemplate.rewards = prevValues.rewards || undefined;
  reTemplate.deadline = prevValues.deadline;
  reTemplate.commitmentDate = prevValues.commitmentDate;
  reTemplate.maxBonusSpots = prevValues.maxBonusSpots || undefined;
  reTemplate.minRewardAsk = prevValues.minRewardAsk || undefined;
  reTemplate.maxRewardAsk = prevValues.maxRewardAsk || undefined;
  reTemplate.pocSocials = prevValues.pocSocials;
  reTemplate.rewardAmount = prevValues.rewardAmount || undefined;
  reTemplate.rewards = prevValues.rewards || undefined;
  reTemplate.region = prevValues.region;
  reTemplate.isPrivate = prevValues.isPrivate;
  reTemplate.isFndnPaying = prevValues.isFndnPaying;
  reTemplate.hackathonId = prevValues.hackathonId || undefined;
  reTemplate.eligibility = (prevValues.eligibility as any) || undefined;

  delete reTemplate.isFeatured;
  delete reTemplate.isActive;
  delete reTemplate.isArchived;
  delete reTemplate.applicationType;
  delete reTemplate.isPublished;
  delete reTemplate.pocId;
  delete reTemplate.publishedAt;
  delete reTemplate.requirements;
  delete reTemplate.sponsorId;
  delete reTemplate.color;
  delete reTemplate.emoji;
  delete reTemplate.Bounties;

  return reTemplate;
};

export function transformListingToFormListing(
  listing: Listing,
): ListingFormData {
  return {
    id: listing.id,
    deadline:
      listing.deadline ||
      dayjs().add(7, 'day').format(DEADLINE_FORMAT).replace('Z', ''),
    commitmentDate:
      listing.commitmentDate ||
      dayjs(
        listing.deadline ||
          dayjs().add(7, 'day').format(DEADLINE_FORMAT).replace('Z', ''),
      )
        .add(14, 'day')
        .format(DEADLINE_FORMAT)
        .replace('Z', ''),
    slug: listing.slug || '',
    type: (listing.type as BountyType) || 'bounty',
    title: listing.title || '',
    description: listing.description || '',
    eligibility: listing.eligibility as any,
    region: listing.region || 'Global',
    rewards: listing.rewards as any,
    compensationType: listing.compensationType as CompensationType,
    rewardAmount: listing.rewardAmount,
    maxBonusSpots: listing.maxBonusSpots,
    maxRewardAsk: listing.maxRewardAsk,
    minRewardAsk: listing.minRewardAsk,
    pocSocials: listing.pocSocials || '',
    token: listing.token || 'USDC',
    isFndnPaying: listing.isFndnPaying || false,
    skills: listing.skills || [],
    hackathonId: listing.hackathonId,
    status: listing.status,
    isPrivate: listing.isPrivate || false,
    templateId: listing.templateId,
    sponsorId: listing.sponsorId,
    isPublished: listing.isPublished,
    publishedAt: listing.publishedAt,
    totalPaymentsMade: listing.totalPaymentsMade,
    isWinnersAnnounced: listing.isWinnersAnnounced,
    totalWinnersSelected: listing.totalWinnersSelected,
    referredBy: listing.referredBy,
  };
}

export const refineReadyListing = (listing: ListingFormData) => {
  if (listing.type !== 'project') {
    listing.compensationType = 'fixed';
    listing.maxRewardAsk = null;
    listing.minRewardAsk = null;
  } else {
    listing.maxBonusSpots = 0;
    if (listing.compensationType !== 'fixed') {
      listing.rewards = null;
      listing.rewardAmount = null;
    } else {
      listing.rewards = { 1: listing.rewardAmount || 0 };
    }
    if (listing.compensationType !== 'range') {
      listing.minRewardAsk = null;
      listing.maxRewardAsk = null;
    }
  }
  if (listing.deadline) {
    if (!listing.deadline.endsWith('Z'))
      listing.deadline += dayjs().format('Z');
  }

  if (listing.commitmentDate) {
    if (!listing.commitmentDate.endsWith('Z'))
      listing.commitmentDate += dayjs().format('Z');
  }
  return listing;
};
