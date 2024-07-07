import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { grantId } = req.body;

  if (!grantId) {
    logger.warn('grantId is missing in the request body');
    return res.status(400).json({
      message: 'grantId is required in the request body.',
    });
  }

  try {
    logger.debug(`Fetching application count for grant ID: ${grantId}`);
    const applicationCount = await prisma.grantApplication.count({
      where: {
        grantId,
      },
    });

    logger.info(
      `Application count fetched successfully for grant ID: ${grantId}`,
    );
    return res.status(200).json(applicationCount);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching application count for grant ID ${grantId}: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: error.message,
      message: `Error occurred while fetching grant with id=${grantId}.`,
    });
  }
}
