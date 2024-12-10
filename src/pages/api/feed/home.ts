import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const submissions = await prisma.submission.findMany({
      where: {
        isArchived: false,
        isActive: true,
      },
      take: 5,
      select: {
        createdAt: true,
        isWinner: true,
        listing: {
          select: {
            type: true,
            isWinnersAnnounced: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(submissions);
  } catch (error: any) {
    logger.warn(`Error`, safeStringify(error));
    return res
      .status(500)
      .json({ error: 'Error occurred while unfurling the URL.' });
  }
}
