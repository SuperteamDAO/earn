import { type z } from 'zod';

import { type createListingFormSchema } from './schema';

type ListingFormSchema = ReturnType<typeof createListingFormSchema>;
export type ListingFormData = z.infer<ListingFormSchema>;
// The hackathon fields the listing builder reads. Client rows come over JSON
// (active-hackathons, the listing's own Hackathon), so dates are strings;
// listingValidator passes Prisma rows with Dates.
export interface BuilderHackathon {
  id: string;
  slug: string;
  name: string;
  startDate: Date | string | null;
  deadline: Date | string | null;
  eligibility: unknown;
}
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
