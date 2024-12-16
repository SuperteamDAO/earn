import {
  type BountyType,
  type CompensationType,
  type Hackathon,
  Regions,
} from '@prisma/client';
import { z } from 'zod';

import { type Listing } from '@/features/listings/types';
import { dayjs } from '@/utils/dayjs';

import { DEADLINE_FORMAT } from '../components/Form';
import { type ListingFormData } from '../types';
import { createListingFormSchema } from '../types/schema';
interface ListingDefaults {
  isGod: boolean;
  isEditing: boolean;
  isST: boolean;
  type?: BountyType;
  hackathon?: Hackathon;
}

export const getListingDefaults = ({
  isGod,
  isEditing,
  isST,
  type = 'bounty',
  hackathon,
}: ListingDefaults) => {
  const schema = createListingFormSchema({
    isGod,
    isEditing,
    isST,
    hackathon: hackathon,
  });

  // Get the inner schema by unwrapping the ZodEffects
  const getInnerSchema = (schema: z.ZodTypeAny): z.ZodObject<any> => {
    if (schema instanceof z.ZodEffects) {
      return getInnerSchema(schema.innerType());
    }
    return schema as z.ZodObject<any>;
  };

  const innerSchema = getInnerSchema(schema);
  const shape = innerSchema.shape;

  const defaults: Record<string, any> = {};

  for (const [key, value] of Object.entries(shape)) {
    const zodValue = value as z.ZodTypeAny;

    if (zodValue instanceof z.ZodDefault) {
      defaults[key] = zodValue._def.defaultValue();
    } else if (zodValue instanceof z.ZodOptional) {
      if (zodValue._def.innerType instanceof z.ZodObject) {
        defaults[key] = {};
      } else if (zodValue._def.innerType instanceof z.ZodArray) {
        defaults[key] = [];
      } else if (zodValue._def.innerType instanceof z.ZodString) {
        defaults[key] = '';
      } else if (zodValue._def.innerType instanceof z.ZodBoolean) {
        defaults[key] = false;
      } else {
        defaults[key] = undefined;
      }
    } else if ('defaultValue' in zodValue._def) {
      defaults[key] = zodValue._def.defaultValue;
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
    if (!hackathon) defaults['type'] = 'bounty';
    else {
      defaults['type'] = type;
      if (hackathon.eligibility)
        defaults['eligibility'] = hackathon.eligibility;
      if (hackathon.deadline) defaults['deadline'] = hackathon.deadline;
      defaults['hackathonId'] = hackathon.id;
    }
  }
  if (type === 'project') {
    defaults['eligibility'] = [{ type: 'text', question: '', order: 1 }];
  }

  defaults['isFndnPaying'] = false;
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
    slug: listing.slug || '',
    type: (listing.type as BountyType) || 'bounty',
    title: listing.title || '',
    description: listing.description || '',
    eligibility: listing.eligibility as any,
    region: listing.region || Regions.GLOBAL,
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
  };
}

export const refineReadyListing = (listing: ListingFormData) => {
  if (listing.type !== 'project') {
    listing.compensationType = 'fixed';
    listing.maxRewardAsk = null;
    listing.minRewardAsk = null;
  } else {
    if (listing.compensationType !== 'fixed') {
      listing.rewards = undefined;
      listing.rewardAmount = undefined;
    } else {
      listing.rewards = { 1: listing.rewardAmount || 0 };
    }
    if (listing.compensationType !== 'range') {
      listing.minRewardAsk = undefined;
      listing.maxRewardAsk = undefined;
    }
  }
  if (listing.deadline) {
    if (!listing.deadline.endsWith('Z'))
      listing.deadline += dayjs().format('Z');
  }
  return listing;
};
