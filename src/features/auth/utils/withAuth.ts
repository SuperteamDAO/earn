import { type NextApiHandler, type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { type NextApiRequestWithUser } from '../types';
import { getPrivyToken } from './getPrivyToken';

type Handler = (
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) => void | Promise<void>;

export const withAuth = (handler: Handler): NextApiHandler => {
  return async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const privyDid = await getPrivyToken(req);

    if (!privyDid) {
      logger.error('Unauthorized, Privy Did not found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { privyDid },
      select: { id: true },
    });

    if (!user?.id) {
      logger.warn(`Unauthorized, no user found for privy did ${privyDid}`);
      return res.status(403).json({ error: 'User has no record.' });
    }

    logger.debug(`Authorised user ${user.id} for privy did ${privyDid}`);

    req.userId = user.id;
    return handler(req, res);
  };
};
