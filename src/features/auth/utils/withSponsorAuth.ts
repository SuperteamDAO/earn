import { type NextApiHandler, type NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { type NextApiRequestWithSponsor } from '../types';

type Handler = (
  req: NextApiRequestWithSponsor,
  res: NextApiResponse,
) => void | Promise<void>;

export const withSponsorAuth = (handler: Handler): NextApiHandler => {
  return async (req: NextApiRequestWithSponsor, res: NextApiResponse) => {
    const token = await getToken({ req });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = token.sub;
    if (!userId) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    req.userId = userId;

    try {
      logger.debug(`Fetching user with ID: ${userId}`);
      const user = await prisma.user.findUnique({
        where: { id: userId as string },
        select: { currentSponsorId: true, role: true },
      });

      if (!user || !user.currentSponsorId) {
        logger.warn('User does not have a current sponsor or is unauthorized');
        return res
          .status(403)
          .json({ error: 'User does not have a current sponsor.' });
      }

      req.userSponsorId = user.currentSponsorId;
      req.role = user.role;

      return handler(req, res);
    } catch (error) {
      logger.error('Error verifying user sponsor:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};
