import logger from '@/lib/logger';
import { type SponsorsModel } from '@/prisma/models/Sponsors';

import { type ListingFormData } from '../types';

interface IsFndnPayingCheckProps {
  sponsor: SponsorsModel & {
    chapter?: {
      id: string;
    } | null;
  };
  validatedListing: ListingFormData;
}
export const isFndnPayingCheck = ({
  sponsor,
  validatedListing,
}: IsFndnPayingCheckProps) => {
  const { type, isFndnPaying: rawIsFndnPaying } = validatedListing;
  const isEligibleSponsor = !!sponsor?.chapter;
  const isFndnPaying =
    isEligibleSponsor && type !== 'project' ? rawIsFndnPaying : false;
  logger.info('Is Foundation Paying', {
    isFndnPaying,
    isEligibleSponsor,
    hasChapter: !!sponsor?.chapter,
    sponsorSlug: sponsor?.slug,
    type,
    rawIsFndnPaying,
  });
  return isFndnPaying;
};
