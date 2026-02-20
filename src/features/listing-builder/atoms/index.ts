import { atom, createStore } from 'jotai';
import { atomWithMutation } from 'jotai-tanstack-query';

import { type TRewardsGenerateResponse } from '@/app/api/sponsor-dashboard/ai-generate/rewards/route';
import { type TTitleGenerateResponse } from '@/app/api/sponsor-dashboard/ai-generate/title/route';
import { type TTokenGenerateResponse } from '@/app/api/sponsor-dashboard/ai-generate/token/route';
import { type BountyType } from '@/generated/prisma/enums';
import { type Skills } from '@/interface/skills';
import { api } from '@/lib/api';
import { type HackathonModel } from '@/prisma/models/Hackathon';
import { convertUndefinedToNull } from '@/utils/undefinedToNull';

import {
  type ListingFormData,
  type ListingStatus,
  type SubmitListingResponse,
} from '../types';
import { type TEligibilityQuestion } from '../types/schema';

export interface GeneratedListingData {
  description?: string;
  token?: TTokenGenerateResponse['token'];
  title?: TTitleGenerateResponse['title'];
  rewards?: TRewardsGenerateResponse;
  skills?: Skills;
  eligibilityQuestions?: TEligibilityQuestion[];
  type?: BountyType;
}

const store: ReturnType<typeof createStore> = createStore();

const isGodAtom = atom<boolean>(false);
const isSTAtom = atom<boolean>(false);
const isEditingAtom = atom<boolean>(false);
const listingStatusAtom = atom<ListingStatus | undefined>(undefined);
const isDraftSavingAtom = atom(false);
const hackathonsAtom = atom<HackathonModel[] | undefined>(undefined);
const hideAutoSaveAtom = atom<boolean>(true);
const descriptionKeyAtom = atom<string | number>(1);
const skillsKeyAtom = atom<string | number>(1);
const isAutoGenerateOpenAtom = atom<boolean>(false);
const generatedListingAtom = atom<GeneratedListingData | undefined>(undefined);

interface SaveQueueState {
  isProcessing: boolean;
  shouldProcessNext: boolean;
}
const draftQueueAtom = atom<SaveQueueState>({
  isProcessing: false,
  shouldProcessNext: false,
});

const confirmModalAtom = atom<
  'SUCCESS' | 'VERIFICATION_SHOW_FORM' | 'VERIFICATION_SHOW_MODAL' | undefined
>(undefined);
const showFirstPublishSurveyAtom = atom(false);
const previewAtom = atom(false);

const saveDraftMutationAtom = atomWithMutation(() => ({
  mutationKey: ['saveDraft'],
  mutationFn: async (data: Partial<ListingFormData>) => {
    const response = await api.post<ListingFormData>(
      '/api/sponsor-dashboard/listing/draft',
      {
        ...convertUndefinedToNull(data),
      },
    );
    return response.data;
  },
}));

const submitListingMutationAtom = atomWithMutation((get) => ({
  mutationKey: ['submitListing'],
  mutationFn: async (data: ListingFormData) => {
    if (!data.id) throw new Error('Missing ID');

    if (typeof window !== 'undefined' && window.__processImageCleanup) {
      console.log('Processing image cleanup before submission');
      try {
        await window.__processImageCleanup();
      } catch (error) {
        console.error('Failed to process image cleanup:', error);
      }
    } else {
      console.warn('Image cleanup not initialized');
    }

    const isEditing = get(isEditingAtom);
    const endpoint = '/api/sponsor-dashboard/listing/';
    const action = isEditing ? 'update' : 'publish';
    const response = await api.post<SubmitListingResponse>(
      `${endpoint}${data.id}/${action}`,
      {
        ...convertUndefinedToNull(data),
      },
    );
    return response.data;
  },
}));

export {
  confirmModalAtom,
  descriptionKeyAtom,
  draftQueueAtom,
  generatedListingAtom,
  hackathonsAtom,
  hideAutoSaveAtom,
  isAutoGenerateOpenAtom,
  isDraftSavingAtom,
  isEditingAtom,
  isGodAtom,
  isSTAtom,
  listingStatusAtom,
  previewAtom,
  saveDraftMutationAtom,
  showFirstPublishSurveyAtom,
  skillsKeyAtom,
  store,
  submitListingMutationAtom,
};
