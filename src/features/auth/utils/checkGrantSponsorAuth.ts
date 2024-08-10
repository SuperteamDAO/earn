import logger from '@/lib/logger';
import { prisma } from '@/prisma';

export const checkGrantSponsorAuth = async (
  userSponsorId: string | undefined,
  grantId: string,
) => {
  if (!userSponsorId) {
    logger.warn('Invalid token: User Sponsor Id is missing');
    return { error: { status: 400, message: 'Invalid token' } };
  }

  const grant = await prisma.grants.findUnique({
    where: { id: grantId },
  });

  if (!grant) {
    logger.warn(`Grant with ID: ${grantId} not found`);
    return {
      error: { status: 404, message: `Bounty with id=${grantId} not found.` },
    };
  }

  if (grant.sponsorId !== userSponsorId) {
    logger.warn(
      `User's sponsor ID does not match grant's sponsor ID for grant ID: ${grantId}`,
    );
    return {
      error: {
        status: 403,
        message: 'User is not authorized to perform this action.',
      },
    };
  }

  return { grant };
};
