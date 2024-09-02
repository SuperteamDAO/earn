import type { NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';

import {
  handleInviteAcceptance,
  type NextApiRequestWithUser,
  withAuth,
} from '@/features/auth';
import logger from '@/lib/logger';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  if (req.method !== 'POST') {
    logger.warn(`Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      logger.warn('Unauthorized access attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token } = req.body;
    if (!token) {
      logger.warn('Token is missing in the request body');
      return res.status(400).json({ error: 'Token is required' });
    }

    logger.info(`Processing invite acceptance for user: ${session.user.id}`);
    const result = await handleInviteAcceptance(session.user.id, token);

    if (result.success) {
      logger.info(`Invite acceptance successful: ${result.message}`);
      res.status(200).json({ message: result.message });
    } else {
      logger.warn(`Invite acceptance failed: ${result.message}`);
      res.status(400).json({ error: result.message });
    }
  } catch (error: any) {
    logger.error(`Error in invite acceptance: ${safeStringify(error)}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);
