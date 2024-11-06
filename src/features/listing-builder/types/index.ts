import { createListingFormSchema } from './schema';
import { z } from 'zod';

export * from './SuperteamName';
export * from './schema'

export type ListingFormSchema = ReturnType<typeof createListingFormSchema>;
export type ListingFormData = z.infer<ListingFormSchema>;

export type ListingStatus = 'draft' | 'published' | 'unpublished' | 'verifying'
