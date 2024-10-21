import { Regions } from '@prisma/client';
import dayjs from 'dayjs';
import { produce } from 'immer';
import { create } from 'zustand';

import { type Listing } from '@/features/listings';

import { type ListingFormType, type ListingStoreType } from '../types';

const listingDescriptionHeadings = [
  'About the Listing & Scope',
  'Rewards',
  'Judging Criteria',
  'Submission Requirements',
  'Resources',
]
  .map((heading) => `<h1 key=${heading}>${heading}</h1>`)
  .join('');

const initialFormState: ListingFormType = {
  id: '',
  title: '',
  slug: '',
  deadline: undefined,
  templateId: undefined,
  pocSocials: undefined,
  timeToComplete: undefined,
  type: undefined,
  region: Regions.GLOBAL,
  referredBy: undefined,
  requirements: '',
  eligibility: [],
  references: [],
  isPrivate: false,
  skills: [],
  description: listingDescriptionHeadings,
  publishedAt: '',
  rewardAmount: undefined,
  rewards: undefined,
  token: 'USDC',
  compensationType: 'fixed',
  minRewardAsk: undefined,
  maxRewardAsk: undefined,
  maxBonusSpots: undefined,
  isFndnPaying: undefined,
};

const mergeListingWithInitialFormState = (
  listing: Listing,
  isDuplicating: boolean,
  type: 'bounty' | 'project' | 'hackathon',
): ListingFormType => ({
  ...initialFormState,
  ...listing,
  title:
    isDuplicating && listing.title ? `${listing.title} (2)` : listing.title,
  slug: isDuplicating && listing.slug ? `${listing.slug}-2` : listing.slug,
  deadline:
    !isDuplicating && listing.deadline
      ? dayjs(listing.deadline).format('YYYY-MM-DDTHH:mm')
      : undefined,
  type: type,
  eligibility: (listing.eligibility || []).map((e) => ({
    order: e.order,
    question: e.question,
    type: e.type as 'text',
    delete: true,
    label: e.question,
  })),
  references: (listing.references || []).map((e) => ({
    order: e.order,
    link: e.link,
    title: e.title,
  })),
  publishedAt: listing.publishedAt,
  rewardAmount: listing.rewardAmount,
  rewards: listing.rewards,
  token: listing.token || 'USDC',
  minRewardAsk: listing.minRewardAsk,
  maxRewardAsk: listing.maxRewardAsk,
  maxBonusSpots: listing.maxBonusSpots,
  isFndnPaying: listing.isFndnPaying,
});

export const useListingFormStore = create<ListingStoreType>()((set) => ({
  form: {},
  updateState: (data) => {
    set(
      produce((draft) => {
        draft.form = { ...draft.form, ...data };
      }),
    );
  },
  resetForm: () => {
    set(
      produce((draft) => {
        draft.form = { ...initialFormState };
      }),
    );
  },
  initializeForm: (listing, isDuplicating, type) => {
    const mergedState = listing
      ? mergeListingWithInitialFormState(listing, isDuplicating, type)
      : initialFormState;
    set(
      produce((draft) => {
        draft.form = mergedState;
      }),
    );
  },
}));
