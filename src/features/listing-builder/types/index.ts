import { type z } from 'zod';

import { type createListingFormSchema } from './schema';

export * from './schema';

export type ListingFormSchema = ReturnType<typeof createListingFormSchema>;
export type ListingFormData = z.infer<ListingFormSchema>;

export type ListingStatus =
  | 'draft'
  | 'published'
  | 'unpublished'
  | 'verifying'
  | 'payment pending'
  | 'completed';
