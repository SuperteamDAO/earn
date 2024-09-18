import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { safeStringify } from '@/utils/safeStringify';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;
  const slug = params.slug as string;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    logger.debug(`Fetching bounty template with slug: ${slug}`);
    const result = await prisma.bountiesTemplates.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: {
        poc: true,
        sponsor: true,
      },
    });

    if (!result) {
      logger.warn(`No bounty template found with slug: ${slug}`);
      return res.status(404).json({
        message: `No bounty template found with slug=${slug}.`,
      });
    }

    // set deadline dynamically
    result.deadline = dayjs(new Date()).add(6, 'days').toDate();

    logger.info(`Successfully fetched bounty template for slug: ${slug}`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching bounty template with slug=${slug}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching bounty template with slug=${slug}.`,
    });
  }
}
