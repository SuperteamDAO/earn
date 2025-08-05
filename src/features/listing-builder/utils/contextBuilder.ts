// used for api route, dont add use client here.
import { type Hackathon, type User } from '@prisma/client';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { type ListingWithSponsor } from '@/features/auth/utils/checkListingSponsorAuth';

const fetchHackathon = async (
  hackathonId?: string,
): Promise<Hackathon | undefined> => {
  if (!hackathonId) return undefined;

  const hackathon = await prisma.hackathon.findUnique({
    where: { id: hackathonId },
  });

  if (hackathonId && hackathon) {
    logger.info('Listings connected hackathon is fetched', {
      hackathonId,
      hackathon,
    });
  }

  return hackathon || undefined;
};

const fetchUser = async (userId: string): Promise<User> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  return user;
};

interface ListingContextParams {
  listing: ListingWithSponsor;
  userId: string;
  hackathonId?: string;
}
export const buildListingContext = async ({
  listing,
  userId,
  hackathonId,
}: ListingContextParams) => {
  try {
    const sponsor = listing.sponsor;
    const [hackathon, user] = await Promise.all([
      fetchHackathon(hackathonId),
      fetchUser(userId),
    ]);
    logger.debug(`Context built successfully for listing`, {
      hasHackathon: !!hackathon,
      sponsorDetails: {
        isVerified: sponsor.isVerified,
        isCaution: sponsor.isCaution,
        st: sponsor.st,
      },
      userRole: user.role,
    });
    return { hackathon, sponsor, user };
  } catch (error) {
    logger.error(`Error building listing context`, {
      error,
    });
    throw error;
  }
};
