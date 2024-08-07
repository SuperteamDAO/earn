import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function inviteUser(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { invite } = req.query;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  if (!invite || typeof invite !== 'string') {
    logger.warn('Invalid invite ID');
    return res.status(400).json({ error: 'Invalid invite ID.' });
  }

  try {
    logger.debug(`Fetching invite with ID: ${invite}`);
    const result = await prisma.userInvites.findUnique({
      where: {
        id: invite,
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!result) {
      logger.warn(`Invite not found for ID: ${invite}`);
      return res.status(404).json({ error: 'Invite not found.' });
    }

    logger.info(`Invite found for ID: ${invite}`);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error fetching invite with ID: ${invite}`,
      safeStringify(error),
    );
    res.status(500).json({ error: 'Error occurred while getting the invite.' });
  }
}
