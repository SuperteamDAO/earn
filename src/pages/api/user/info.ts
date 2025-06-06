// user profile
import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithPotentialSponsor } from '@/features/auth/types';
import { withPotentialSponsorAuth } from '@/features/auth/utils/withPotentialSponsorAuth';

export async function shouldDisplayUserProfile(
  user: { id: string; private: boolean },
  req: NextApiRequestWithPotentialSponsor,
): Promise<boolean> {
  let shouldDisplayProfile = false;

  if (!user.private) {
    shouldDisplayProfile = true;
  }

  if (req.authorized && (req.role === 'GOD' || req.userId === user.id)) {
    shouldDisplayProfile = true;
  }

  if (req.authorized && !shouldDisplayProfile && req.userSponsorId) {
    const entry = await prisma.submission.findFirst({
      where: {
        userId: user.id,
        listing: {
          sponsor: {
            UserSponsors: {
              some: {
                userId: req.userId,
              },
            },
          },
        },
      },
    });

    if (entry) {
      shouldDisplayProfile = true;
    }
  }

  return shouldDisplayProfile;
}

export async function getAllUsers(
  req: NextApiRequestWithPotentialSponsor,
  res: NextApiResponse,
): Promise<void> {
  logger.info(`Request body: ${safeStringify(req.body)}`);

  const { username } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        twitter: true,
        linkedin: true,
        github: true,
        website: true,
        username: true,
        workPrefernce: true,
        name: true,
        skills: true,
        photo: true,
        currentEmployer: true,
        location: true,
        private: true,
      },
    });

    if (!user) {
      logger.warn(
        `User not found for the provided criteria: ${safeStringify(req.body)}`,
      );
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User found: ${user.id}`);

    const shouldDisplay = await shouldDisplayUserProfile(user, req);

    if (!shouldDisplay) {
      return res.status(200).json({
        id: user.id,
        username: user.username,
        photo: user.photo,
        private: true,
      });
    }

    return res.status(200).json({ ...user, private: false });
  } catch (error: any) {
    logger.error(`Error fetching user details: ${safeStringify(error)}`);
    return res
      .status(500)
      .json({ error: `Unable to fetch user details: ${error.message}` });
  }
}

export default withPotentialSponsorAuth(getAllUsers);
