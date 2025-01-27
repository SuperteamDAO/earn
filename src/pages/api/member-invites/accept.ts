import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { handleInviteAcceptance } from '@/features/auth/utils/handleInvite';
import { withAuth } from '@/features/auth/utils/withAuth';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  if (req.method !== 'POST') {
    logger.warn(`Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.body;
    const userId = req.userId;
    if (!token || !userId) {
      logger.warn('Token or userId is missing in the request body');
      return res.status(400).json({ error: 'Token or userId is required' });
    }

    logger.info(`Processing invite acceptance for user: ${userId}`);
    const result = await handleInviteAcceptance(userId, token);

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
