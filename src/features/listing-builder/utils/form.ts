import { z } from 'zod';

import { type BountyTemplateWithSponsor } from '@/app/api/sponsor-dashboard/templates/route';
import { skillsArraySchema } from '@/interface/skills';
import { type BountyType, type CompensationType } from '@/prisma/enums';
import { dayjs } from '@/utils/dayjs';
import { parseQuestionConfigs } from '@/utils/parseQuestionConfigs';

import { type BuilderHackathon } from '@/features/listing-builder/types';
import { type Listing } from '@/features/listings/types';

import { type GeneratedListingData } from '../atoms';
import { DEADLINE_FORMAT, getDefaultListingToken } from '../constants';
import { type ListingFormData } from '../types';
import {
  createListingFormSchema,
  type TEligibilityQuestion,
} from '../types/schema';
import { calculateTotalRewardsForPodium } from './rewards';

interface ListingDefaults {
  isGod: boolean;
  isEditing: boolean;
  isST: boolean;
  type?: BountyType;
  hackathons?: BuilderHackathon[];
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

  // Get the inner schema by unwrapping the ZodEffects
  const getInnerSchema = (schema: z.ZodTypeAny): z.ZodObject<z.ZodRawShape> => {
    if (schema instanceof z.ZodEffects) {
      return getInnerSchema(schema.innerType());
    }
    return schema as z.ZodObject<z.ZodRawShape>;
  };

  const innerSchema = getInnerSchema(schema);
  const shape = innerSchema.shape;

  const defaults: Record<string, unknown> = {};

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

  defaults['title'] ??= '';
  defaults['slug'] ??= '';
  defaults['type'] = type;
  const currentHackathon =
    type === 'hackathon'
      ? hackathons?.find((hackathon) => hackathon.id === hackathonId)
      : undefined;
  if (type === 'hackathon') {
    if (!currentHackathon) defaults['type'] = 'bounty';
    else {
      defaults['type'] = type;
      if (currentHackathon.eligibility)
        defaults['eligibility'] = currentHackathon.eligibility;
      if (currentHackathon.deadline)
        defaults['deadline'] = currentHackathon.deadline;
      defaults['hackathonId'] = hackathonId;
      defaults['token'] = getDefaultListingToken(isST, currentHackathon.slug);
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
    if (generatedListing.eligibilityQuestions && type !== 'hackathon') {
      defaults['eligibility'] = generatedListing.eligibilityQuestions;
    }
  }

  return defaults as ListingFormData;
};

// The form requires `type`; older stored questions flag links with `isLink`
// instead, which submission validation also honours.
export const toFormEligibility = (
  value: unknown,
): TEligibilityQuestion[] | undefined =>
  parseQuestionConfigs(value)?.map(
    ({ order, question, optional, isLink, type }) => ({
      order,
      question,
      optional,
      type: type ?? (isLink ? 'link' : 'text'),
    }),
  );

// Older listings can store rewards as an array. Number it from 1, as
// validateFields does, because 0-based positions fail the reward schema.
const toFormRewards = (
  rewards: Listing['rewards'],
): ListingFormData['rewards'] => {
  if (!rewards) return undefined;
  if (Array.isArray(rewards)) {
    return Object.fromEntries(
      rewards.filter(Boolean).map((value, index) => [String(index + 1), value]),
    );
  }
  return Object.fromEntries(Object.entries(rewards));
};

// Applying a template keeps the sponsor's current settings and takes only the
// template's content: title, description, skills and type.
export const cleanTemplate = (
  template: BountyTemplateWithSponsor,
  prevValues: ListingFormData,
): Partial<ListingFormData> => ({
  title: template.title ?? undefined,
  description: template.description ?? undefined,
  skills: skillsArraySchema.safeParse(template.skills).data,
  type: template.type,
  templateId: template.id,
  id: prevValues.id || undefined,
  slug: prevValues.slug,
  compensationType: prevValues.compensationType,
  rewards: prevValues.rewards || undefined,
  deadline: prevValues.deadline,
  commitmentDate: prevValues.commitmentDate,
  maxBonusSpots: prevValues.maxBonusSpots || undefined,
  minRewardAsk: prevValues.minRewardAsk || undefined,
  maxRewardAsk: prevValues.maxRewardAsk || undefined,
  pocSocials: prevValues.pocSocials,
  rewardAmount: prevValues.rewardAmount || undefined,
  region: prevValues.region,
  isPrivate: prevValues.isPrivate,
  agentAccess: prevValues.agentAccess,
  isFndnPaying: prevValues.isFndnPaying,
  hackathonId: prevValues.hackathonId || undefined,
  eligibility: prevValues.eligibility || undefined,
  token: prevValues.token || template.token || undefined,
});

export function transformListingToFormListing(
  listing: Listing,
  isST = false,
): ListingFormData {
  return {
    id: listing.id,
    deadline:
      listing.deadline ||
      dayjs()
        .add(7, 'day')
        .endOf('day')
        .format(DEADLINE_FORMAT)
        .replace('Z', ''),
    commitmentDate:
      listing.commitmentDate ||
      dayjs(
        listing.deadline ||
          dayjs()
            .add(7, 'day')
            .endOf('day')
            .format(DEADLINE_FORMAT)
            .replace('Z', ''),
      )
        .add(14, 'day')
        .endOf('day')
        .format(DEADLINE_FORMAT)
        .replace('Z', ''),
    slug: listing.slug || '',
    type: (listing.type as BountyType) || 'bounty',
    title: listing.title || '',
    description: listing.description || '',
    eligibility: toFormEligibility(listing.eligibility),
    region: listing.region || 'Global',
    rewards: toFormRewards(listing.rewards),
    compensationType: listing.compensationType as CompensationType,
    rewardAmount: listing.rewardAmount,
    maxBonusSpots: listing.maxBonusSpots,
    maxRewardAsk: listing.maxRewardAsk,
    minRewardAsk: listing.minRewardAsk,
    pocSocials: listing.pocSocials || '',
    token: listing.token || (isST ? 'USDG' : 'USDC'),
    isFndnPaying: listing.isFndnPaying || false,
    skills: listing.skills || [],
    hackathonId: listing.hackathonId,
    status: listing.status,
    isPrivate: listing.isPrivate || false,
    isPro: listing.isPro || false,
    agentAccess: listing.agentAccess || 'HUMAN_ONLY',
    templateId: listing.templateId,
    sponsorId: listing.sponsorId,
    isPublished: listing.isPublished,
    isFeatured: listing.isFeatured || false,
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
