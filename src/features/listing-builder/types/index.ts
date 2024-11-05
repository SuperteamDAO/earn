import {
  type Listing,
} from '@/features/listings';

import { createListingFormSchema } from './schema';
import { z } from 'zod';

export * from './SuperteamName';
export * from './schema'

export type ListingFormSchema = ReturnType<typeof createListingFormSchema>;
export type ListingFormData = z.infer<ListingFormSchema>;

export interface ListingStoreType {
  form: ListingFormData;
  updateState: (data: Partial<ListingFormData>) => void;
  resetForm: () => void;
  initializeForm: (
    listing: Listing,
    isDuplicating: boolean,
    type: 'bounty' | 'project' | 'hackathon',
  ) => void;
}
