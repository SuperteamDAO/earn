import type { NextApiRequest, NextApiResponse } from 'next';

import { withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      const submission = await prisma.submission.findUnique({
        where: { id: id as string },
        select: { ogImage: true },
      });

      if (submission?.ogImage && submission.ogImage !== 'error') {
        logger.warn(`OG image already exists for submission ${id}`);
        return res
          .status(200)
          .json({ success: false, error: 'Image already exists' });
      }

      await prisma.submission.update({
        where: { id: id as string },
        data: { ogImage: url },
      });
    } else if (type === 'pow') {
      const pow = await prisma.poW.findUnique({
        where: { id: id as string },
        select: { ogImage: true },
      });

      if (pow?.ogImage && pow.ogImage !== 'error') {
        logger.warn(`OG image already exists for PoW ${id}`);
        return res
          .status(200)
          .json({ success: false, error: 'Image already exists' });
      }

      await prisma.poW.update({
        where: { id: id as string },
        data: { ogImage: url },
      });
    } else {
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

export default withAuth(handler);
