import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { powCreateRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimit } from '@/lib/rateLimiterService';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

interface PoW {
  id?: string;
  userId: string;
  title: string;
  description: string;
  skills: string[];
  subSkills: string[];
  link: string;
  createdAt?: Date;
}

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  if (!userId) {
    logger.warn('The user is not authenticated');
    return res.status(400).json({
      error: 'The user is not authenticated.',
    });
  }

  const canProceed = await checkAndApplyRateLimit(res, {
    limiter: powCreateRateLimiter,
    identifier: userId,
    routeName: 'powCreate',
  });

  if (!canProceed) {
    return;
  }

  const { pows } = req.body as { pows: PoW[] };
  const errors: string[] = [];

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  if (!pows) {
    logger.warn('The "pows" field is missing in the request body');
    return res.status(400).json({
      error: 'The "pows" field is missing in the request body.',
    });
  }

  const dataArray = Array.isArray(pows) ? pows : [pows];
  const createData: PoW[] = [];

  dataArray.forEach((pow) => {
    if (!pow) {
      errors.push('One of the data entries is undefined or null.');
    } else {
      const { title, description, skills, subSkills, link, createdAt } = pow;
      createData.push({
        title,
        userId,
        description,
        skills,
        subSkills,
        link,
        createdAt,
      });
    }
  });

  if (errors.length > 0) {
    logger.warn(`Validation errors: ${errors.join(', ')}`);
    return res.status(400).json({ errors });
  }

  try {
    const results = await prisma.poW.createMany({
      data: createData,
      skipDuplicates: true,
    });
    logger.info(
      `Successfully created ${results.count} PoWs for user ${userId}`,
    );
    return res.status(200).json({ message: 'Success' });
  } catch (error: any) {
    logger.error(
      `Error creating PoWs for user ${userId}:`,
      safeStringify(error),
    );
    return res.status(500).json({
      error: error.message,
    });
  }
}

export default withAuth(handler);
