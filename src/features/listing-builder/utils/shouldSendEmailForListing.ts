import { type Bounties } from '@prisma/client';
import dayjs from 'dayjs';

export const shouldSendEmailForListing = async (
  listing: Bounties,
): Promise<boolean> => {
  const {
    isPublished,
    isPrivate,
    type,
    compensationType,
    usdValue,
    publishedAt,
  } = listing;

  if (!isPublished || isPrivate || type === 'hackathon') {
    return false;
  }

  const publishedRecently = dayjs().diff(dayjs(publishedAt), 'minute') <= 60;
  if (!publishedRecently) {
    return false;
  }

  if (compensationType === 'variable') {
    return true;
  }

  if (usdValue && usdValue >= 1000) {
    return true;
  }

  return false;
};
