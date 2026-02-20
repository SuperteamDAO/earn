import { type z } from 'zod';

import { type createListingFormSchema } from './schema';

type ListingFormSchema = ReturnType<typeof createListingFormSchema>;
export type ListingFormData = z.infer<ListingFormSchema>;
export type ValidationFields = Partial<Record<keyof ListingFormData, true>>;
export type SubmitListingResponse = ListingFormData & {
  reason?: string;
  isFirstPublishedListing?: boolean;
};

export type ListingStatus =
  | 'draft'
  | 'published'
  | 'unpublished'
  | 'verifying'
  | 'payment pending'
  | 'completed'
  | 'verification failed'
  | 'blocked';
