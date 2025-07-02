import { type Hackathon } from '@prisma/client';
import { atom, createStore } from 'jotai';
import { atomWithMutation } from 'jotai-tanstack-query';

import { api } from '@/lib/api';
import { convertUndefinedToNull } from '@/utils/undefinedToNull';

import { type ListingFormData, type ListingStatus } from '../types';

const store: ReturnType<typeof createStore> = createStore();

const isGodAtom = atom<boolean>(false);
const isSTAtom = atom<boolean>(false);
const isEditingAtom = atom<boolean>(false);
const listingStatusAtom = atom<ListingStatus | undefined>(undefined);
const isDraftSavingAtom = atom(false);
const hackathonsAtom = atom<Hackathon[] | undefined>(undefined);
const hideAutoSaveAtom = atom<boolean>(true);
const descriptionKeyAtom = atom<string | number>(1);
const skillsKeyAtom = atom<string | number>(1);
const isAutoGenerateOpenAtom = atom<boolean>(false);

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
const previewAtom = atom(false);

const saveDraftMutationAtom = atomWithMutation(() => ({
  mutationKey: ['saveDraft'],
  mutationFn: async (data: Partial<ListingFormData>) => {
    const response = await api.post<ListingFormData>('/api/listings/draft', {
      ...convertUndefinedToNull(data),
    });
    return response.data;
  },
}));

const submitListingMutationAtom = atomWithMutation((get) => ({
  mutationKey: ['submitListing'],
  mutationFn: async (data: ListingFormData) => {
    if (!data.id) throw new Error('Missing ID');
    const isEditing = get(isEditingAtom);
    const endpoint = isEditing
      ? '/api/listings/update'
      : '/api/listings/publish';
    const response = await api.post<ListingFormData & { reason?: string }>(
      `${endpoint}/${data.id}`,
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
  skillsKeyAtom,
  store,
  submitListingMutationAtom,
};
