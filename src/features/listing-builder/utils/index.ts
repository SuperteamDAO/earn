import {
  type BountyType,
  type CompensationType,
  type Hackathon,
  Regions,
} from '@prisma/client';
import { z } from 'zod';

import { type Listing } from '@/features/listings';
import { dayjs } from '@/utils/dayjs';

import { DEADLINE_FORMAT } from '../components/Form';
import {
  createListingFormSchema,
  type ListingFormData,
  type ListingStatus,
} from '../types';

export * from './rewards';
export * from './skills';
export * from './suggestions';

export const calculateTotalOfArray = (values: number[]) =>
  values.reduce((a, b) => (a ?? 0) + (b ?? 0), 0);

export const caculateBonus = (
  bonusSpots: number | undefined,
  bonusReward: number | undefined,
) => (bonusSpots ?? 0) * (bonusReward ?? 0);

export const formatTotalPrice = (total: number) =>
  new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(total as number);

export const timeToCompleteOptions = [
  { value: '<1 Week', label: '<1 Week' },
  { value: '1-2 Weeks', label: '1-2 Weeks' },
  { value: '2-4 Weeks', label: '2-4 Weeks' },
  { value: '4-8 Weeks', label: '4-8 Weeks' },
  { value: '>8 Weeks', label: '>8 Weeks' },
];

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

  delete reTemplate.isFeatured;
  delete reTemplate.isActive;
  delete reTemplate.isArchived;
  delete reTemplate.applicationType;
  delete reTemplate.isPublished;
  delete reTemplate.pocId;
  delete reTemplate.publishedAt;
  delete reTemplate.references;
  delete reTemplate.referredBy;
  delete reTemplate.requirements;
  delete reTemplate.sponsorId;
  delete reTemplate.timeToComplete;
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
