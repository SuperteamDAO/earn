import { prisma } from '@/prisma';
import { getChapterRegions } from '@/utils/chapterRegion';

import { isDeadlineOver } from './deadline';
import { getLocationCooldown } from './locationCooldown';
import { userRegionEligibilty } from './region';

export async function validateSubmissionRequest(
  userId: string,
  listingId: string,
  options?: { actor?: 'user' | 'agent' },
) {
  const actor = options?.actor ?? 'user';
  const isAgent = actor === 'agent';

  const [user, listing, chapterRegions] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.bounties.findUnique({ where: { id: listingId } }),
    getChapterRegions(),
  ]);

  if (!user) throw new Error('User not found');
  if (user.isBlocked) throw new Error('User is blocked');
  if (!listing) throw new Error('Listing not found');
  if (!listing.isActive) throw new Error('Listing not available');
  if (!listing.isPublished) throw new Error('Listing is not published');

  if (isAgent) {
    if (
      listing.agentAccess !== 'AGENT_ALLOWED' &&
      listing.agentAccess !== 'AGENT_ONLY'
    ) {
      throw new Error('Agents are not eligible for this listing');
    }
  } else if (listing.agentAccess === 'AGENT_ONLY') {
    throw new Error('Listing is restricted to agents');
  }

  if (!isAgent && !user.isTalentFilled)
    throw new Error('Unauthorized: Profile incomplete');
  if (
    !isAgent &&
    !userRegionEligibilty({
      region: listing.region,
      userLocation: user.location || '',
      chapters: chapterRegions,
    })
  )
    throw new Error('Region not eligible');
  if (!isAgent) {
    const cooldown = getLocationCooldown({
      locationUpdatedAt: user.locationUpdatedAt,
      listingRegion: listing.region,
      userLocation: user.location,
      chapters: chapterRegions,
    });
    if (cooldown.inCooldown) {
      throw new Error('Location cooldown active');
    }
  }
  if (isDeadlineOver(listing.deadline || ''))
    throw new Error('Submissions closed');

  return { user, listing };
}
