/* oxlint-disable no-underscore-dangle -- zod's schema internals (_def) */
import { z } from 'zod';

import { dayjs } from '@/utils/dayjs';

import type { GeneratedListingData } from '../atoms';
import { DEADLINE_FORMAT, getDefaultListingToken } from '../constants';
import type { ListingFormData } from '../types';
import type {
  BuilderHackathon,
  BuilderListing,
  BuilderTemplate,
} from '../types/builder';
import { createListingFormSchema } from '../types/schema';
import { calculateTotalRewardsForPodium } from './rewards';

interface ListingDefaults {
  isGod: boolean;
  isEditing: boolean;
  isST: boolean;
  type?: 'bounty' | 'hackathon';
  hackathons?: BuilderHackathon[];
  hackathonId?: string;
  generatedListing?: GeneratedListingData;
}

// The object schema inside the ZodEffects refinements wrap it in.
const innerObject = (
  schema: z.ZodTypeAny,
): z.ZodObject<z.ZodRawShape> | null => {
  if (schema instanceof z.ZodEffects) return innerObject(schema.innerType());
  return schema instanceof z.ZodObject ? schema : null;
};

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

  const shape = innerObject(schema)?.shape ?? {};

  const defaults: Record<string, unknown> = {};

  for (const [key, zodValue] of Object.entries(shape)) {
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

  // Built from the form schema's own defaults.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return defaults as ListingFormData;
};

// A template's content over the form: its title, description, skills and
// type; everything else stays as the sponsor set it.
export const cleanTemplate = (
  template: BuilderTemplate,
  prevValues: ListingFormData,
): ListingFormData => ({
  templateId: template.id,
  id: prevValues.id || undefined,
  title: template.title ?? '',
  description: template.description ?? '',
  skills: template.skills ?? [],
  type: template.type === 'hackathon' ? 'hackathon' : 'bounty',
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
  isFndnPaying: prevValues.isFndnPaying,
  hackathonId: prevValues.hackathonId || undefined,
  eligibility: prevValues.eligibility || undefined,
  token: prevValues.token || template.token || '',
});

export function transformListingToFormListing(
  // A duplicate has no id yet.
  listing: Omit<BuilderListing, 'id'> & { id?: string },
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
    type: listing.type === 'hackathon' ? 'hackathon' : 'bounty',
    title: listing.title || '',
    description: listing.description || '',
    eligibility: listing.eligibility,
    region: listing.region || 'Global',
    rewards:
      listing.rewards && Object.fromEntries(Object.entries(listing.rewards)),
    compensationType: listing.compensationType,
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
    templateId: listing.templateId,
    sponsorId: listing.sponsorId,
    isPublished: listing.isPublished,
    isFeatured: listing.isFeatured || false,
    publishedAt: listing.publishedAt,
    totalPaymentsMade: listing.totalPaymentsMade,
    isWinnersAnnounced: listing.isWinnersAnnounced,
    referredBy: listing.referredBy,
  };
}

export const refineReadyListing = (listing: ListingFormData) => {
  listing.compensationType = 'fixed';
  listing.maxRewardAsk = null;
  listing.minRewardAsk = null;
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
