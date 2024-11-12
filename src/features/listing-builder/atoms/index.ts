import { atom, createStore } from 'jotai';
import axios from 'axios';
import { atomWithQuery, atomWithMutation } from 'jotai-tanstack-query';
import { createListingFormSchema } from '../types/schema';
import { ListingFormData, ListingStatus } from '../types';

const store: ReturnType<typeof createStore> = createStore()

const isGodAtom = atom<boolean>(false);
const isSTAtom = atom<boolean>(false);
const isEditingAtom = atom<boolean>(false);
const isDuplicatingAtom = atom<boolean>(false);
const listingSlugAtom = atom<string | undefined>(undefined);
const listingStatusAtom = atom<ListingStatus | undefined>(undefined);
const isDraftSavingAtom = atom(false)

const confirmModalAtom = atom<"SUCCESS" | "VERIFICATION" | undefined>(undefined)
const previewAtom = atom(false)

const formSchemaAtom = atom((get) => 
  createListingFormSchema(
    get(isGodAtom),
    get(isEditingAtom),
    get(isDuplicatingAtom),
    get(isSTAtom)
  )
);

const saveDraftMutationAtom = atomWithMutation(() => ({
  mutationKey: ['saveDraft'],
  mutationFn: async (data: Partial<ListingFormData>) => {
    const response = await axios.post<ListingFormData>('/api/listings/draft', {
      ...data,
    });
    return response.data;
  }
}));

const submitListingMutationAtom = atomWithMutation((get) => ({
  mutationKey: ['submitListing'],
  mutationFn: async (data: ListingFormData) => {
    if(!data.id) throw new Error('Missing ID')
    const isEditing = get(isEditingAtom) && !get(isDuplicatingAtom);
    const endpoint = isEditing ? '/api/listings/update' : '/api/listings/publish';
    const response = await axios.post<ListingFormData>(`${endpoint}/${data.id}`, {
      ...data,
      isDuplicating: get(isDuplicatingAtom)
    });
    return response.data;
  }
}));

type ListingResponse = ListingFormData | null;
const fetchListingAtom = atomWithQuery<ListingResponse>((get) => ({
  queryKey: ['listing', get(listingSlugAtom)],
  queryFn: async ({ queryKey: [_, slug] }): Promise<ListingResponse> => {
    if (!slug) return null;
    try {
      const response = await axios.get<ListingFormData>(`/api/sponsor-dashboard/${slug}/listing`);
      return response.data;
    } catch (error) {
      console.error('Error fetching listing:', error);
      return null;
    }
  },
  enabled: Boolean(get(listingSlugAtom)),
}));

export {
  store,
  isGodAtom,
  isSTAtom,
  isEditingAtom,
  isDuplicatingAtom,
  listingSlugAtom,
  formSchemaAtom,
  saveDraftMutationAtom,
  submitListingMutationAtom,
  fetchListingAtom,
  listingStatusAtom,
  isDraftSavingAtom,
  confirmModalAtom,
  previewAtom
};
