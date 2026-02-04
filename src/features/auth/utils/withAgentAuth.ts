import { type NextApiHandler, type NextApiResponse } from 'next';

import logger from '@/lib/logger';

import { type NextApiRequestWithAgent } from '../types';
import { getAgentSession } from './getAgentSession';

type Handler = (
  req: NextApiRequestWithAgent,
  res: NextApiResponse,
) => void | Promise<void>;

export const withAgentAuth = (handler: Handler): NextApiHandler => {
  return async (req: NextApiRequestWithAgent, res: NextApiResponse) => {
    const session = await getAgentSession(req);

    if (!session) {
      logger.error('Unauthorized, Agent session not found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.agentId = session.agentId;
    req.userId = session.userId;

    return handler(req, res);
  };
};
