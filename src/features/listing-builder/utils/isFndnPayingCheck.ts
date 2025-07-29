import { type Sponsors } from '@prisma/client';

import logger from '@/lib/logger';

import { type ListingFormData } from '../types';

interface IsFndnPayingCheckProps {
  sponsor: Sponsors;
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
