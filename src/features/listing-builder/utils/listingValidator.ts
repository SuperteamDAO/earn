// used for api route, dont add use client here.
import { z } from 'zod';

import logger from '@/lib/logger';
import { type HackathonModel } from '@/prisma/models/Hackathon';
import { type SponsorsModel } from '@/prisma/models/Sponsors';
import { type UserModel } from '@/prisma/models/User';

import { type ListingWithSponsor } from '@/features/auth/utils/checkListingSponsorAuth';

import { type ListingFormData, type ListingFormInput } from '../types';
import {
  backendListingRefinements,
  createListingFormSchema,
  createListingRefinements,
} from '../types/schema';
import { checkSlug } from './getValidSlug';

const unwrapToObjectSchema = (schema: z.ZodTypeAny): z.ZodObject<any> => {
  let current: z.ZodTypeAny = schema;
  while (true) {
    if (current instanceof z.ZodPipe) {
      current = current.in as z.ZodTypeAny;
      continue;
    }
    if (
      current instanceof z.ZodDefault ||
      current instanceof z.ZodOptional ||
      current instanceof z.ZodNullable ||
      current instanceof z.ZodCatch ||
      current instanceof z.ZodLazy ||
      current instanceof z.ZodPromise
    ) {
      current = current.unwrap() as z.ZodTypeAny;
      continue;
    }
    break;
  }
  return current as z.ZodObject<any>;
};

interface ListingValidatorParams {
  listing: ListingWithSponsor;
  sponsor: SponsorsModel;
  user: UserModel;
  hackathon: HackathonModel | undefined;
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
    const innerSchema = unwrapToObjectSchema(listingSchema).omit({
      isPublished: true,
      isWinnersAnnounced: true,
      totalWinnersSelected: true,
      totalPaymentsMade: true,
      status: true,
      publishedAt: true,
      sponsorId: true,
    });
    const superValidator = innerSchema.superRefine(async (data, ctx) => {
      const typedData = data as ListingFormInput;
      createListingRefinements(typedData, ctx, hackathon ? [hackathon] : []);
      await backendListingRefinements(typedData, ctx, checkSlug);
    });
    const validatedData = (await superValidator.parseAsync({
      ...(isEditing ? listing : {}),
      ...formData,
    })) as ListingFormData;
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
