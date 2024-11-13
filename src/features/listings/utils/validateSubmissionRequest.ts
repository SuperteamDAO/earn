import { prisma } from '@/prisma';

import { isDeadlineOver } from './deadline';
import { userRegionEligibilty } from './region';

export async function validateSubmissionRequest(
  userId: string,
  listingId: string,
) {
  const [user, listing] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.bounties.findUnique({ where: { id: listingId } }),
  ]);

  if (!user) throw new Error('User not found');
  if (!user.isTalentFilled) throw new Error('Unauthorized: Profile incomplete');
  if (!listing) throw new Error('Listing not found');
  if (!listing.isPublished && !listing.isActive)
    throw new Error('Listing not available');
  if (
    !userRegionEligibilty({
      region: listing.region,
      userLocation: user.location || '',
    })
  )
    throw new Error('Region not eligible');
  if (isDeadlineOver(listing.deadline || ''))
    throw new Error('Submissions closed');

  return { user, listing };
}
