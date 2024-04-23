import { Regions } from '@prisma/client';
import { produce } from 'immer';
import { create } from 'zustand';

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

const initialFormState = {
  id: '',
  title: '',
  slug: '',
  deadline: undefined,
  templateId: undefined,
  pocSocials: undefined,
  applicationType: 'fixed',
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
};

export const useListingFormStore = create<ListingStoreType>()((set) => ({
  form: { ...(initialFormState as ListingFormType) },
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
        draft.form = { ...(initialFormState as ListingFormType) };
      }),
    );
  },
}));
