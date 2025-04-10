import { type NextApiHandler, type NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { type NextApiRequestWithPotentialSponsor } from '../types';

type Handler = (
  req: NextApiRequestWithPotentialSponsor,
  res: NextApiResponse,
) => void | Promise<void>;

export const withPotentialSponsorAuth = (handler: Handler): NextApiHandler => {
  return async (
    req: NextApiRequestWithPotentialSponsor,
    res: NextApiResponse,
  ) => {
    const token = await getToken({ req });
    req.authorized = false;

    if (!token) {
      logger.debug('No token found');
      return handler(req, res);
    }

    const userId = token.sub;
    if (!userId) {
      logger.debug('No user ID found');
      return handler(req, res);
    }

    req.userId = userId;

    try {
      logger.debug(`Fetching user with ID: ${userId}`);
      const user = await prisma.user.findUnique({
        where: { id: userId as string },
        select: { currentSponsorId: true, role: true, hackathonId: true },
      });
      logger.info(`User with ID: ${userId} found`, {
        userId,
        ...user,
      });

      if (!user || !user.currentSponsorId) {
        logger.debug('User does not have a current sponsor or is unauthorized');
        return handler(req, res);
      }

      req.userSponsorId = user.currentSponsorId;
      req.role = user.role;
      req.hackathonId = user.hackathonId || undefined;
      req.authorized = true;
      return handler(req, res);
    } catch (error) {
      logger.debug('Error verifying user sponsor:', error);
      return handler(req, res);
    }
  };
};
