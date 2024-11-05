import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { type UseFormReturn } from 'react-hook-form';
import axios from 'axios';
import { atomWithQuery, atomWithMutation } from 'jotai-tanstack-query';
import { createListingFormSchema } from '../types/schema';
import { ListingFormData, ListingStatus } from '../types';

type FormReturn = UseFormReturn<ListingFormData>;

const formAtom = atom<FormReturn | null>(null);
const isGodAtom = atom<boolean>(false);
const isSTAtom = atom<boolean>(false);
const editableAtom = atom<boolean>(false);
const isDuplicatingAtom = atom<boolean>(false);
const listingIdAtom = atom<string | undefined>(undefined);
const listingStatusAtom = atom<ListingStatus | undefined>(undefined);

const formSchemaAtom = atom((get) => 
  createListingFormSchema(
    get(isGodAtom),
    get(editableAtom),
    get(isDuplicatingAtom),
    get(listingIdAtom),
    get(isSTAtom)
  )
);

const draftStorageAtom = atomWithStorage<Partial<ListingFormData>>('listing-draft', {});

const saveDraftMutationAtom = atomWithMutation((get) => ({
  mutationKey: ['saveDraft'],
  mutationFn: async (data: Partial<ListingFormData>) => {
    const response = await axios.post('/api/listings/draft', {
      ...data,
      id: get(listingIdAtom)
    });
    return response.data;
  }
}));

const submitListingMutationAtom = atomWithMutation((get) => ({
  mutationKey: ['submitListing'],
  mutationFn: async (data: ListingFormData) => {
    const isEditing = get(editableAtom) && !get(isDuplicatingAtom);
    const endpoint = isEditing ? '/api/listings/update' : '/api/listings/publish';
    const response = await axios.post(`${endpoint}/${get(listingIdAtom)}`, {
      ...data,
      isDuplicating: get(isDuplicatingAtom)
    });
    return response.data;
  }
}));

type ListingResponse = ListingFormData | null;
const fetchListingAtom = atomWithQuery<ListingResponse>((get) => ({
  queryKey: ['listing', get(listingIdAtom)],
  queryFn: async ({ queryKey: [_, id] }): Promise<ListingResponse> => {
    if (!id) return null;
    try {
      const response = await axios.get<ListingFormData>(`/api/listings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching listing:', error);
      return null;
    }
  },
  enabled: Boolean(get(listingIdAtom)) && get(editableAtom)
}));

const formErrorsAtom = atom(
  (get) => get(formAtom)?.formState.errors ?? {}
);

const formDirtyAtom = atom(
  (get) => get(formAtom)?.formState.isDirty ?? false
);

const isSubmittingAtom = atom(
  (get) => get(formAtom)?.formState.isSubmitting ?? false
);

const isSavingDraftAtom = atom(
  (get) => get(saveDraftMutationAtom).isPending
);

const isSubmittingListingAtom = atom(
  (get) => get(submitListingMutationAtom).isPending
);

const formActionsAtom = atom(
  null,
  (get, set, action: { type: string; payload?: any }) => {
    const form = get(formAtom);
    if (!form) return;

    switch (action.type) {
      case 'SAVE_DRAFT': {
        const formData = form.getValues();
        set(draftStorageAtom, formData);
        const saveDraftMutation = get(saveDraftMutationAtom);
        saveDraftMutation.mutate(formData);
        break;
      }

      case 'SUBMIT': {
        const formData = form.getValues();
        const submitMutation = get(submitListingMutationAtom);
        submitMutation.mutate(formData);
        set(draftStorageAtom, {});
        break;
      }

      case 'RESET': {
        form.reset();
        set(draftStorageAtom, {});
        break;
      }

      case 'LOAD_DRAFT': {
        const draft = get(draftStorageAtom);
        form.reset(draft);
        break;
      }

      case 'SET_FORM': {
        set(formAtom, action.payload);
        break;
      }
    }
  }
);

export {
  formAtom,
  isGodAtom,
  isSTAtom,
  editableAtom,
  isDuplicatingAtom,
  listingIdAtom,
  formSchemaAtom,
  draftStorageAtom,
  saveDraftMutationAtom,
  submitListingMutationAtom,
  fetchListingAtom,
  formErrorsAtom,
  formDirtyAtom,
  isSubmittingAtom,
  formActionsAtom,
  isSavingDraftAtom,
  isSubmittingListingAtom,
  listingStatusAtom
};
