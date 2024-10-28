import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { categories } = req.body;
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    logger.debug(`Deleting existing email settings for user ID: ${userId}`);
    await prisma.emailSettings.deleteMany({
      where: {
        userId: userId as string,
      },
    });

    logger.debug(
      `Creating new email settings for categories: ${safeStringify(categories)}`,
    );
    await Promise.all(
      categories.map((category: any) =>
        prisma.emailSettings.create({
          data: {
            userId: userId as string,
            category,
          },
        }),
      ),
    );

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user && user.email && categories.length > 0) {
      logger.debug(`Removing unsubscribe entry for email: ${user.email}`);
      await prisma.unsubscribedEmail.deleteMany({
        where: {
          email: user.email,
        },
      });
    }

    logger.info(
      `Email preferences updated successfully for user ID: ${userId}`,
    );
    res
      .status(200)
      .json({ message: 'Email preferences updated successfully!' });
  } catch (error: any) {
    logger.error(
      `Failed to update email preferences for user ID: ${userId} - ${safeStringify(
        error,
      )}`,
    );
    res.status(500).json({ message: 'Internal server error' });
  }
}

export default withAuth(handler);
