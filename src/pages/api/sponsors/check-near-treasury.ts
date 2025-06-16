import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  logger.info(`Request query: ${safeStringify(req.query)}`);

  if (req.method !== 'GET') {
    logger.warn(`Method not allowed: ${req.method}`);
    return res.status(405).end('Method Not Allowed');
  }

  const { dao } = req.query;

  if (!dao || typeof dao !== 'string') {
    logger.warn('Invalid dao parameter');
    return res
      .status(400)
      .json({ error: 'dao is required and must be a string.' });
  }

  try {
    logger.debug(`Checking availability for dao: ${dao}`);
    const sponsor = await prisma.sponsors.findFirst({
      where: {
        nearTreasury: {
          path: '$.dao',
          equals: dao,
        },
      },
    });

    if (sponsor) {
      logger.info(
        `Sputnik DAO is already connected to another sponsor and not available`,
      );
      return res.status(200).json({ available: false });
    }

    logger.info(`Sputnik DAO is available`);
    return res.status(200).json({ available: true });
  } catch (error: any) {
    logger.error(
      `Error occurred while checking slug availability: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: 'Error occurred while checking the slug availability.',
    });
  }
}
