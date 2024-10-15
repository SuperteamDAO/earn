import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const { slug } = req.body;

    logger.debug(`Fetching subscription status for hackathon slug: ${slug}`);

    const hackathon = await prisma.hackathon.findUnique({
      where: { slug },
    });

    if (!hackathon) {
      logger.warn(`Hackathon not found for slug: ${slug}`);
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    const result = await prisma.subscribeHackathon.findMany({
      where: { hackathonId: hackathon.id, isArchived: false },
    });

    logger.info(`Fetched subscription status for hackathon slug: ${slug}`);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching subscription status for hackathon slug=${req.body.slug}: ${safeStringify(error)}`,
    );
    res.status(400).json({
      error: error.message,
      message: 'Error occurred while fetching subscription status.',
    });
  }
}
