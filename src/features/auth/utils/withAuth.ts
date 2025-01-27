import { type NextApiHandler, type NextApiResponse } from 'next';

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
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { privyDid },
      select: { id: true },
    });

    req.userId = user?.id;
    return handler(req, res);
  };
};
