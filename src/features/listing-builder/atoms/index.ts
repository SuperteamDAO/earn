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
const listingIdAtom = atom<string | undefined>(undefined);
const listingSlugAtom = atom<string | undefined>(undefined);
const listingStatusAtom = atom<ListingStatus | undefined>(undefined);

const formSchemaAtom = atom((get) => 
  createListingFormSchema(
    get(isGodAtom),
    get(isEditingAtom),
    get(isDuplicatingAtom),
    get(listingIdAtom),
    get(isSTAtom)
  )
);

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
    const isEditing = get(isEditingAtom) && !get(isDuplicatingAtom);
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

const generateSlug = atomWithQuery<string>((get) => ({
  queryKey: ['slug'],
}))


export {
  store,
  isGodAtom,
  isSTAtom,
  isEditingAtom,
  isDuplicatingAtom,
  listingIdAtom,
  listingSlugAtom,
  formSchemaAtom,
  saveDraftMutationAtom,
  submitListingMutationAtom,
  fetchListingAtom,
  listingStatusAtom,
};
