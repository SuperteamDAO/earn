import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { generateUniqueRandomUsername } from '@/features/talent/utils/generateUniqueRandomUsername';

export default async function checkUsername(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  logger.info(`Request query: ${safeStringify(req.query)}`);

  if (req.method !== 'GET') {
    logger.warn(`Method not allowed: ${req.method}`);
    return res.status(405).end('Method Not Allowed');
  }

  const { firstName } = req.query;

  if (firstName && typeof firstName !== 'string') {
    logger.warn('Invalid firstName parameter');
    return res.status(400).json({ error: 'firstName is must be a string.' });
  }

  try {
    const username = await generateUniqueRandomUsername(firstName);

    if (!username) {
      logger.error('Could not find a unique username after 10 attempts');
      return res.status(500).json({
        error: 'Could not generate a unique username. Please try again.',
      });
    }

    logger.info(`Username ${username} is available`);
    return res.status(200).json({ available: true, username });
  } catch (error: any) {
    logger.error(
      `Error occurred while checking username availability: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: 'Error occurred while checking the username availability.',
    });
  }
}
