import { type NextApiHandler, type NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { type NextApiRequestWithUser } from '../types';

type Handler = (
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) => void | Promise<void>;

export const withAuth = (handler: Handler): NextApiHandler => {
  return async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const token = await getToken({ req });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = token.sub;
    if (!userId) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    req.userId = userId;
    return handler(req, res);
  };
};
