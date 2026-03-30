import { type User } from '@/interface/user';

import {
  type Listing,
  type ListingWithSubmissions,
} from '../../listings/types';
import { isDeadlineOver } from '../../listings/utils/deadline';
import { getListingStatus } from '../../listings/utils/status';

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
      currentSponsor?: {
        chapter?: {
          id?: string | null;
        } | null;
      } | null;
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
    return true;
  }

  const isLinkedChapterSponsorMember = Boolean(
    user?.currentSponsor?.chapter?.id,
  );

  if (isLinkedChapterSponsorMember && listing?.isWinnersAnnounced) {
    return false;
  }

  if (['Draft', 'Under Verification'].includes(listingStatus)) {
    return true;
  }

  if (listingStatus === 'In Progress') {
    return !isDeadlineOver(listing.deadline ?? undefined);
  }

  if (isLinkedChapterSponsorMember && listingStatus === 'In Review') {
    return true;
  }

  return false;
};
