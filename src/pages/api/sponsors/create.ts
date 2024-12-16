import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import { sponsorBaseSchema } from '@/features/sponsor/utils/sponsorFormSchema';
import { createSponsorEmailSettings } from '@/features/sponsor-dashboard/utils/createSponsorEmailSettings';

async function user(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    logger.debug(`Request body: ${safeStringify(req.body)}`);

    const validationResult = sponsorBaseSchema.safeParse({
      ...req.body,
      twitter:
        req.body.twitter !== undefined
          ? extractSocialUsername('twitter', req.body.twitter) || ''
          : undefined,
    });

    if (!validationResult.success) {
      logger.warn(
        `Invalid sponsor data: ${safeStringify(validationResult.error)}`,
      );
      return res.status(400).json({
        error: 'Invalid sponsor data',
        details: validationResult.error.errors,
      });
    }

    const { name, slug, logo, url, industry, twitter, bio, entityName } =
      validationResult.data;

    if (!user.currentSponsorId || user.role === 'GOD') {
      logger.info(`Creating new sponsor for user: ${userId}`);

      const result = await prisma.sponsors.create({
        data: {
          name,
          slug,
          logo,
          url,
          industry,
          twitter,
          bio,
          entityName,
        },
      });

      await prisma.userSponsors.create({
        data: {
          userId: userId as string,
          sponsorId: result.id,
          role: 'ADMIN',
        },
      });

      await prisma.user.update({
        where: { id: userId as string },
        data: { currentSponsorId: result.id },
      });

      await createSponsorEmailSettings(userId as string);

      logger.info(`New sponsor created successfully for user: ${userId}`);
      return res.status(200).json(result);
    } else {
      logger.warn(
        `User ${userId} does not have permission to create a sponsor`,
      );
      return res.status(403).json({
        message: 'Error occurred while adding a new sponsor.',
      });
    }
  } catch (error: any) {
    logger.error(
      `Error occurred while adding a new sponsor for user ${userId}: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message || 'Internal server error',
      message: 'Error occurred while adding a new sponsor.',
    });
  }
}

export default withAuth(user);
