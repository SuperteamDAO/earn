import { type User } from '@/interface/user';

import { type Listing, type ListingWithSubmissions } from '../types';
import { isDeadlineOver } from './deadline';
import { getListingStatus } from './status';

type ListingInput =
  | ListingWithSubmissions
  | Listing
  | {
      type: string;
      deadline?: string | Date | null;
      [key: string]: any;
    };

type UserInput =
  | User
  | {
      role: string;
      [key: string]: any;
    }
  | null;

interface IsListingEditableParams {
  listing: ListingInput;
  user: UserInput;
}

export const isListingEditable = ({
  listing,
  user,
}: IsListingEditableParams) => {
  if (!listing || !user || listing.type === 'grant') {
    return false;
  }

  const listingStatus = getListingStatus(listing);

  if (user.role === 'GOD') {
    return listingStatus !== 'Unpublished';
  }

  if (['Draft', 'Under Verification'].includes(listingStatus)) {
    return true;
  }

  if (listingStatus === 'In Progress') {
    return !isDeadlineOver(listing.deadline ?? undefined);
  }

  return false;
};
