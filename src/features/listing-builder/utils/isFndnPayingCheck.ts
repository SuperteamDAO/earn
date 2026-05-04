import logger from '@/lib/logger';
import { isInKindReward } from '@/lib/rewards/inKind';
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
  const { type, token, isFndnPaying: rawIsFndnPaying } = validatedListing;
  const isEligibleSponsor = !!sponsor?.chapter;
  const isFndnPaying =
    isEligibleSponsor && type !== 'project' && !isInKindReward(token)
      ? rawIsFndnPaying
      : false;
  logger.info('Is Foundation Paying', {
    isFndnPaying,
    isEligibleSponsor,
    hasChapter: !!sponsor?.chapter,
    sponsorSlug: sponsor?.slug,
    type,
    token,
    rawIsFndnPaying,
  });
  return isFndnPaying;
};
