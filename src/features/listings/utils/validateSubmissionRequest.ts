import { prisma } from '@/prisma';

import { isDeadlineOver } from './deadline';
import { userRegionEligibilty } from './region';

export async function validateSubmissionRequest(
  userId: string,
  listingId: string,
  options?: { actor?: 'user' | 'agent' },
) {
  const actor = options?.actor ?? 'user';
  const isAgent = actor === 'agent';

  const [user, listing] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.bounties.findUnique({ where: { id: listingId } }),
  ]);

  if (!user) throw new Error('User not found');
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
    })
  )
    throw new Error('Region not eligible');
  if (isDeadlineOver(listing.deadline || ''))
    throw new Error('Submissions closed');

  return { user, listing };
}
