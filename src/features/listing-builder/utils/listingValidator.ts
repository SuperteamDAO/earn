// used for api route, dont add use client here.
import { type Hackathon, type Sponsors, type User } from '@prisma/client';

import logger from '@/lib/logger';

import { type ListingWithSponsor } from '@/features/auth/utils/checkListingSponsorAuth';

import { type ListingFormData } from '../types';
import {
  backendListingRefinements,
  createListingFormSchema,
  createListingRefinements,
} from '../types/schema';

interface ListingValidatorParams {
  listing: ListingWithSponsor;
  sponsor: Sponsors;
  user: User;
  hackathon: Hackathon | undefined;
  isEditing: boolean;
  formData: any;
}
export const validateListing = async ({
  listing,
  sponsor,
  user,
  hackathon,
  isEditing,
  formData,
}: ListingValidatorParams): Promise<ListingFormData> => {
  try {
    logger.info('Processing Listings ZOD Validation ', {
      id: listing.id,
      isGod: user?.role === 'GOD',
      isEditing,
      isST: !!sponsor?.st,
      hackathonId: hackathon?.id,
      pastListing: listing,
    });
    const listingSchema = createListingFormSchema({
      isGod: user?.role === 'GOD',
      isEditing,
      isST: !!sponsor?.st,
      hackathons: hackathon ? [hackathon] : [],
      pastListing: isEditing ? (listing as any) : undefined,
    });
    const innerSchema = listingSchema._def.schema.omit({
      isPublished: true,
      isWinnersAnnounced: true,
      totalWinnersSelected: true,
      totalPaymentsMade: true,
      status: true,
      publishedAt: true,
      sponsorId: true,
    });
    const superValidator = innerSchema.superRefine(async (data, ctx) => {
      await createListingRefinements(data, ctx, hackathon ? [hackathon] : []);
      await backendListingRefinements(data, ctx);
    });
    const validatedData = await superValidator.parseAsync({
      ...(isEditing ? listing : {}),
      ...formData,
    });
    logger.info('Listings ZOD Validation Successful ', {
      id: listing.id,
      validatedData,
    });
    return validatedData;
  } catch (error) {
    logger.error('Listings ZOD Validation Failed ', {
      id: listing.id,
      error,
    });
    throw error;
  }
};
