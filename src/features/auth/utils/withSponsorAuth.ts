import { type NextApiHandler, type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { type NextApiRequestWithSponsor } from '../types';
import { getPrivyToken } from './getPrivyToken';

type Handler = (
  req: NextApiRequestWithSponsor,
  res: NextApiResponse,
) => void | Promise<void>;

export const withSponsorAuth = (handler: Handler): NextApiHandler => {
  return async (req: NextApiRequestWithSponsor, res: NextApiResponse) => {
    const privyDid = await getPrivyToken(req);

    if (!privyDid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      logger.debug(`Fetching privyID: ${privyDid}`);
      const user = await prisma.user.findUnique({
        where: { privyDid },
        select: {
          currentSponsorId: true,
          role: true,
          hackathonId: true,
          id: true,
        },
      });

      if (!user || !user.currentSponsorId) {
        logger.warn('User does not have a current sponsor or is unauthorized');
        return res
          .status(403)
          .json({ error: 'User does not have a current sponsor.' });
      }

      req.userId = user.id;
      req.userSponsorId = user.currentSponsorId;
      req.role = user.role;
      req.hackathonId = user.hackathonId || undefined;

      return handler(req, res);
    } catch (error) {
      logger.error('Error verifying user sponsor:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};
