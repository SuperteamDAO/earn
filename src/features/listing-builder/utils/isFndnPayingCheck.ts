import logger from '@/lib/logger';
import { type SponsorsModel } from '@/prisma/models/Sponsors';

import { type ListingFormData } from '../types';

interface IsFndnPayingCheckProps {
  sponsor: SponsorsModel;
  validatedListing: ListingFormData;
}
export const isFndnPayingCheck = ({
  sponsor,
  validatedListing,
}: IsFndnPayingCheckProps) => {
  const { type, isFndnPaying: rawIsFndnPaying } = validatedListing;
  const isFndnPaying =
    sponsor?.st && type !== 'project' ? rawIsFndnPaying : false;
  logger.info('Is Foundation Paying', {
    isFndnPaying,
    st: sponsor?.st,
    type,
    rawIsFndnPaying,
  });
  return isFndnPaying;
};
