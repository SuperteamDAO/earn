import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { query } = req;
  const userId = query.userId as string;

  logger.debug(`Request query: ${safeStringify(query)}`);

  if (!userId) {
    logger.warn('The "userId" query parameter is missing');
    return res.status(400).json({
      error: 'The "userId" query parameter is missing.',
    });
  }

  try {
    const pows = await prisma.poW.findMany({
      where: {
        userId,
      },
    });

    if (!pows || pows.length === 0) {
      logger.warn(`No PoWs found for userId: ${userId}`);
      return res.status(404).json({
        error: 'No PoWs found for the provided userId',
      });
    }

    logger.info(`Successfully fetched PoWs for userId: ${userId}`);
    return res.status(200).json(pows);
  } catch (error: any) {
    logger.error(
      `Error fetching PoWs for userId ${userId}:`,
      safeStringify(error),
    );
    return res.status(500).json({
      error: `An error occurred while fetching the data: ${error.message}`,
    });
  }
}
