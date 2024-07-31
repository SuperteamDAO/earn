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

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    logger.warn('Invalid slug parameter');
    return res
      .status(400)
      .json({ error: 'slug is required and must be a string.' });
  }

  try {
    logger.debug(`Checking availability for slug: ${slug}`);
    const sponsor = await prisma.sponsors.findUnique({
      where: { slug },
    });

    if (sponsor) {
      logger.info(`slug ${slug} is not available`);
      return res.status(200).json({ available: false });
    }

    logger.info(`slug ${slug} is available`);
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
