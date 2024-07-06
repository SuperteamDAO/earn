import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;
  const slug = params.slug as string;
  try {
    const result = await prisma.bountiesTemplates.findFirst({
      where: {
        slug,
        isActive: true,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    logger.error(error);
    res.status(400).json({
      error,
      message: `Error occurred while fetching bounty template with slug=${slug}.`,
    });
  }
}
