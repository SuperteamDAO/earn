import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { type, url, id } = req.body;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  if (!type || !url || !id) {
    logger.warn('Missing required fields');
    return res
      .status(400)
      .json({ success: false, error: 'Missing required fields' });
  }

  try {
    if (type === 'submission') {
      logger.debug(`Updating submission ogImage for ID: ${id}`);
      await prisma.submission.update({
        where: { id: id as string },
        data: {
          ogImage: url,
        },
      });
    } else if (type === 'pow') {
      logger.debug(`Updating PoW ogImage for ID: ${id}`);
      await prisma.poW.update({
        where: { id: id as string },
        data: {
          ogImage: url,
        },
      });
    } else {
      logger.warn('Invalid type provided');
      return res
        .status(400)
        .json({ success: false, error: 'Invalid type provided' });
    }
    logger.info(`Successfully updated ogImage for ${type} with ID: ${id}`);
    res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error(
      `Error updating ogImage for ${type} with ID: ${id}`,
      safeStringify(error),
    );
    res.status(500).json({ success: false, error: error.message });
  }
}
