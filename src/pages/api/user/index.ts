import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { userSelectOptions } from '@/features/auth/constants';
import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const privyDid = await getPrivyToken(req);

    if (!privyDid) {
      logger.warn('Unauthorized request - No token provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await prisma.user.findUnique({
      where: { privyDid },
      select: userSelectOptions,
    });

    if (!result) {
      logger.warn(`User not found for privyDid: ${privyDid}`);
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User data retrieved successfully: ${safeStringify(result)}`);
    return res.status(200).json(result);
  } catch (err) {
    logger.error(
      `Error occurred while processing the request: ${safeStringify(err)}`,
    );
    return res
      .status(500)
      .json({ error: 'Error occurred while processing the request.' });
  }
}
