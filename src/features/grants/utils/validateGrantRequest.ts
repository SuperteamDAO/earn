import { userRegionEligibilty } from '@/features/listings';
import { prisma } from '@/prisma';

export async function validateGrantRequest(userId: string, grantId: string) {
  const grant = await prisma.grants.findUnique({
    where: { id: grantId },
    select: {
      id: true,
      isActive: true,
      isPublished: true,
      region: true,
      minReward: true,
      maxReward: true,
      token: true,
      questions: true,
      isNative: true,
      airtableId: true,
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
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.isTalentFilled === false) {
    throw new Error('Profile not completed');
  }

  const isUserEligibleByRegion = userRegionEligibilty({
    region: grant.region,
    userLocation: user.location || '',
  });

  if (!isUserEligibleByRegion) {
    throw new Error('Region not eligible');
  }

  return { grant, user };
}
