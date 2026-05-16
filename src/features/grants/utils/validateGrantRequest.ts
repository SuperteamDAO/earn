import { prisma } from '@/prisma';
import { getChapterRegions } from '@/utils/chapterRegion';

import { getLocationCooldown } from '@/features/listings/utils/locationCooldown';
import { userRegionEligibilty } from '@/features/listings/utils/region';

export async function validateGrantRequest(
  userId: string,
  grantId: string,
  options?: { skipLocationCooldown?: boolean },
) {
  const grant = await prisma.grants.findUnique({
    where: { id: grantId },
    select: {
      id: true,
      title: true,
      slug: true,
      isActive: true,
      isPublished: true,
      region: true,
      minReward: true,
      maxReward: true,
      token: true,
      questions: true,
      isNative: true,
      airtableId: true,
      isPro: true,
      isST: true,
      sponsor: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!grant) {
    throw new Error('Grant not found');
  }

  if (grant.isActive === false || grant.isPublished === false) {
    throw new Error('Grant is not active');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isBlocked: true,
      isTalentFilled: true,
      isPro: true,
      location: true,
      locationUpdatedAt: true,
      peopleId: true,
      people: {
        select: {
          chapterId: true,
          type: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.isBlocked) {
    throw new Error('User is blocked');
  }

  if (user.isTalentFilled === false) {
    throw new Error('Profile not completed');
  }

  const chapterRegions = await getChapterRegions();
  const isUserEligibleByRegion = userRegionEligibilty({
    region: grant.region,
    userLocation: user.location || '',
    chapters: chapterRegions,
  });

  if (!isUserEligibleByRegion) {
    throw new Error('Region not eligible');
  }

  if (!options?.skipLocationCooldown) {
    const cooldown = getLocationCooldown({
      locationUpdatedAt: user.locationUpdatedAt,
      listingRegion: grant.region,
      userLocation: user.location,
      chapters: chapterRegions,
    });
    if (cooldown.inCooldown) {
      throw new Error('Location cooldown active');
    }
  }

  return { grant, user };
}
